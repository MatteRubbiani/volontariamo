// src/app/ai-actions.ts
'use server'

import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ============================================================================
// --- HELPER DI RETE E UTILITY ---
// ============================================================================

function getBaseUrl(rawUrl: string): string {
  try {
    let cleanUrl = rawUrl.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }
    const urlObj = new URL(cleanUrl)
    return `${urlObj.protocol}//${urlObj.host}`
  } catch {
    return rawUrl.replace(/\/+$/, '')
  }
}

function getGoogleFaviconFallback(domainUrl: string): string {
  try {
    const cleanHost = new URL(domainUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=256`
  } catch {
    return ""
  }
}

async function estraiLogoNativo(baseUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(baseUrl, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    if (!res.ok) return getGoogleFaviconFallback(baseUrl)
    const html = await res.text()

    const makeAbsolute = (imgSrc: string) => {
      try { return new URL(imgSrc, baseUrl).href } catch { return imgSrc }
    }

    const imgRegex = /<img[^>]+>/gi
    let match
    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0]
      if (/logo|brand|header-img|site-title/i.test(imgTag)) {
        const srcMatch = imgTag.match(/src=['"]([^'"]+)['"]/i)
        if (srcMatch && srcMatch[1]) {
          const srcUrl = srcMatch[1]
          if (!srcUrl.startsWith('data:image/gif') && !srcUrl.includes('pixel')) return makeAbsolute(srcUrl)
        }
      }
    }

    const ogMatch = html.match(/<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]+)[^>]*>/i)
    if (ogMatch && ogMatch[1]) return makeAbsolute(ogMatch[1])

    return getGoogleFaviconFallback(baseUrl)
  } catch (e) {
    return getGoogleFaviconFallback(baseUrl)
  }
}

// 🛡️ Helper di parsing sicuro contro eventuali blocchi ```json o tag <think>
function parseSafeJson(raw: string) {
  let clean = raw.trim()
  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }
  return JSON.parse(clean || '{}')
}

// 🛡️ WRAPPER RESILIENTE: Prova i modelli attivi in ordine di priorità
const ACTIVE_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b"
]

async function createChatCompletionWithFallback(
  promptGenerator: (isFallback: boolean) => { system: string, user: string },
  temperature = 0.2
) {
  let lastError: any = null

  for (let i = 0; i < ACTIVE_MODELS.length; i++) {
    const model = ACTIVE_MODELS[i]
    const isFallbackMode = i > 0

    try {
      const { system, user } = promptGenerator(isFallbackMode)
      const res = await groq.chat.completions.create({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        model,
        response_format: { type: "json_object" },
        temperature,
      })
      return res
    } catch (error: any) {
      lastError = error
      console.warn(`⚠️ Modello ${model} non disponibile (${error?.status || error?.code}). Tentativo successivo...`)
      continue
    }
  }

  throw lastError
}

// ============================================================================
// 1. ANALISI TESTO ANNUNCIO POSIZIONE
// ============================================================================

export async function analizzaTestoPosizione(testoLibero: string, catalogTags: any[], catalogCompetenze: any[]) {
  if (!testoLibero) return { error: "Scrivi qualcosa!" }

  const generatePrompt = (_isFallback: boolean) => {
    const mappedTags = (catalogTags || []).map(t => ({ id: t.id, name: t.name }))
    const mappedComp = (catalogCompetenze || []).map(c => ({ id: c.id, name: c.name }))
    
    return {
      system: `Sei un assistente esperto del Terzo Settore italiano. Estrai e sintetizza i dati di un annuncio di volontariato.
REGOLE RIGIDE:
1. TIPO: Se cita giorni ripetuti imposta "ricorrente". Se cita una data specifica imposta "una_tantum".
2. GIORNI: Usa solo: "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica".
3. DOVE: Scrivi l'indirizzo o luogo fisico, altrimenti null.
4. COPY: Titolo conciso, descrizione empatica e chiara (3-4 frasi).`,
      user: `TAGS: ${JSON.stringify(mappedTags)}
COMPETENZE: ${JSON.stringify(mappedComp)}
ANNUNCIO: <text>${testoLibero}</text>

Restituisci esclusivamente un JSON valido con questa struttura:
{
  "titolo": "",
  "descrizione": "",
  "tipo": "ricorrente",
  "data_esatta": null,
  "giorni_settimana": [],
  "ora_inizio": null,
  "ora_fine": null,
  "dove": null,
  "tags": [],
  "competenze": []
}`
    }
  }

  try {
    const chatCompletion = await createChatCompletionWithFallback(generatePrompt, 0.2)
    const rawContent = chatCompletion.choices[0]?.message?.content || "{}"
    const data = parseSafeJson(rawContent)
    
    // Normalizzazione Giorni della settimana
    const mapG = { 
      'lunedi': 'Lunedì', 'martedi': 'Martedì', 'mercoledi': 'Mercoledì', 'giovedi': 'Giovedì', 
      'venerdi': 'Venerdì', 'sabato': 'Sabato', 'domenica': 'Domenica' 
    }
    if (Array.isArray(data.giorni_settimana)) {
      data.giorni_settimana = data.giorni_settimana
        .map((g: string) => (mapG as any)[g.toLowerCase().replace(/[^a-z]/g, '')] || g)
        .filter((g: string) => Object.values(mapG).includes(g))
    }

    if (data.giorni_settimana?.length > 0) data.tipo = 'ricorrente'

    return { success: true, data }
  } catch (error: any) {
    console.error("❌ ERRORE DEFINITIVO GROQ:", error?.status, error?.message || error)
    return { error: "Errore durante la compilazione AI. Riprova." }
  }
}

// ============================================================================
// 2. MAGIC ONBOARDING ASSOCIAZIONE
// ============================================================================
export async function magicOnboardingAssociazione(url: string, catalogTags: any[]) {
  if (!url) return { error: "Inserisci un URL valido" }

  try {
    const baseUrl = getBaseUrl(url)
    const pagesToScrape = [baseUrl, `${baseUrl}/chi-siamo`, `${baseUrl}/contatti`]

    const fetchPromises = pagesToScrape.map(targetUrl => 
      fetch(`https://r.jina.ai/${targetUrl}`, { headers: { 'Accept': 'application/json', 'X-Return-Format': 'markdown' }})
        .then(res => res.ok ? res.json() : null)
    )

    const [results, logoScovato] = await Promise.all([
      Promise.allSettled(fetchPromises),
      estraiLogoNativo(baseUrl)
    ])
    
    let combinedContent = ""
    results.forEach((res, i) => {
      if (res.status === 'fulfilled' && res.value?.data?.content) {
        combinedContent += `\n<PAGE url="${pagesToScrape[i]}">\n${res.value.data.content}\n</PAGE>\n`
      }
    })

    if (!combinedContent.trim()) return { error: "Sito web non raggiungibile o protetto contro la scansione." }

    const generatePrompt = (isFallback: boolean) => {
      const maxChars = isFallback ? 5500 : 12000
      let safeContext = combinedContent
      if (safeContext.length > maxChars) {
        safeContext = safeContext.substring(0, maxChars)
        const lastNewLine = safeContext.lastIndexOf('\n')
        if (lastNewLine > 0) safeContext = safeContext.substring(0, lastNewLine)
      }

      const tags = (catalogTags || []).map(t => ({ id: t.id, name: t.name }))

      const system = `Sei un auditor del Registro Unico Nazionale del Terzo Settore (RUNTS).
Estrai l'anagrafica istituzionale dell'ente dal testo del sito web fornito.

REGOLE:
1. FEDELTÀ: Se un dato facoltativo non c'è, lascia "" o null.
2. NO PLACEHOLDER: Non inserire "N/A", "non specificato", "Via della sede".
3. INDIRIZZO: Scrivi SOLO Via e Civico.
4. NOMI: Separa accuratamente Nome e Cognome dei referenti.
5. DESCRIZIONE: Biografia istituzionale dell'ente (massimo 3 frasi).`

      const user = `CATALOGO TAGS (Art. 5 CTS):
${JSON.stringify(tags)}

CONTENUTO DEL SITO WEB:
<website_content>
${safeContext}
</website_content>

Restituisci esclusivamente un JSON valido con i dati estratti:
{
  "denominazione": "",
  "forma_giuridica": "",
  "partita_iva": "",
  "anno_fondazione": "",
  "indirizzo": "",
  "cap": "",
  "provincia": "",
  "email_associazione": "",
  "pec": "",
  "telefono": "",
  "legale_rappresentante_nome": "",
  "legale_rappresentante_cognome": "",
  "referente_progetto_nome": "",
  "referente_progetto_cognome": "",
  "referente_progetto_ruolo": "",
  "num_soci": null,
  "num_volontari_attivi": null,
  "num_dipendenti": null,
  "descrizione": "",
  "tags_suggeriti": []
}`

      return { system, user }
    }

    const chatCompletion = await createChatCompletionWithFallback(generatePrompt, 0.1)
    const rawContent = chatCompletion.choices[0]?.message?.content || "{}"
    const aiData = parseSafeJson(rawContent)
    
    // Sanitizzazione stringhe
    const badPhrases = ['non specificato', 'n/a', 'sconosciuto', 'non presente', 'via e civico', 'string', 'oppure', 'da definire']
    const stringFields = ['denominazione', 'forma_giuridica', 'partita_iva', 'anno_fondazione', 'indirizzo', 'cap', 'provincia', 'email_associazione', 'pec', 'telefono', 'legale_rappresentante_nome', 'legale_rappresentante_cognome', 'referente_progetto_nome', 'referente_progetto_cognome', 'referente_progetto_ruolo', 'descrizione']

    stringFields.forEach(key => {
      let val = aiData[key]
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && !Array.isArray(val)) val = Object.values(val).join(' ')
        val = String(val).trim()
        if (badPhrases.some(p => val.toLowerCase().includes(p)) || val.toLowerCase() === key) val = ""
        aiData[key] = val
      } else {
        aiData[key] = ""
      }
    })

    ;['num_soci', 'num_volontari_attivi', 'num_dipendenti'].forEach(key => {
      const p = parseInt(String(aiData[key]).replace(/\D/g, ''), 10)
      aiData[key] = isNaN(p) ? null : p
    })

    if (!Array.isArray(aiData.tags_suggeriti)) aiData.tags_suggeriti = []
    if (logoScovato) aiData.logo_suggerito = logoScovato
    
    return { success: true, data: aiData }

  } catch (error: any) {
    console.error("❌ Errore Magic Onboarding Deep Scrape:", error)
    return { error: "Impossibile completare l'analisi del sito web in questo momento." }
  }
}