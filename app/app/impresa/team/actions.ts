'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function creaInvito(prevState: any, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non autorizzato" }

  const email = formData.get('email') as string
  if (!email) return { error: "Inserisci un'email valida" }

  // 1. Controlla se c'è già un invito in attesa per questa email
  const { data: existing } = await supabase
    .from('inviti_impresa')
    .select('id')
    .eq('impresa_id', user.id)
    .eq('email', email)
    .eq('stato', 'in_attesa')
    .maybeSingle()

  if (existing) {
    return { error: "Hai già invitato questo dipendente." }
  }

  // 2. Crea l'invito nel DB
  const { data: invito, error: insertError } = await supabase
    .from('inviti_impresa')
    .insert({
      impresa_id: user.id,
      email: email,
      stato: 'in_attesa'
    })
    .select('token')
    .single()

  if (insertError) {
    console.error(insertError)
    return { error: "Errore durante la creazione dell'invito." }
  }

  // Forza l'aggiornamento della pagina per far comparire il dipendente in tabella
  revalidatePath('/app/impresa/team')

  // In un'app reale qui useresti Resend/SendGrid per inviare l'email vera.
  // Per ora restituiamo il token al frontend per mostrarlo a schermo!
  return { 
    success: true, 
    message: "Invito creato con successo!",
    token: invito.token 
  }
}


// ... (tieni le importazioni e la funzione creaInvito esistente)

export async function eliminaInvito(invitoId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase
    .from('inviti_impresa')
    .delete()
    .eq('id', invitoId)

  if (error) throw new Error("Impossibile eliminare l'invito")
  
  revalidatePath('/app/impresa/team')
}

export async function rimuoviDipendente(dipendenteId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase
    .from('impresa_dipendenti')
    .delete()
    .eq('id', dipendenteId)

  if (error) throw new Error("Impossibile rimuovere il dipendente")
  
  revalidatePath('/app/impresa/team')
}