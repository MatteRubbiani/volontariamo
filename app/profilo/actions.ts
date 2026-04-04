'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateProfilo(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Controllo utente
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Non autorizzato")

  const role = formData.get('role') as string
  const nome = formData.get('nome') as string
  const bio = formData.get('bio') as string

  if (role === 'volontario') {
    // 1. Aggiorniamo i dati base del profilo (Nome e Bio)
    const { error: updateError } = await supabase
      .from('volontari')
      .update({ nome_completo: nome, bio: bio })
      .eq('id', user.id)

    if (updateError) throw new Error("Errore aggiornamento profilo")

    // 2. GESTIONE TAG (Interessi)
    // Peschiamo i tag dal form interattivo
    const tags = formData.getAll('tags') as string[]
    
    // Facciamo piazza pulita dei vecchi tag
    await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
    
    // Se ha selezionato dei tag, li inseriamo tutti in un colpo solo
    if (tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        volontario_id: user.id,
        tag_id: tagId
      }))
      await supabase.from('volontario_tags').insert(tagInserts)
    }

    // 3. GESTIONE COMPETENZE (Superpoteri)
    // Peschiamo le competenze dal form
    const competenze = formData.getAll('competenze') as string[]
    
    // Facciamo piazza pulita delle vecchie competenze
    await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
    
    // Inseriamo le nuove competenze
    if (competenze.length > 0) {
      const compInserts = competenze.map(compId => ({
        volontario_id: user.id,
        competenza_id: compId
      }))
      await supabase.from('volontario_competenze').insert(compInserts)
    }

  } else if (role === 'associazione') {
    // Aggiorniamo l'associazione
    const { error } = await supabase
      .from('associazioni')
      .update({ nome: nome, descrizione: bio })
      .eq('id', user.id)

    if (error) throw new Error("Errore aggiornamento associazione")
  }

  // Svuotiamo la cache per far vedere subito le modifiche all'utente
  revalidatePath('/profilo')
  revalidatePath('/profilo/modifica')
}