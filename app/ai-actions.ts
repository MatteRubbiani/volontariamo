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

// 🛡️ WRAPPER EVOLUTO: Gestione automatica e trasparente tra Ferrari (70B) e Muletto (8B)
async function createChatCompletionWithFallback(
  promptGenerator: (isFallback: boolean) => { system: string, user: string },
  temperature = 0.0
) {
  const primaryModel = "llama-3.3-70b-versatile"
  const fallbackModel = "llama-3.1-8b-instant"
  try {
    const { system, user } = promptGenerator(false)
    return await groq.chat.completions.create({
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      model: primaryModel,
      response_format: { type: "json_object" },
      temperature,
    })
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.status === 413 || error?.error?.error?.code === 'rate_limit_exceeded'
    if (isQuota) {
      const { system, user } = promptGenerator(true)
      return await groq.chat.completions.create({
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        model: fallbackModel,
        response_format: { type: "json_object" },
        temperature,
      })
    }
    throw error
  }
}

// ============================================================================
// 1. ANALISI TESTO ANNUNCIO POSIZIONE (DOPPIA STRATEGIA IMPLEMENTATA)
// ============================================================================

export async function analizzaTestoPosizione(testoLibero: string, catalogTags: any[], catalogCompetenze: any[]) {
  if (!testoLibero) return { error: "Scrivi qualcosa!" }

  const generatePrompt = (isFallback: boolean) => {
    const mappedTags = catalogTags.map(t => ({ id: t.id, name: t.name }))
    const mappedComp = catalogCompetenze.map(c => ({ id: c.id, name: c.name }))
    
    return {
      system: `Sei un esperto di Terzo Settore. Estrai dati da un annuncio di volontariato.
      REGOLE RIGIDE:
      1. TIPO: Se l'annuncio cita giorni ripetuti (es. "ogni martedì", "i weekend") imposta "ricorrente". Se cita una data singola o "domani", "una_tantum".
      2. GIORNI: Usa solo: "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica".
      3. DOVE: Converti monumenti/luoghi famosi in indirizzi reali. Altrimenti null.
      4. COPY: Titolo professionale, descrizione empatica (3-4 frasi).`,
      user: `TAGS: ${JSON.stringify(mappedTags)}\nCOMPETENZE: ${JSON.stringify(mappedComp)}\nANNUNCIO: <text>${testoLibero}</text>\n\nRestituisci JSON: {"titolo":"","descrizione":"","tipo":"una_tantum"|"ricorrente","data_esatta":null,"giorni_settimana":[],"ora_inizio":null,"ora_fine":null,"dove":null,"tags":[],"competenze":[]}`
    }
  }

  try {
    const chatCompletion = await createChatCompletionWithFallback(generatePrompt, 0.1)
    const data = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}")
    
    // Normalizzazione Giorni per il Frontend
    const mapG = { 
      'lunedi': 'Lunedì', 'martedi': 'Martedì', 'mercoledi': 'Mercoledì', 'giovedi': 'Giovedì', 
      'venerdi': 'Venerdì', 'sabato': 'Sabato', 'domenica': 'Domenica' 
    }
    if (Array.isArray(data.giorni_settimana)) {
      data.giorni_settimana = data.giorni_settimana
        .map((g: string) => (mapG as any)[g.toLowerCase().replace(/[^a-z]/g, '')] || g)
        .filter((g: string) => Object.values(mapG).includes(g))
    }

    // Forza 'ricorrente' se ci sono giorni selezionati
    if (data.giorni_settimana?.length > 0) data.tipo = 'ricorrente'

    return { success: true, data }
  } catch (error) {
    return { error: "Errore AI" }
  }
}

// ============================================================================
// 2. MAGIC ONBOARDING ASSOCIAZIONE (FERRARI + MULETTO OPTIMIZED)
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
      // Ottimizzazione dinamica della lunghezza del contesto per rientrare nei TPM
      const maxChars = isFallback ? 5500 : 20000
      let safeContext = combinedContent
      if (safeContext.length > maxChars) {
        safeContext = safeContext.substring(0, maxChars)
        const lastNewLine = safeContext.lastIndexOf('\n')
        if (lastNewLine > 0) safeContext = safeContext.substring(0, lastNewLine)
      }

      const tags = catalogTags.map(t => isFallback ? { id: t.id, name: t.name } : { id: t.id, name: t.name, category: t.categoria })

      const system = `Sei un auditor esperto del Registro Unico Nazionale del Terzo Settore (RUNTS).
Il tuo compito è estrarre l'anagrafica istituzionale dell'ente dal testo del sito web fornito.

REGOLE RIGIDE (ANTI-PLACEHOLDER):
1. FEDELTÀ: Se un dato facoltativo non è esplicitamente presente, lascia la stringa vuota "" o null.
2. NO SPAZZATURA: Non copiare istruzioni e non inserire testi come "Via della sede", "non specificato", "N/A".
3. INDIRIZZO: Scrivi SOLO Via e Civico. Comune, Provincia e CAP vanno nei rispettivi campi.
4. NOMI: Separa sempre in modo accurato Nome e Cognome dei referenti o del Presidente.
5. DESCRIZIONE: Scrivi una biografia istituzionale e persuasiva dell'ente (massimo 3 frasi).`

      const user = `CATALOGO TAGS (Art. 5 CTS):
${JSON.stringify(tags)}

CONTENUTO ESTRATTO DAL SITO WEB:
<website_content>
${safeContext}
</website_content>

Compila e restituisci ESCLUSIVAMENTE il seguente oggetto JSON, sostituendo i valori vuoti o null con i dati reali estratti:
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

    const chatCompletion = await createChatCompletionWithFallback(generatePrompt, 0.0)
    const aiData = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}")
    
    // 🧹 SANITIZZAZIONE RIGIDA E TIPIZZATA
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
    }); // <--- Punto e virgola obbligatorio per evitare l'errore ASI di TypeScript

    ['num_soci', 'num_volontari_attivi', 'num_dipendenti'].forEach(key => {
      const p = parseInt(String(aiData[key]).replace(/\D/g, ''), 10)
      aiData[key] = isNaN(p) ? null : p
    })

    if (!Array.isArray(aiData.tags_suggeriti)) aiData.tags_suggeriti = []
    if (logoScovato) aiData.logo_suggerito = logoScovato
    
    return { success: true, data: aiData }

  } catch (error: any) {
    console.error("❌ Errore Magic Onboarding Deep Scrape:", error)
    return { error: "Impossibile completare l'analisi avanzata del sito web in questo momento." }
  }
}