'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function getSafeRedirectTo(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Utente non autenticato')

  const role = formData.get('role') as string
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo')) || `/app/${role}`

  // --- 1. LOGICA VOLONTARIO (Sincronizzata) ---
  if (role === 'volontario') {
    const { error: volError } = await supabase.from('volontari').upsert({
      id: user.id,
      nome: formData.get('nome'),
      cognome: formData.get('cognome'),
      telefono: formData.get('telefono') || null,
      bio: formData.get('bio') || null,
      data_nascita: formData.get('dataNascita') || null,
      sesso: formData.get('sesso') || null,
      citta_residenza: formData.get('cittaResidenza') || null,
      cap: formData.get('cap') || null,
      grado_istruzione: formData.get('gradoIstruzione') || null,
    })

    if (volError) throw new Error(`Errore Volontario: ${volError.message}`)

    const tagsIds = formData.getAll('tags') as string[]
    const compIds = formData.getAll('competenze') as string[]

    // Pulizia e inserimento per tag e competenze
    await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
    if (tagsIds.length > 0) {
      await supabase.from('volontario_tags').insert(tagsIds.map(id => ({ volontario_id: user.id, tag_id: id })))
    }

    await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
    if (compIds.length > 0) {
      await supabase.from('volontario_competenze').insert(compIds.map(id => ({ volontario_id: user.id, competenza_id: id })))
    }
  } 

  // --- 🚀 2. LOGICA ASSOCIAZIONE (ALLINEATA AL NUOVO SCHEMA) ---
  else if (role === 'associazione') {
    
    // A. Anagrafica Core
    const { error: coreError } = await supabase.from('associazioni').upsert({
      id: user.id,
      denominazione: formData.get('denominazione'),
      forma_giuridica: formData.get('forma_giuridica'),
      codice_fiscale: formData.get('codice_fiscale'),
      email_associazione: formData.get('email_associazione'),
      telefono: formData.get('telefono') || null,
      descrizione: formData.get('descrizione') || null,
    })
    
    if (coreError) throw new Error(`Errore Anagrafica: ${coreError.message}`)

    // B. Trasparenza (Con onConflict e Nomi Spaccati)
    const { error: traspError } = await supabase.from('associazioni_trasparenza').upsert({
      associazione_id: user.id,
      // Dati Legale Rappresentante
      legale_rappresentante_nome: formData.get('legale_rappresentante_nome'),
      legale_rappresentante_cognome: formData.get('legale_rappresentante_cognome'),
      // Dati Referente
      referente_progetto_nome: formData.get('referente_progetto_nome'),
      referente_progetto_cognome: formData.get('referente_progetto_cognome'),
      referente_progetto_ruolo: formData.get('referente_progetto_ruolo'),
      // Consensi
      dichiarazione_veridicita: formData.get('dichiarazione_veridicita') === 'true',
      consenso_privacy: formData.get('consenso_privacy') === 'true',
      consenso_newsletter: formData.get('consenso_newsletter') === 'true',
    }, { onConflict: 'associazione_id' }) // 🛡️ PROTEZIONE UNIQUE

    if (traspError) throw new Error(`Errore Trasparenza: ${traspError.message}`)

    // C. Sede (Con onConflict)
    const { error: sedeError } = await supabase.from('associazioni_sedi').upsert({
      associazione_id: user.id,
      indirizzo: formData.get('indirizzo'),
      cap: formData.get('cap'),
      comune: formData.get('comune'),
      provincia: formData.get('provincia'),
      is_principale: true,
      tipologia: 'legale_operativa'
    }, { onConflict: 'associazione_id' }) // 🛡️ PROTEZIONE UNIQUE

    if (sedeError) throw new Error(`Errore Sede: ${sedeError.message}`)

    // D. Gestione Tag/Ambiti (Delete + Insert per pulizia reale)
    const assTags = formData.getAll('tags') as string[]
    await supabase.from('associazione_tags').delete().eq('associazione_id', user.id)
    
    if (assTags.length > 0) {
      const assTagsToInsert = assTags.map(tagId => ({
        associazione_id: user.id,
        tag_id: tagId
      }))
      await supabase.from('associazione_tags').insert(assTagsToInsert)
    }
  }

  // --- 3. LOGICA IMPRESA (Sincronizzata) ---
  else if (role === 'impresa') {
    const { error: impError } = await supabase.from('imprese').upsert({
      id: user.id,
      ragione_sociale: formData.get('nome'),
      forma_giuridica: formData.get('formaGiuridica') || null,
      partita_iva: formData.get('partitaIva') || null,
      codice_fiscale: formData.get('codiceFiscale') || null,
      indirizzo_sede: formData.get('indirizzoSede') || null,
      cap: formData.get('cap') || null,
      sito_web: formData.get('sitoWeb') || null,
      profili_social: formData.get('profiliSocial') || null,
      nome_referente: formData.get('nomeReferente') || null,
      settore_attivita: formData.get('settoreAttivita') || null,
      fascia_dipendenti: formData.get('fasciaDipendenti') || null,
      area_operativa: formData.get('areaOperativa') || null,
      valori_cause: formData.get('valoriCause') || null,
      obiettivi_esg: formData.get('obiettiviEsg') || null,
      tipologia_impatto: formData.get('tipologiaImpatto') || null,
    })
    if (impError) throw new Error(`Errore Impresa: ${impError.message}`)
  }

  // HUB PROFILI
  const { error: profiloError } = await supabase.from('profili').upsert({
    id: user.id,
    ruolo: role
  })

  if (profiloError) throw new Error("Errore finalizzazione profilo.")

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}