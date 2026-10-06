'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Utility per redirect sicuri interni
 */
function getSafeRedirectTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

/**
 * Utility per coordinate geografiche
 */
function parseCoordinate(val: FormDataEntryValue | null): number | null {
  if (typeof val !== 'string' || !val.trim()) return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

/**
 * Generazione slug pulito
 */
function generaSlug(testo: string): string {
  return testo
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * 1. ASSEGNA RUOLO (/app/onboarding)
 */
export async function impostaRuoloEProcedi(
  ruoloScelto: 'volontario' | 'associazione',
  redirectTo?: string | null,
  claimId?: string | null
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Scrittura ruolo su profili
  const { error } = await supabase
    .from('profili')
    .update({ ruolo: ruoloScelto })
    .eq('id', user.id)

  if (error) {
    console.error('Errore assegnazione ruolo:', error.message)
    throw new Error('Impossibile assegnare il ruolo al profilo')
  }

  const params = new URLSearchParams()
  if (redirectTo) params.set('redirectTo', redirectTo)
  if (ruoloScelto === 'associazione' && claimId) params.set('claim_id', claimId)

  const query = params.toString() ? `?${params.toString()}` : ''
  redirect(`/app/onboarding/${ruoloScelto}${query}`)
}

/**
 * 2. COMPLETA WIZARD ONBOARDING
 */
export async function completeOnboarding(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Utente non autenticato' }

    const role = formData.get('role') as string

    // =========================================================================
    // 1. ANAGRAFICA VOLONTARIO (Allineata a public.volontari)
    // =========================================================================
    if (role === 'volontario') {
      const nome = String(formData.get('nome') || '').trim()
      const cognome = String(formData.get('cognome') || '').trim()

      if (!nome || !cognome) {
        return { error: 'Nome e Cognome sono obbligatori' }
      }

      const [volRes, profRes] = await Promise.all([
        supabase.from('volontari').upsert({
          id: user.id,
          nome,
          cognome,
          citta_residenza: formData.get('cittaResidenza') ? String(formData.get('cittaResidenza')).trim() : null,
          cap: formData.get('cap') ? String(formData.get('cap')).trim() : null,
          telefono: formData.get('telefono') ? String(formData.get('telefono')).trim() : null,
          bio: formData.get('bio') ? String(formData.get('bio')).trim() : null,
          data_nascita: formData.get('dataNascita') ? String(formData.get('dataNascita')).trim() : null,
          codice_fiscale: formData.get('codice_fiscale') ? String(formData.get('codice_fiscale')).trim().toUpperCase() : null,
        }),
        supabase.from('profili').update({ ruolo: 'volontario' }).eq('id', user.id)
      ])

      if (volRes.error) return { error: `Errore Volontario: ${volRes.error.message}` }
      if (profRes.error) return { error: `Errore Profilo: ${profRes.error.message}` }
    }

    // =========================================================================
    // 2. ANAGRAFICA ASSOCIAZIONE (Allineata a public.associazioni)
    // =========================================================================
    else if (role === 'associazione') {
      const rawCF = formData.get('codice_fiscale')
      const cf = rawCF ? String(rawCF).toUpperCase().replace(/\s/g, '') : ''
      if (!cf) return { error: 'Codice Fiscale obbligatorio' }

      // Verifica unicità Codice Fiscale
      const { data: existingEntity } = await supabase
        .from('associazioni')
        .select('id')
        .eq('codice_fiscale', cf)
        .maybeSingle()

      if (existingEntity && existingEntity.id !== user.id) {
        return { error: 'Questo Codice Fiscale è già registrato da un altro account.' }
      }

      const denominazione = String(formData.get('denominazione') || 'Associazione').trim()
      const formaGiuridica = String(formData.get('forma_giuridica') || 'APS').trim()
      const emailIstituzionale = String(
        formData.get('email_istituzionale') || formData.get('email') || user.email || ''
      ).trim()

      const indirizzoLegale = String(formData.get('indirizzo_legale') || formData.get('indirizzo') || '').trim()
      const comuneLegale = String(formData.get('comune_legale') || formData.get('comune') || '').trim()
      const provinciaLegale = String(formData.get('provincia_legale') || formData.get('provincia') || '').trim()
      const capLegale = String(formData.get('cap_legale') || formData.get('cap') || '').trim()

      if (!indirizzoLegale || !comuneLegale || !provinciaLegale || !capLegale) {
        return { error: 'Tutti i campi della sede legale (indirizzo, comune, provincia, CAP) sono obbligatori.' }
      }

      const baseSlug = generaSlug(denominazione) || 'ente'
      const slug = `${baseSlug}-${user.id.substring(0, 5)}`

      const { error: assError } = await supabase.from('associazioni').upsert({
        id: user.id,
        slug,
        denominazione,
        codice_fiscale: cf,
        partita_iva: formData.get('partita_iva') ? String(formData.get('partita_iva')).trim() : null,
        forma_giuridica: formaGiuridica,
        email_istituzionale: emailIstituzionale,
        telefono: formData.get('telefono') ? String(formData.get('telefono')).trim() : null,
        sito_web: formData.get('sito_web') ? String(formData.get('sito_web')).trim() : null,
        descrizione: formData.get('descrizione') ? String(formData.get('descrizione')).trim() : null,
        indirizzo_legale: indirizzoLegale,
        comune_legale: comuneLegale,
        provincia_legale: provinciaLegale,
        cap_legale: capLegale,
        lat_legale: parseCoordinate(formData.get('lat_legale') || formData.get('lat')),
        lng_legale: parseCoordinate(formData.get('lng_legale') || formData.get('lng')),
        sezione_runts: formData.get('sezione_runts') ? String(formData.get('sezione_runts')).trim() : null,
        numero_runts: formData.get('numero_runts') ? String(formData.get('numero_runts')).trim() : null,
        referente_nome: formData.get('referente_nome') ? String(formData.get('referente_nome')).trim() : null,
        referente_cognome: formData.get('referente_cognome') ? String(formData.get('referente_cognome')).trim() : null,
        referente_ruolo: formData.get('referente_ruolo') ? String(formData.get('referente_ruolo')).trim() : null,
      }, { onConflict: 'id' })

      if (assError) return { error: `Errore Associazione: ${assError.message}` }

      await supabase.from('profili').update({ ruolo: 'associazione' }).eq('id', user.id)
    }

    // =========================================================================
    // 3. TARGET REDIRECT POST-ONBOARDING
    // =========================================================================
    let defaultTarget = `/app/${role}`
    if (role === 'associazione') {
      defaultTarget = '/app/associazione/oggi'
    }

    const destination = getSafeRedirectTo(formData.get('redirectTo')) || defaultTarget
    return { success: true, destination }
  } catch (err: unknown) {
    console.error('Errore onboarding:', err)
    return { error: err instanceof Error ? err.message : 'Errore durante il salvataggio' }
  }
}