'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateProfilo(formData: FormData) {
  // 🐛 STAMPA DI DEBUG PER IL TERMINALE
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

    // 🚨 SICUREZZA: Verifica ruolo
    const { data: profiloHub, error: hubError } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .single()

    if (hubError || !profiloHub?.ruolo) return { error: "Impossibile verificare il ruolo dell'utente." }
    const role = profiloHub.ruolo

    // 📦 ESTRAZIONE TAGS
    const tagsRaw = formData.get('tags_selezionati') as string
    let tags: string[] = []
    try { tags = tagsRaw ? JSON.parse(tagsRaw) : [] } catch (e) { console.error("Errore parse tags", e) }

    // ==========================================================
    // 1. GESTIONE VOLONTARIO
    // ==========================================================
    if (role === 'volontario') {
      const compRaw = formData.get('competenze_selezionate') as string
      let competenze: string[] = []
      try { competenze = compRaw ? JSON.parse(compRaw) : [] } catch (e) { console.error("Errore parse competenze", e) }

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

      await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
      if (tags.length > 0) {
        await supabase.from('volontario_tags').insert(tags.map((id: string) => ({ volontario_id: user.id, tag_id: id })))
      }

      await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
      if (competenze.length > 0) {
        await supabase.from('volontario_competenze').insert(competenze.map((id: string) => ({ volontario_id: user.id, competenza_id: id })))
      }
    } 
    // ==========================================================
    // 🚀 2. GESTIONE ASSOCIAZIONE (SPACCATI NOME/COGNOME)
    // ==========================================================
    else if (role === 'associazione') {
      
      const getInt = (val: FormDataEntryValue | null) => val ? parseInt(val as string, 10) : null
      const getDate = (val: FormDataEntryValue | null) => (val && val !== '') ? (val as string) : null

      // --- A. TABELLA CORE ---
      const { error: coreError } = await supabase
        .from('associazioni')
        .upsert({
          id: user.id,
          denominazione: formData.get('denominazione') as string || null,
          nome_breve: formData.get('denominazione') as string || null,
          codice_fiscale: formData.get('codice_fiscale') as string || null,
          partita_iva: formData.get('partita_iva') as string || null,
          forma_giuridica: formData.get('forma_giuridica') as string || 'Associazione',
          email_associazione: formData.get('email_associazione') as string || user.email || '',
          telefono: formData.get('telefono') as string || null,
          sito_web: formData.get('sito_web') as string || null,
          descrizione: formData.get('descrizione') as string || null,
          logo_url: formData.get('logo_url') as string || null,
          foto_profilo_url: formData.get('logo_url') as string || null,
          anno_fondazione: getInt(formData.get('anno_fondazione')),
        })

      if (coreError) return { error: `Errore anagrafica: ${coreError.message}` }

      // --- B. TABELLA TRASPARENZA (Split Nome/Cognome) ---
      const isRunts = formData.get('is_iscritto_runts') === 'true'
      
      const { error: traspError } = await supabase
        .from('associazioni_trasparenza')
        .upsert({
          associazione_id: user.id,
          is_iscritto_runts: isRunts,
          runts_repertorio: isRunts ? (formData.get('runts_repertorio') as string || null) : null,
          runts_sezione: isRunts ? (formData.get('runts_sezione') as string || null) : null,
          runts_data_iscrizione: isRunts ? getDate(formData.get('runts_data_iscrizione')) : null,
          // Spaccati qui
          legale_rappresentante_nome: formData.get('legale_rappresentante_nome') as string || null,
          legale_rappresentante_cognome: formData.get('legale_rappresentante_cognome') as string || null,
          referente_progetto_nome: formData.get('referente_progetto_nome') as string || 'Non inserito',
          referente_progetto_cognome: formData.get('referente_progetto_cognome') as string || 'Non inserito',
          referente_progetto_ruolo: formData.get('referente_progetto_ruolo') as string || 'Referente',
          pec: formData.get('pec') as string || null,
          num_soci: getInt(formData.get('num_soci')),
          num_volontari_attivi: getInt(formData.get('num_volontari_attivi')),
          num_dipendenti: getInt(formData.get('num_dipendenti')),
          dichiarazione_veridicita: true,
          consenso_privacy: true,
        }, { onConflict: 'associazione_id' })

      if (traspError) return { error: `Errore trasparenza: ${traspError.message}` }

      // --- C. TABELLA SEDI ---
      const comune = formData.get('citta_residenza') as string || formData.get('citta') as string || 'Non specificato'
      
      const { error: sedeError } = await supabase
        .from('associazioni_sedi')
        .upsert({
          associazione_id: user.id,
          tipologia: 'legale_operativa',
          indirizzo: formData.get('indirizzo') as string || formData.get('indirizzo_sede') as string || 'Non specificato',
          cap: formData.get('cap') as string || '00000',
          comune: comune,
          provincia: formData.get('provincia') as string || 'XX',
          is_principale: true
        }, { onConflict: 'associazione_id' })

      if (sedeError) return { error: `Errore sede: ${sedeError.message}` }

      // --- D. GESTIONE TAGS ---
      await supabase.from('associazione_tags').delete().eq('associazione_id', user.id)
      if (tags.length > 0) {
        await supabase.from('associazione_tags').insert(
          tags.map((id: string) => ({ associazione_id: user.id, tag_id: id }))
        )
      }
      
    } else if (role === 'impresa') {
      const { error: impresaError } = await supabase
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

      if (impresaError) return { error: `Errore salvataggio impresa: ${impresaError.message}` }
    }

    revalidatePath('/profilo')
    revalidatePath('/profilo/modifica')
    return { success: true }

  } catch (error: any) {
    return { error: error.message || "Errore critico server." }
  }
}