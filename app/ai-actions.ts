'use server'

import Groq from "groq-sdk"

// Inizializza il client di Groq in modo sicuro sul server
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function generaDescrizioneAI(titolo: string, spunto: string) {
  if (!titolo) return { error: "Inserisci prima il titolo dell'annuncio per dare contesto all'AI." }

  try {
    const prompt = `
      Sei un eccellente copywriter specializzato in impatto sociale. Scrivi una descrizione BREVISSIMA e incisiva per un annuncio di volontariato.
      Titolo dell'annuncio: "${titolo}"
      Spunti e dettagli dall'associazione: "${spunto}"

      REGOLE RIGIDE DI FORMATTAZIONE:
      - LUNGHEZZA MASSIMA: 3 frasi (circa 50-80 parole totali). Devi essere sintetico, diretto e rimuovere il superfluo.
      - STRUTTURA OBBLIGATORIA:
        1. Gancio: Perché questa causa è urgente o importante.
        2. Azione: Cosa farà concretamente il volontario.
        3. Impatto: Il risultato pratico o emotivo del suo aiuto.
      - Tono empatico, persuasivo e giovanile.
      - NESSUNA EMOJI. Zero. Assolutamente vietate.
      - NESSUN HASHTAG.
      - Restituisci SOLO il testo finale pronto da incollare, senza saluti o convenevoli iniziali.
    `

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      // 🚨 FIX: Modello aggiornato all'ultima versione supportata!
      model: "llama-3.3-70b-versatile", 
      temperature: 0.7, 
    })
    const testoGenerato = chatCompletion.choices[0]?.message?.content?.trim() || ''
    
    return { success: true, text: testoGenerato }
    
  } catch (error: any) {
    console.error("Errore Groq API:", error)
    return { error: "I server AI sono al momento occupati. Riprova tra poco." }
  }
}