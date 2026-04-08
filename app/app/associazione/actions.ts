'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      } 
    }
  )
}

export async function createPosizione(formData: FormData) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const titolo = formData.get('titolo') as string
  const descrizione = formData.get('descrizione') as string
  const tipo = formData.get('tipo') as string 
  const dove = formData.get('dove') as string
  const ora_inizio = formData.get('ora_inizio') as string
  const ora_fine = formData.get('ora_fine') as string
  const selectedTags = formData.getAll('tags') as string[]
  const selectedCompetenze = formData.getAll('competenze') as string[] // <--- RECUPERIAMO LE COMPETENZE

  const data_esatta = tipo === 'una_tantum' ? (formData.get('data_esatta') as string) : null
  const giorni_settimana = tipo === 'ricorrente' ? (formData.getAll('giorni_settimana') as string[]) : []

  const quando = tipo === 'una_tantum' ? data_esatta : giorni_settimana.join(', ')

  if (!quando) throw new Error("Devi specificare una data o almeno un giorno della settimana.")

  const { data: posizione, error: posError } = await supabase
    .from('posizioni')
    .insert({
      associazione_id: user.id, titolo, descrizione, tipo, dove, ora_inizio, ora_fine, quando, data_esatta, giorni_settimana, 
    })
    .select().single()

  if (posError) throw new Error("Errore salvataggio posizione: " + posError.message)

  if (posizione) {
    // 1. Salvataggio Tag
    if (selectedTags.length > 0) {
      const tagsToInsert = selectedTags.map(tId => ({ posizione_id: posizione.id, tag_id: tId }))
      const { error: tagError } = await supabase.from('posizione_tags').insert(tagsToInsert)
      if (tagError) throw new Error("Errore salvataggio TAG: " + tagError.message)
    }

    // 2. Salvataggio Competenze (Novità!)
    if (selectedCompetenze.length > 0) {
      const compToInsert = selectedCompetenze.map(cId => ({ posizione_id: posizione.id, competenza_id: cId }))
      const { error: compError } = await supabase.from('posizione_competenze').insert(compToInsert)
      if (compError) throw new Error("Errore salvataggio COMPETENZE: " + compError.message)
    }
  }

  revalidatePath('/app/associazione')
  revalidatePath('/app/volontario') 
  redirect('/app/associazione')
}

// --- LA FUNZIONE PER L'UPDATE ---
export async function updatePosizione(id: string, formData: FormData) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const titolo = formData.get('titolo') as string
  const descrizione = formData.get('descrizione') as string
  const tipo = formData.get('tipo') as string 
  const dove = formData.get('dove') as string
  const ora_inizio = formData.get('ora_inizio') as string
  const ora_fine = formData.get('ora_fine') as string
  const selectedTags = formData.getAll('tags') as string[]
  const selectedCompetenze = formData.getAll('competenze') as string[] // <--- RECUPERIAMO LE COMPETENZE

  const data_esatta = tipo === 'una_tantum' ? (formData.get('data_esatta') as string) : null
  const giorni_settimana = tipo === 'ricorrente' ? (formData.getAll('giorni_settimana') as string[]) : []

  const quando = tipo === 'una_tantum' ? data_esatta : giorni_settimana.join(', ')

  if (!quando) throw new Error("Devi specificare una data o almeno un giorno.")

  // 1. Aggiorna la tabella posizioni
  const { error: updateError } = await supabase
    .from('posizioni')
    .update({ titolo, descrizione, tipo, dove, ora_inizio, ora_fine, quando, data_esatta, giorni_settimana })
    .eq('id', id)
    .eq('associazione_id', user.id)

  if (updateError) throw new Error(updateError.message)

  // 2. Resetta i tag vecchi e inserisci i nuovi
  await supabase.from('posizione_tags').delete().eq('posizione_id', id)
  
  if (selectedTags.length > 0) {
    const tagsToInsert = selectedTags.map(tId => ({ posizione_id: id, tag_id: tId }))
    const { error: tagError } = await supabase.from('posizione_tags').insert(tagsToInsert)
    if (tagError) throw new Error("Errore aggiornamento TAG: " + tagError.message)
  }

  // 3. Resetta le competenze vecchie e inserisci le nuove (Novità!)
  await supabase.from('posizione_competenze').delete().eq('posizione_id', id)
  
  if (selectedCompetenze.length > 0) {
    const compToInsert = selectedCompetenze.map(cId => ({ posizione_id: id, competenza_id: cId }))
    const { error: compError } = await supabase.from('posizione_competenze').insert(compToInsert)
    if (compError) throw new Error("Errore aggiornamento COMPETENZE: " + compError.message)
  }

  revalidatePath('/app/associazione')
  revalidatePath('/app/volontario')
  redirect('/app/associazione')
}