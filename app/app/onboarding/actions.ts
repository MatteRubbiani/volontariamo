'use server'

import { createClient } from '@/lib/supabase/server'

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
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Utente non autenticato' }

    const role = formData.get('role') as string

    // =========================================================================
    // 1. LOGICA VOLONTARIO (Esecuzione Parallela Ottimizzata)
    // =========================================================================
    if (role === 'volontario') {
      const tagsIds = formData.getAll('tags') as string[]
      const compIds = formData.getAll('competenze') as string[]

      // Eseguiamo l'anagrafica e il profilo in parallelo
      const [volRes, profRes] = await Promise.all([
        supabase.from('volontari').upsert({
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
        }),
        supabase.from('profili').upsert({ id: user.id, ruolo: role })
      ])

      if (volRes.error) return { error: `Errore Volontario: ${volRes.error.message}` }
      if (profRes.error) return { error: `Errore Profilo: ${profRes.error.message}` }

      // Pulizia e salvataggio tags e competenze in parallelo
      await Promise.all([
        (async () => {
          await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
          if (tagsIds.length > 0) {
            await supabase.from('volontario_tags').insert(tagsIds.map(id => ({ volontario_id: user.id, tag_id: id })))
          }
        })(),
        (async () => {
          await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
          if (compIds.length > 0) {
            await supabase.from('volontario_competenze').insert(compIds.map(id => ({ volontario_id: user.id, competenza_id: id })))
          }
        })()
      ])
    } 

    // =========================================================================
    // 2. LOGICA ASSOCIAZIONE
    // =========================================================================
    else if (role === 'associazione') {
      const rawCF = formData.get('codice_fiscale')
      const cf = rawCF ? String(rawCF).toUpperCase().replace(/\s/g, '') : ''
      if (!cf) return { error: 'Codice Fiscale obbligatorio' }

      const { data: existingEntity } = await supabase
        .from('associazioni')
        .select('id, claimed')
        .eq('codice_fiscale', cf)
        .maybeSingle()

      if (existingEntity && existingEntity.id !== user.id) {
        if (!existingEntity.claimed) {
          await Promise.all([
            supabase.from('associazioni_sedi').delete().eq('associazione_id', existingEntity.id),
            supabase.from('associazioni_trasparenza').delete().eq('associazione_id', existingEntity.id),
            supabase.from('associazione_tags').delete().eq('associazione_id', existingEntity.id),
            supabase.from('associazioni_grafica').delete().eq('associazione_id', existingEntity.id),
          ])
          await supabase.from('associazioni').delete().eq('id', existingEntity.id)
        } else {
          return { error: 'Questo Codice Fiscale è già stato rivendicato da un altro referente.' }
        }
      }

      const lat = parseCoordinate(formData.get('lat'))
      const lng = parseCoordinate(formData.get('lng'))
      const comune = formData.get('comune') ? String(formData.get('comune')) : null
      const provincia = formData.get('provincia') ? String(formData.get('provincia')) : null
      const indirizzo = formData.get('indirizzo') ? String(formData.get('indirizzo')) : null
      const denominazione = String(formData.get('denominazione') || 'Associazione')
      const formaGiuridica = String(formData.get('forma_giuridica') || 'APS')

      const { error: coreError } = await supabase.from('associazioni').upsert({
        id: user.id,
        denominazione,
        nome_breve: formData.get('nome_breve') || null,
        forma_giuridica: formaGiuridica,
        codice_fiscale: cf,
        email_associazione: formData.get('email_associazione'),
        telefono: formData.get('telefono') || null,
        descrizione: formData.get('descrizione') || null,
        comune,
        provincia,
        lat,
        lng,
        claimed: true,
        stato_verifica: 'in_attesa'
      }, { onConflict: 'id' })
      
      if (coreError) return { error: `Errore Anagrafica: ${coreError.message}` }

      const defaultLayout = [
        {
          id: 'hero-def',
          type: 'hero',
          content: {
            title: denominazione,
            eyebrow: formaGiuridica,
            subtitle: comune ? `Sede operativa a ${comune}` : 'Benvenuti nella nostra pagina ufficiale',
            coverUrl: '',
            logoUrl: '',
            brandColor: '#111827'
          }
        },
        {
          id: 'about-def',
          type: 'about',
          content: {
            title: 'Chi Siamo',
            body: `Benvenuti nella pagina ufficiale di ${denominazione}.`
          }
        },
        { id: 'map-def', type: 'map', content: { title: 'La nostra Sede' } },
        { id: 'pos-def', type: 'positions', content: { title: 'Opportunità di Volontariato' } }
      ]

      await Promise.all([
        supabase.from('associazioni_trasparenza').upsert({
          associazione_id: user.id,
          referente_progetto_nome: formData.get('referente_progetto_nome'),
          referente_progetto_cognome: formData.get('referente_progetto_cognome'),
          referente_progetto_ruolo: formData.get('referente_progetto_ruolo'),
          dichiarazione_veridicita: formData.get('dichiarazione_legale') === 'true',
          consenso_privacy: formData.get('consenso_privacy') === 'true',
          consenso_newsletter: formData.get('consenso_newsletter') === 'true',
        }, { onConflict: 'associazione_id' }),
        indirizzo ? supabase.from('associazioni_sedi').upsert({
          associazione_id: user.id,
          indirizzo,
          cap: formData.get('cap') || '00000',
          comune: comune || 'Modena',
          provincia: provincia || 'MO',
          is_principale: true,
          tipologia: 'legale_operativa',
          lat,
          lng
        }, { onConflict: 'associazione_id' }) : Promise.resolve(),
        supabase.from('associazioni_grafica').upsert({
          associazione_id: user.id,
          layout_config: defaultLayout,
          layout_draft: defaultLayout,
          colore_brand: '#111827',
          chi_siamo: `Benvenuti nella pagina ufficiale di ${denominazione}.`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'associazione_id' }),
        supabase.from('profili').upsert({ id: user.id, ruolo: role })
      ])
    }

    // =========================================================================
    // 3. LOGICA IMPRESA
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
      if (impError) return { error: `Errore Impresa: ${impError.message}` }
      await supabase.from('profili').upsert({ id: user.id, ruolo: role })
    }

    // Calcolo destinazione
    let defaultTarget = `/app/${role}`
    if (role === 'associazione') {
      defaultTarget = '/app/associazione/personalizza?firstLogin=true'
    }

    const destination = getSafeRedirectTo(formData.get('redirectTo')) || defaultTarget
    
    // 🚀 Risposta 200 OK istantanea al client
    return { success: true, destination }
  } catch (err: any) {
    console.error("Errore onboarding:", err)
    return { error: err.message || 'Errore durante il salvataggio' }
  }
}