'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache' // <-- AGGIUNGI QUESTA

export async function updateProfilo(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const role = formData.get('role') as string
  const nome = formData.get('nome') as string
  const bio = formData.get('bio') as string

  if (role === 'volontario') {
    // 1. Aggiorna dati base
    await supabase.from('volontari').update({ nome_completo: nome, bio }).eq('id', user.id)

    // 2. RECUPERO TAG (Log per debug)
    const selectedTags = formData.getAll('tags') as string[]
    console.log("Tag ricevuti dal form:", selectedTags) // <-- Guarda questo nel terminale!

    // 3. CANCELLA E RISCRIVI
    await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
    
    if (selectedTags.length > 0) {
      const tagsToInsert = selectedTags.map(tId => ({ volontario_id: user.id, tag_id: tId }))
      const { error } = await supabase.from('volontario_tags').insert(tagsToInsert)
      if (error) console.error("Errore inserimento tag:", error.message)
    }
  } else {
    await supabase.from('associazioni').update({ nome, descrizione: bio }).eq('id', user.id)
  }

  // QUESTO È IL SEGRETO: Forza Next.js a buttare la vecchia versione della pagina
  revalidatePath('/profilo') 
  redirect('/profilo')
}