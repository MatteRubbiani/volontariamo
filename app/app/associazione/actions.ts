// app/app/associazione/actions.ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/supabase'

type PosizioneInsert = Database['public']['Tables']['posizioni']['Insert']
type PosizioneUpdate = Database['public']['Tables']['posizioni']['Update']

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

function parseCoordinate(val: FormDataEntryValue | null): number | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

function parseOptionalString(val: FormDataEntryValue | null): string | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null
  return val.trim()
}

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

function getSafeArray(formData: FormData, key: string): string[] {
  const raw = formData.get(key)
  if (!raw) return []

  const str = raw.toString().trim()
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str)
      return Array.isArray(parsed) ? parsed : [str]
    } catch {
      return [str]
    }
  }

  const allValues = formData.getAll(key) as string[]
  return allValues.map((v) => v.trim()).filter(Boolean)
}

/**
 * 1. CREAZIONE NUOVA POSIZIONE
 */
export async function createPosizione(formData: FormData) {
  const supabase = await getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Accesso non autorizzato. Effettua il login.')
  }

  const titolo = String(formData.get('titolo') || '').trim()
  const descrizione = String(formData.get('descrizione') || '').trim()

  if (!titolo || !descrizione) {
    throw new Error('Titolo e descrizione sono obbligatori.')
  }

  const tipo = (formData.get('tipo') as PosizioneInsert['tipo']) || 'ricorrente'
  const modalita = (formData.get('modalita') as PosizioneInsert['modalita']) || 'in_sede'
  const stato = (formData.get('stato') as PosizioneInsert['stato']) || 'pubblicata'

  // Anagrafica posizione
  const sedeOperativaId = parseOptionalString(formData.get('sede_operativa_id'))
  const luogoNome = parseOptionalString(formData.get('luogo_nome'))
  const indirizzoSpecifico = parseOptionalString(formData.get('indirizzo_specifico'))
  const comune = parseOptionalString(formData.get('comune'))
  const provincia = parseOptionalString(formData.get('provincia'))
  const lat = parseCoordinate(formData.get('lat'))
  const lng = parseCoordinate(formData.get('lng'))
  const immaginePath = parseOptionalString(formData.get('immagine_path'))

  // Tempistiche e disponibilità
  const dataEsatta = tipo === 'una_tantum' ? parseOptionalString(formData.get('data_esatta')) : null
  const giorniSettimana = tipo === 'ricorrente' ? getSafeArray(formData, 'giorni_settimana') : []
  const oraInizio = parseOptionalString(formData.get('ora_inizio'))
  const oraFine = parseOptionalString(formData.get('ora_fine'))

  let quando = parseOptionalString(formData.get('quando'))
  if (!quando) {
    if (tipo === 'una_tantum' && dataEsatta) {
      quando = dataEsatta
    } else if (giorniSettimana.length > 0) {
      quando = giorniSettimana.join(', ')
    } else {
      quando = 'Disponibilità flessibile'
    }
  }

  const baseSlug = generaSlug(titolo) || 'opportunita'
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  const slug = `${baseSlug}-${randomSuffix}`

  const newPosizione: PosizioneInsert = {
    associazione_id: user.id,
    titolo,
    descrizione,
    tipo,
    modalita,
    stato,
    slug,
    sede_operativa_id: sedeOperativaId,
    luogo_nome: luogoNome,
    indirizzo_specifico: indirizzoSpecifico,
    comune,
    provincia,
    lat,
    lng,
    immagine_path: immaginePath,
    data_esatta: dataEsatta,
    giorni_settimana: giorniSettimana,
    ora_inizio: oraInizio,
    ora_fine: oraFine,
    quando,
  }

  const { data: posizione, error: posError } = await supabase
    .from('posizioni')
    .insert(newPosizione)
    .select('id, slug')
    .single()

  if (posError) {
    throw new Error('Errore salvataggio posizione: ' + posError.message)
  }

  // Tags associati
  const selectedTags = getSafeArray(formData, 'tags')
  if (posizione && selectedTags.length > 0) {
    const tagsToInsert = selectedTags.map((tagId) => ({
      posizione_id: posizione.id,
      tag_id: tagId,
    }))
    const { error: tagsError } = await supabase.from('posizione_tags').insert(tagsToInsert)
    if (tagsError) {
      console.error('Errore associazione tags:', tagsError.message)
    }
  }

  // Invalida cache
  revalidatePath('/app/associazione/posizioni')
  revalidatePath('/app/associazione')
  revalidatePath('/app/volontario')

  const { data: assoc } = await supabase
    .from('associazioni')
    .select('slug')
    .eq('id', user.id)
    .maybeSingle()

  if (assoc?.slug) {
    revalidatePath(`/associazione/${assoc.slug}`)
  }
  if (posizione?.slug) {
    revalidatePath(`/posizione/${posizione.slug}`)
  }

  redirect('/app/associazione/posizioni')
}

/**
 * 2. MODIFICA POSIZIONE ESISTENTE
 */
export async function updatePosizione(id: string, formData: FormData) {
  const supabase = await getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const titolo = String(formData.get('titolo') || '').trim()
  const descrizione = String(formData.get('descrizione') || '').trim()

  if (!titolo || !descrizione) {
    throw new Error('Titolo e descrizione sono obbligatori.')
  }

  const tipo = (formData.get('tipo') as PosizioneUpdate['tipo']) || 'ricorrente'
  const modalita = (formData.get('modalita') as PosizioneUpdate['modalita']) || 'in_sede'
  const stato = formData.get('stato') ? (formData.get('stato') as PosizioneUpdate['stato']) : undefined

  const sedeOperativaId = parseOptionalString(formData.get('sede_operativa_id'))
  const luogoNome = parseOptionalString(formData.get('luogo_nome'))
  const indirizzoSpecifico = parseOptionalString(formData.get('indirizzo_specifico'))
  const comune = parseOptionalString(formData.get('comune'))
  const provincia = parseOptionalString(formData.get('provincia'))
  const lat = parseCoordinate(formData.get('lat'))
  const lng = parseCoordinate(formData.get('lng'))

  const dataEsatta = tipo === 'una_tantum' ? parseOptionalString(formData.get('data_esatta')) : null
  const giorniSettimana = tipo === 'ricorrente' ? getSafeArray(formData, 'giorni_settimana') : []
  const oraInizio = parseOptionalString(formData.get('ora_inizio'))
  const oraFine = parseOptionalString(formData.get('ora_fine'))

  let quando = parseOptionalString(formData.get('quando'))
  if (!quando) {
    if (tipo === 'una_tantum' && dataEsatta) {
      quando = dataEsatta
    } else if (giorniSettimana.length > 0) {
      quando = giorniSettimana.join(', ')
    }
  }

  const rawImg = formData.get('immagine_path')
  const immaginePath = rawImg !== null ? parseOptionalString(rawImg) : undefined

  const updatePayload: PosizioneUpdate = {
    titolo,
    descrizione,
    tipo,
    modalita,
    sede_operativa_id: sedeOperativaId,
    luogo_nome: luogoNome,
    indirizzo_specifico: indirizzoSpecifico,
    comune,
    provincia,
    lat,
    lng,
    data_esatta: dataEsatta,
    giorni_settimana: giorniSettimana,
    ora_inizio: oraInizio,
    ora_fine: oraFine,
    quando,
    updated_at: new Date().toISOString(),
    ...(stato ? { stato } : {}),
    ...(immaginePath !== undefined ? { immagine_path: immaginePath } : {}),
  }

  const { error: updateError } = await supabase
    .from('posizioni')
    .update(updatePayload)
    .eq('id', id)
    .eq('associazione_id', user.id)

  if (updateError) {
    throw new Error('Errore aggiornamento posizione: ' + updateError.message)
  }

  // Sincronizzazione tags
  const selectedTags = getSafeArray(formData, 'tags')
  await supabase.from('posizione_tags').delete().eq('posizione_id', id)
  if (selectedTags.length > 0) {
    const tagsToInsert = selectedTags.map((tagId) => ({
      posizione_id: id,
      tag_id: tagId,
    }))
    await supabase.from('posizione_tags').insert(tagsToInsert)
  }

  revalidatePath('/app/associazione/posizioni')
  revalidatePath('/app/associazione')
  revalidatePath('/app/volontario')

  const [assocRes, posRes] = await Promise.all([
    supabase.from('associazioni').select('slug').eq('id', user.id).maybeSingle(),
    supabase.from('posizioni').select('slug').eq('id', id).maybeSingle(),
  ])

  if (assocRes.data?.slug) {
    revalidatePath(`/associazione/${assocRes.data.slug}`)
  }
  if (posRes.data?.slug) {
    revalidatePath(`/posizione/${posRes.data.slug}`)
  }

  redirect('/app/associazione/posizioni')
}

/**
 * 3. ELIMINAZIONE POSIZIONE
 */
export async function deletePosizione(id: string) {
  const supabase = await getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const { data: posBeforeDelete } = await supabase
    .from('posizioni')
    .select('slug')
    .eq('id', id)
    .eq('associazione_id', user.id)
    .maybeSingle()

  await supabase.from('posizione_tags').delete().eq('posizione_id', id)

  const { error } = await supabase
    .from('posizioni')
    .delete()
    .eq('id', id)
    .eq('associazione_id', user.id)

  if (error) {
    throw new Error("Impossibile eliminare l'annuncio: " + error.message)
  }

  revalidatePath('/app/associazione/posizioni')
  revalidatePath('/app/associazione')
  revalidatePath('/app/volontario')

  const { data: assoc } = await supabase
    .from('associazioni').select('slug').eq('id', user.id).maybeSingle()

  if (assoc?.slug) {
    revalidatePath(`/associazione/${assoc.slug}`)
  }
  if (posBeforeDelete?.slug) {
    revalidatePath(`/posizione/${posBeforeDelete.slug}`)
  }

  redirect('/app/associazione/posizioni')
}