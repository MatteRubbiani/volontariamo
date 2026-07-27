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

function parseCoordinate(val: FormDataEntryValue | null): number | null {
  if (typeof val !== 'string' || !val.trim()) return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Utente non autenticato')

  const role = formData.get('role') as string
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo')) || `/app/${role}`

  // =========================================================================
  // 1. LOGICA VOLONTARIO
  // =========================================================================
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

    await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
    if (tagsIds.length > 0) {
      await supabase.from('volontario_tags').insert(tagsIds.map(id => ({ volontario_id: user.id, tag_id: id })))
    }

    await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
    if (compIds.length > 0) {
      await supabase.from('volontario_competenze').insert(compIds.map(id => ({ volontario_id: user.id, competenza_id: id })))
    }
  } 

  // =========================================================================
  // 🚀 2. LOGICA ASSOCIAZIONE (CLAIMING RUNTS & PROTEZIONE ANTI-TROLL)
  // =========================================================================
  else if (role === 'associazione') {
    
    const rawCF = formData.get('codice_fiscale')
    const cf = rawCF ? String(rawCF).toUpperCase().replace(/\s/g, '') : ''
    if (!cf) throw new Error('Codice Fiscale obbligatorio')

    // 🛡️ SICUREZZA 1: Check se il CF esiste già per evitare "Duplicate Key"
    const { data: existingEntity } = await supabase
      .from('associazioni')
      .select('id, claimed')
      .eq('codice_fiscale', cf)
      .maybeSingle()

    if (existingEntity && existingEntity.id !== user.id) {
      if (!existingEntity.claimed) {
        // CLEANUP ARCHITETTURALE: Elimino la scheda importata fittizia
        // per lasciare il posto all'ID reale dell'utente autenticato (user.id)
        await supabase.from('associazioni_sedi').delete().eq('associazione_id', existingEntity.id)
        await supabase.from('associazioni_trasparenza').delete().eq('associazione_id', existingEntity.id)
        await supabase.from('associazione_tags').delete().eq('associazione_id', existingEntity.id)
        await supabase.from('associazioni').delete().eq('id', existingEntity.id)
      } else {
        // L'Associazione è GIA' di qualcun altro che l'ha verificata.
        throw new Error('Questo Codice Fiscale è già stato rivendicato da un altro Referente. Contatta il supporto per contestazioni.')
      }
    }

    // Estraggo Coordinate
    const lat = parseCoordinate(formData.get('lat'))
    const lng = parseCoordinate(formData.get('lng'))
    const comune = formData.get('comune') ? String(formData.get('comune')) : null
    const provincia = formData.get('provincia') ? String(formData.get('provincia')) : null
    const indirizzo = formData.get('indirizzo') ? String(formData.get('indirizzo')) : null

    // A. Crea la Scheda (Modalità Sandbox: in_attesa + PIN visibile subito)
    const { error: coreError } = await supabase.from('associazioni').upsert({
      id: user.id,
      denominazione: formData.get('denominazione'),
      forma_giuridica: formData.get('forma_giuridica') || 'APS',
      codice_fiscale: cf,
      email_associazione: formData.get('email_associazione'),
      telefono: formData.get('telefono') || null,
      descrizione: formData.get('descrizione') || null,
      comune: comune,
      provincia: provincia,
      lat: lat, // Il PIN si accende in tempo reale
      lng: lng, // Il PIN si accende in tempo reale
      claimed: true,
      stato_verifica: 'in_attesa' // 🟡 MODALITÀ SANDBOX DA VERIFICARE
    }, { onConflict: 'id' })
    
    if (coreError) throw new Error(`Errore Anagrafica: ${coreError.message}`)

    // B. Dati Sensibili e Trasparenza (Art. 494 CP accettato)
    const { error: traspError } = await supabase.from('associazioni_trasparenza').upsert({
      associazione_id: user.id,
      referente_progetto_nome: formData.get('referente_progetto_nome'),
      referente_progetto_cognome: formData.get('referente_progetto_cognome'),
      referente_progetto_ruolo: formData.get('referente_progetto_ruolo'),
      dichiarazione_veridicita: formData.get('dichiarazione_legale') === 'true', // Accettazione Disclaimer Penale
      consenso_privacy: formData.get('consenso_privacy') === 'true',
      consenso_newsletter: formData.get('consenso_newsletter') === 'true',
    }, { onConflict: 'associazione_id' })

    if (traspError) throw new Error(`Errore Trasparenza: ${traspError.message}`)

    // C. Sede Ufficiale
    if (indirizzo) {
      await supabase.from('associazioni_sedi').upsert({
        associazione_id: user.id,
        indirizzo: indirizzo,
        cap: formData.get('cap') || '00000',
        comune: comune || 'Modena',
        provincia: provincia || 'MO',
        is_principale: true,
        tipologia: 'legale_operativa',
        lat: lat,
        lng: lng
      }, { onConflict: 'associazione_id' })
    }

    // D. Tags / Ambiti d'azione
    const assTags = formData.getAll('tags') as string[]
    await supabase.from('associazione_tags').delete().eq('associazione_id', user.id)
    if (assTags.length > 0) {
      await supabase.from('associazione_tags').insert(assTags.map(tagId => ({ associazione_id: user.id, tag_id: tagId })))
    }

    // 🚀 NOTA PER IL FUTURO: Qui inserirai lo script per il webhook Telegram
    // fetch('https://api.telegram.org/botTUO_TOKEN/sendMessage?chat_id=TUO_ID&text=Nuova associazione in attesa: ' + formData.get('denominazione'))
  }

  // =========================================================================
  // 3. LOGICA IMPRESA (Sincronizzata)
  // =========================================================================
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

  // Creazione Profilo Hub
  const { error: profiloError } = await supabase.from('profili').upsert({ id: user.id, ruolo: role })
  if (profiloError) throw new Error("Errore finalizzazione profilo.")

  // Revalidate della cache: La mappa si aggiorna subito col nuovo PIN!
  revalidatePath('/', 'layout')
  revalidatePath('/associazioni', 'page')
  revalidatePath('/mappa', 'page')
  revalidatePath(`/app/${role}`, 'layout')
  revalidatePath(`/app/${role}`, 'page')
  
  redirect(redirectTo)
}