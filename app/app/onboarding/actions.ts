'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Utente non autenticato')

  const role = formData.get('role') as string
  const redirectTo = formData.get('redirectTo') as string || `/app/${role}`

  // --- LOGICA VOLONTARIO ---
  if (role === 'volontario') {
    // Usiamo UPSERT e mappiamo tutti i nuovi campi (usando lo snake_case per il DB)
    const { error: volError } = await supabase.from('volontari').upsert({
      id: user.id,
      nome: formData.get('nome'),
      cognome: formData.get('cognome'),
      telefono: formData.get('telefono') || null,
      bio: formData.get('bio') || null,
      data_nascita: formData.get('dataNascita') || null,
      sesso: formData.get('sesso') || null,
      citta_residenza: formData.get('cittaResidenza') || null,
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
      const { error: tagRelError } = await supabase.from('volontario_tags').upsert(tagsToInsert)
      if (tagRelError) console.error("Errore inserimento tags:", tagRelError.message)
    }

    if (compIds.length > 0) {
      const compToInsert = compIds.map(compId => ({
        volontario_id: user.id,
        competenza_id: compId
      }))
      const { error: compRelError } = await supabase.from('volontario_competenze').upsert(compToInsert)
      if (compRelError) console.error("Errore inserimento competenze:", compRelError.message)
    }
  } 

  // --- LOGICA ASSOCIAZIONE ---
  else if (role === 'associazione') {
    const { error: assError } = await supabase.from('associazioni').upsert({
      id: user.id,
      nome: formData.get('nome'),
      forma_giuridica: formData.get('formaGiuridica') || null,
      codice_fiscale: formData.get('codiceFiscale'),
      citta: formData.get('citta'),
      indirizzo_sede: formData.get('indirizzoSede'),
      telefono: formData.get('telefono'),
      email_contatto: formData.get('emailContatto'),
      nome_referente: formData.get('nomeReferente'),
      sito_web: formData.get('sitoWeb') || null,
      profili_social: formData.get('profiliSocial') || null,
      descrizione: formData.get('mission'),
    })
    
    if (assError) throw new Error(`Errore Associazione: ${assError.message}`)

    const assTags = formData.getAll('tags') as string[]
    if (assTags.length > 0) {
      const assTagsToInsert = assTags.map(tagId => ({
        associazione_id: user.id,
        tag_id: tagId
      }))
      // Usiamo upsert anche qui per sicurezza
      await supabase.from('associazione_tags').upsert(assTagsToInsert)
    }
  }

  // --- LOGICA IMPRESA ---
  else if (role === 'impresa') {
    const { error: impError } = await supabase.from('imprese').upsert({
      id: user.id,
      ragione_sociale: formData.get('nome'),
      forma_giuridica: formData.get('formaGiuridica') || null,
      partita_iva: formData.get('partitaIva') || null,
      codice_fiscale: formData.get('codiceFiscale') || null,
      indirizzo_sede: formData.get('indirizzoSede') || null,
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

  // FINALIZZAZIONE: Scrivi nella tabella Hub "profili"
  const { error: profiloError } = await supabase.from('profili').upsert({
    id: user.id,
    ruolo: role
  })

  if (profiloError) {
    console.error("Errore fatale salvataggio Hub:", profiloError.message)
    throw new Error("Errore durante la finalizzazione del profilo.")
  }

  // 🔄 INVALIDAZIONE CACHE: Forza il refresh della Navbar e dei layout
  revalidatePath('/', 'layout')

  // Redirect pulito verso la dashboard dell'utente
  redirect(redirectTo)
}