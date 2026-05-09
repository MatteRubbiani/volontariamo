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

  // --- LOGICA VOLONTARIO (Invariata) ---
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

    if (volError) throw new Error(`Errore creazione Volontario: ${volError.message}`)

    const tagsIds = formData.getAll('tags') as string[]
    const compIds = formData.getAll('competenze') as string[]

    if (tagsIds.length > 0) {
      const tagsToInsert = tagsIds.map(tagId => ({
        volontario_id: user.id,
        tag_id: tagId
      }))
      await supabase.from('volontario_tags').upsert(tagsToInsert)
    }

    if (compIds.length > 0) {
      const compToInsert = compIds.map(compId => ({
        volontario_id: user.id,
        competenza_id: compId
      }))
      await supabase.from('volontario_competenze').upsert(compToInsert)
    }
  } 

  // --- 🚀 LOGICA ASSOCIAZIONE (AGGIORNATA E PROFESSIONALE) ---
  else if (role === 'associazione') {
    
    // 1. Inserimento Anagrafica Core
    const { error: coreError } = await supabase.from('associazioni').upsert({
      id: user.id,
      denominazione: formData.get('denominazione'),
      forma_giuridica: formData.get('forma_giuridica'),
      codice_fiscale: formData.get('codice_fiscale'),
      email_associazione: formData.get('email_associazione'),
      telefono: formData.get('telefono') || null,
      descrizione: formData.get('descrizione') || null,
    })
    
    if (coreError) throw new Error(`Errore Core Associazione: ${coreError.message}`)

    // 2. Inserimento Dati Legali e Trasparenza (Referente e Consensi)
    const { error: traspError } = await supabase.from('associazioni_trasparenza').upsert({
      associazione_id: user.id,
      referente_progetto_nome: formData.get('referente_progetto_nome'),
      referente_progetto_cognome: formData.get('referente_progetto_cognome'),
      referente_progetto_ruolo: formData.get('referente_progetto_ruolo'),
      dichiarazione_veridicita: formData.get('dichiarazione_veridicita') === 'true',
      consenso_privacy: formData.get('consenso_privacy') === 'true',
      consenso_newsletter: formData.get('consenso_newsletter') === 'true',
    })

    if (traspError) throw new Error(`Errore Trasparenza: ${traspError.message}`)

    // 3. Inserimento Sede Operativa Principale
    const { error: sedeError } = await supabase.from('associazioni_sedi').upsert({
      associazione_id: user.id,
      indirizzo: formData.get('indirizzo'),
      cap: formData.get('cap'),
      comune: formData.get('comune'),
      provincia: formData.get('provincia'),
      is_principale: true,
      tipologia: 'operativa'
    })

    if (sedeError) throw new Error(`Errore Sede: ${sedeError.message}`)

    // 4. Gestione Tag/Ambiti
    const assTags = formData.getAll('tags') as string[]
    if (assTags.length > 0) {
      const assTagsToInsert = assTags.map(tagId => ({
        associazione_id: user.id,
        tag_id: tagId
      }))
      // Nota: ho mantenuto 'associazione_tags' per compatibilità, 
      // ma se hai rinominato la tabella in 'associazioni_settori_scelti' cambiala qui sotto.
      await supabase.from('associazione_tags').upsert(assTagsToInsert)
    }
  }

  // --- LOGICA IMPRESA (Invariata) ---
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

  // FINALIZZAZIONE: Hub "profili"
  const { error: profiloError } = await supabase.from('profili').upsert({
    id: user.id,
    ruolo: role
  })

  if (profiloError) throw new Error("Errore durante la finalizzazione del profilo.")

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}