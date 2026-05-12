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
    const isQuotaError = error?.status === 429 || error?.status === 413 || error?.error?.error?.code === 'rate_limit_exceeded'
    
    if (isQuotaError) {
      console.warn(`⚠️ Ferrari (70B) satura o payload oltre limite. Attivazione Muletto (8B) con Compressione Dinamica...`)
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
  if (!testoLibero) return { error: "Scrivi qualcosa per permettermi di aiutarti!" }

  const generatePrompt = (isFallback: boolean) => {
    // Mappiamo gli array per inviare solo dati essenziali ed evitare distrazioni semantiche
    const mappedTags = catalogTags.map(t => ({ id: t.id, name: t.name }))
    const mappedCompetenze = catalogCompetenze.map(c => ({ id: c.id, name: c.name }))
    
    // Sicurezza: tronchiamo testi chilometrici per non sforare i token
    const safeText = testoLibero.substring(0, isFallback ? 2000 : 4000)

    const system = `Sei un assistente AI esperto in estrazione dati strutturati e copywriting persuasivo per il Terzo Settore italiano.
Il tuo compito è analizzare un testo libero scritto da un'associazione per cercare volontari e compilarne i dati strutturati.

REGOLE RIGIDE DI ESTRAZIONE E COPYWRITING:
1. TITOLO E DESCRIZIONE: Crea un "titolo" professionale e sintetico. Scrivi una "descrizione" persuasiva, accattivante ed empatica (massimo 3 o 4 frasi) per invogliare i volontari a candidarsi, valorizzando l'impatto sociale.
2. CAMPO "DOVE" (CRITICO):
   - Se l'utente cita un luogo noto, un monumento o un punto di interesse (es: "Duomo di Modena", "Parco Sempione Milano", "Stazione Centrale"), DEVI convertirlo nel suo INDIRIZZO STRADALE COMPLETO (Via/Piazza, Civico se noto, Città). Esempio: "Duomo di Modena" -> "Corso Duomo, 41121 Modena MO".
   - Se fornisce già un indirizzo stradale, formattalo in modo standard.
   - Se il luogo è generico, logico o privato (es: "in sede", "da casa", "online", "da remoto", "in centro"), restituisci tassativamente null. Non inventare vie a caso.
3. ANTI-ALLUCINAZIONE: Se un dato (data esatta, orari) non è deducibile con certezza assoluta dal testo, restituisci null. Non inserire mai testi riempitivi come "da definire", "non specificato", "N/A".`

    const user = `LISTA TAG DISPONIBILI:
${JSON.stringify(mappedTags)}

LISTA COMPETENZE DISPONIBILI:
${JSON.stringify(mappedCompetenze)}

TESTO ANNUNCIO INSERITO DALL'UTENTE:
<annuncio>
${safeText}
</annuncio>

Restituisci ESCLUSIVAMENTE il seguente oggetto JSON compilato in modo valido, sostituendo i valori vuoti o null con i dati reali estratti:
{
  "titolo": "",
  "descrizione": "",
  "tipo": "una_tantum",
  "data_esatta": null,
  "giorni_settimana": [],
  "ora_inizio": null,
  "ora_fine": null,
  "dove": null,
  "tags": [],
  "competenze": []
}`

    return { system, user }
  }

  try {
    const chatCompletion = await createChatCompletionWithFallback(generatePrompt, 0.1)
    const data = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}")
    
    // Sanitizzazione al volo per garantire stabilità visiva
    const badPhrases = ['non specificato', 'n/a', 'sconosciuto', 'da definire', 'string']
    ;['titolo', 'descrizione', 'dove'].forEach(key => {
      if (data[key] && typeof data[key] === 'string') {
        data[key] = data[key].trim()
        if (badPhrases.some(p => data[key].toLowerCase().includes(p))) data[key] = ""
      }
    })

    if (!Array.isArray(data.tags)) data.tags = []
    if (!Array.isArray(data.competenze)) data.competenze = []
    if (!Array.isArray(data.giorni_settimana)) data.giorni_settimana = []

    return { success: true, data }
  } catch (error: any) {
    console.error("❌ Errore AI Parser Posizione:", error)
    return { error: "Impossibile elaborare l'annuncio in questo momento. Compila i campi manualmente." }
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