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