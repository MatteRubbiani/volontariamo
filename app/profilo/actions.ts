'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateProfilo(formData: FormData) {
  // 🐛 STAMPA DI DEBUG
  console.log("📦 DATI RICEVUTI DAL FORM:", Object.fromEntries(formData.entries()))

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Utente non autorizzato o sessione scaduta." }

    // 🚨 SICUREZZA PREMIUM: Chiediamo il ruolo al DB
    const { data: profiloHub, error: hubError } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .single()

    if (hubError || !profiloHub?.ruolo) return { error: "Impossibile verificare il ruolo dell'utente." }
    const role = profiloHub.ruolo

    // 📦 ESTRAZIONE ARRAY SICURA
    const tagsRaw = formData.get('tags_selezionati') as string
    let tags = []
    try { tags = tagsRaw ? JSON.parse(tagsRaw) : [] } catch (e) { console.error("Errore parse tags", e) }

    // ==========================================
    // 1. GESTIONE VOLONTARIO
    // ==========================================
    if (role === 'volontario') {
      const compRaw = formData.get('competenze_selezionate') as string
      let competenze = []
      try { competenze = compRaw ? JSON.parse(compRaw) : [] } catch (e) { console.error("Errore parse competenze", e) }

      // Fix per stringhe vuote nelle date
      let dataNascita = formData.get('data_nascita') as string | null
      if (dataNascita === '') dataNascita = null

      const { error: updateError } = await supabase
        .from('volontari')
        .update({
          nome: formData.get('nome') as string || null,
          cognome: formData.get('cognome') as string || null,
          bio: formData.get('bio') as string || null,
          email_contatto: formData.get('email_contatto') as string || null,
          telefono: formData.get('telefono') as string || null,
          citta_residenza: formData.get('citta_residenza') as string || null,
          cap: formData.get('cap') as string || null,
          data_nascita: dataNascita,
          sesso: formData.get('sesso') as string || null,
          grado_istruzione: formData.get('grado_istruzione') as string || null,
          foto_profilo_url: formData.get('foto_profilo_url') as string || null,
        })
        .eq('id', user.id)

      if (updateError) return { error: `Errore aggiornamento dati: ${updateError.message}` }

      // 🚨 FIX: Catturiamo gli errori nella cancellazione e inserimento dei Tags
      const { error: delTagsErr } = await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
      if (delTagsErr) return { error: `Errore pulizia cause: ${delTagsErr.message}` }

      if (tags.length > 0) {
        const { error: insTagsErr } = await supabase.from('volontario_tags').insert(tags.map((id: string) => ({ volontario_id: user.id, tag_id: id })))
        if (insTagsErr) return { error: `Errore salvataggio cause: ${insTagsErr.message}` }
      }

      // 🚨 FIX: Catturiamo gli errori nella cancellazione e inserimento delle Competenze
      const { error: delCompErr } = await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
      if (delCompErr) return { error: `Errore pulizia competenze: ${delCompErr.message}` }

      if (competenze.length > 0) {
        const { error: insCompErr } = await supabase.from('volontario_competenze').insert(competenze.map((id: string) => ({ volontario_id: user.id, competenza_id: id })))
        if (insCompErr) return { error: `Errore salvataggio competenze: ${insCompErr.message}` }
      }

    // ==========================================
    // 2. GESTIONE ASSOCIAZIONE
    // ==========================================
    } else if (role === 'associazione') {
      const { error } = await supabase
        .from('associazioni')
        .upsert({
          id: user.id,
          nome: formData.get('nome') as string || null, 
          descrizione: formData.get('bio') as string || null, 
          forma_giuridica: formData.get('forma_giuridica') as string || null,
          codice_fiscale: formData.get('codice_fiscale') as string || null,
          citta: formData.get('citta_residenza') as string || null, 
          indirizzo_sede: formData.get('indirizzo_sede') as string || null,
          telefono: formData.get('telefono') as string || null,
          email_contatto: formData.get('email_contatto') as string || null,
          nome_referente: formData.get('nome_referente') as string || null,
          sito_web: formData.get('sito_web') as string || null,
          profili_social: formData.get('profili_social') as string || null,
          // 🚨 ECCO IL CAMPO MANCANTE AGGIUNTO:
          foto_profilo_url: formData.get('foto_profilo_url') as string || null,
        })

      if (error) {
        console.error("❌ ERRORE UPDATE ASSOCIAZIONE:", error.message)
        return { error: `Errore salvataggio associazione: ${error.message}` }
      }

      // 🚨 Pulizia e inserimento Tag Associazione
      const { error: delAssTagsErr } = await supabase.from('associazione_tags').delete().eq('associazione_id', user.id)
      if (delAssTagsErr) return { error: `Errore pulizia cause associazione: ${delAssTagsErr.message}` }

      if (tags.length > 0) {
        const { error: insAssTagsErr } = await supabase.from('associazione_tags').insert(tags.map((id: string) => ({ associazione_id: user.id, tag_id: id })))
        if (insAssTagsErr) return { error: `Errore salvataggio cause associazione: ${insAssTagsErr.message}` }
      }
      
    // ==========================================
    // 3. GESTIONE IMPRESA
    // ==========================================
    } else if (role === 'impresa') {
      const { error } = await supabase
        .from('imprese')
        .update({
          ragione_sociale: formData.get('nome') as string || null,
          forma_giuridica: formData.get('forma_giuridica') as string || null,
          partita_iva: formData.get('partita_iva') as string || null,
          codice_fiscale: formData.get('codice_fiscale') as string || null,
          settore_attivita: formData.get('settore_attivita') as string || null,
          fascia_dipendenti: formData.get('fascia_dipendenti') as string || null,
          indirizzo_sede: formData.get('indirizzo_sede') as string || null,
          area_operativa: formData.get('area_operativa') as string || null,
          nome_referente: formData.get('nome_referente') as string || null,
          sito_web: formData.get('sito_web') as string || null,
          profili_social: formData.get('profili_social') as string || null,
          obiettivi_esg: formData.get('obiettivi_esg') as string || null,
          valori_cause: formData.get('valori_cause') as string || null,
          tipologia_impatto: formData.get('tipologia_impatto') as string || null,
        })
        .eq('id', user.id)

      if (error) {
        console.error("❌ ERRORE UPDATE IMPRESA:", error.message)
        return { error: `Errore salvataggio impresa: ${error.message}` }
      }
    }

    // 🚨 SUCCESS PATH
    revalidatePath('/profilo')
    revalidatePath('/profilo/modifica')
    revalidatePath('/', 'layout')
    
    return { success: true }

  } catch (error: any) {
    console.error("🚨 ERRORE FATALE SERVER ACTION:", error)
    return { error: error.message || "Si è verificato un errore critico sul server." }
  }
}