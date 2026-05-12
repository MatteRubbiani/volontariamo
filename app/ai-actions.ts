'use server'

import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function analizzaTestoPosizione(testoLibero: string, catalogTags: any[], catalogCompetenze: any[]) {
  if (!testoLibero) return { error: "Scrivi qualcosa per permettermi di aiutarti!" }

  const prompt = `
    Sei un assistente AI esperto in estrazione dati e copywriting.
    L'utente ti fornisce un testo grezzo per un annuncio di volontariato.
    
    IL TUO COMPITO:
    1. Estrarre i dati strutturati.
    2. Creare un TITOLO professionale e una DESCRIZIONE persuasiva (max 3 frasi, tono empatico).

    TESTO UTENTE: "${testoLibero}"

    LISTA TAG: ${JSON.stringify(catalogTags.map(t => ({id: t.id, name: t.name})))}
    LISTA COMPETENZE: ${JSON.stringify(catalogCompetenze.map(c => ({id: c.id, name: c.name})))}

    REGOLE RIGIDE PER IL CAMPO "DOVE":
    - Se l'utente cita un luogo noto, un monumento o un punto di interesse (es: "Duomo di Modena", "Parco Sempione", "Stazione Centrale Milano"), DEVI convertirlo nel suo INDIRIZZO STRADALE COMPLETO (Via/Piazza, Numero Civico se noto, Città).
    - Esempio: "Duomo di Modena" -> "Corso Duomo, 41121 Modena MO".
    - Se l'utente fornisce già un indirizzo, formattalo correttamente.
    - Se il luogo è vago o privato (es: "in sede", "a casa mia", "al parchetto dietro l'angolo", "in centro"), restituisci NULL. Non inventare indirizzi per luoghi che non puoi localizzare con certezza su una mappa globale.

    SCHEMA JSON RICHIESTO:
    {
      "titolo": "string",
      "descrizione": "string",
      "tipo": "una_tantum" | "ricorrente",
      "data_esatta": "YYYY-MM-DD",
      "giorni_settimana": ["Lunedì", ...],
      "ora_inizio": "HH:MM",
      "ora_fine": "HH:MM",
      "dove": "Indirizzo Completo o null", 
      "tags": ["id_tag"],
      "competenze": ["id_comp"]
    }

    Restituisci solo il JSON.
  `

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.2, 
    })

    const data = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}")
    return { success: true, data }
  } catch (error: any) {
    console.error("Errore AI Parser:", error)
    return { error: "Impossibile decifrare il testo." }
  }
}

export async function magicOnboardingAssociazione(url: string, catalogTags: any[]) {
  if (!url) return { error: "Inserisci un URL valido" }

  try {
    // 1. 🕷️ SCRAPING: Usiamo Jina Reader per trasformare il sito in testo leggibile dall'AI
    const scrapeResponse = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'application/json' }
    })
    const scrapeData = await scrapeResponse.json()
    const sitoTesto = scrapeData.data.content // Testo pulito del sito

    // 2. 🧠 PROMPT PER GROQ
    const prompt = `
      Sei un esperto del Terzo Settore italiano (D.Lgs 117/2017).
      Analizza il testo del sito web di questa associazione e compila il profilo in formato JSON.

      REGOLE DI ESTRAZIONE:
      - DESCRIZIONE: Scrivi una missione coinvolgente di max 4 frasi basandoti sul "Chi Siamo".
      - TAGS: Seleziona gli ID corretti basandoti sull'Articolo 5 del Codice Terzo Settore.
      - CONTATTI: Cerca email, telefono e PEC (spesso nel footer).
      - GOVERNANCE: Se menzionati, estrai nome e cognome del Presidente (Legale Rappresentante).

      CATALOGO TAG DISPONIBILI (Usa questi ID):
      ${JSON.stringify(catalogTags.map(t => ({ id: t.id, name: t.name, desc: t.description })))}

      TESTO DEL SITO:
      ${sitoTesto.substring(0, 10000)} -- Taglio per limiti context

      RISPONDI SOLO CON QUESTO SCHEMA JSON:
      {
        "denominazione": "string",
        "descrizione": "string",
        "email_associazione": "string",
        "telefono": "string",
        "pec": "string",
        "sito_web": "${url}",
        "legale_rappresentante_nome": "string",
        "legale_rappresentante_cognome": "string",
        "tags_suggeriti": ["id_tag"]
      }
    `

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.1, // Bassa per essere precisi
    })

    const aiData = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}")
    return { success: true, data: aiData }

  } catch (error: any) {
    console.error("Errore Magic Onboarding:", error)
    return { error: "Impossibile analizzare il sito. Inserisci i dati manualmente." }
  }
}