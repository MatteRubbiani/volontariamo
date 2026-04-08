'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Verifichiamo chi è l'utente
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Utente non autenticato")

  const role = formData.get('role') as string

  if (role === 'volontario') {
    const nome = formData.get('nome') as string

    // 1. Salviamo l'identità del volontario (con l'email obbligatoria)
    const { error: volError } = await supabase
      .from('volontari')
      .upsert({ 
        id: user.id, 
        nome_completo: nome,
        email: user.email
      })
      
    if (volError) {
      console.error("ERRORE DATABASE VOLONTARIO:", volError.message)
      throw new Error(`Errore DB: ${volError.message}`)
    }

    // 2. GESTIONE TAG (Il Cuore)
    const tags = formData.getAll('tags') as string[]
    
    // Puliamo eventuali salvataggi a metà precedenti
    await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
    
    if (tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        volontario_id: user.id,
        tag_id: tagId
      }))
      await supabase.from('volontario_tags').insert(tagInserts)
    }

    // 3. GESTIONE COMPETENZE (I Superpoteri)
    const competenze = formData.getAll('competenze') as string[]
    
    // Pulizia di sicurezza
    await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
    
    if (competenze.length > 0) {
      const compInserts = competenze.map(compId => ({
        volontario_id: user.id,
        competenza_id: compId
      }))
      const { error: compError } = await supabase.from('volontario_competenze').insert(compInserts)
      
      if (compError) {
        console.error("Errore salvataggio competenze onboarding:", compError.message)
      }
    }

  } else if (role === 'associazione') {
    const nome = formData.get('nome') as string
    
    // Salviamo i dati base per l'associazione (con l'email obbligatoria)
    const { error: assError } = await supabase
      .from('associazioni')
      .upsert({ 
        id: user.id, 
        nome: nome,
        email: user.email
      })
      
    if (assError) {
      console.error("ERRORE DATABASE ASSOCIAZIONE:", assError.message)
      throw new Error(`Errore DB: ${assError.message}`)
    }
  }

  // Svuotiamo la cache per far ricaricare i dati freschi
  revalidatePath('/app/volontario')
  revalidatePath('/profilo')
}