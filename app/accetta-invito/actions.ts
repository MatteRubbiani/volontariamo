'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function accettaInvitoAziendale(formData: FormData) {
  const token = formData.get('token') as string

  if (!token) throw new Error("Token mancante.")

  const cookieStore = await cookies()
  
  // Usiamo il normalissimo client con la chiave pubblica ANON_KEY!
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Chiamiamo la Stored Procedure sicura nel database
  const { error } = await supabase.rpc('accetta_invito_sicuro', {
    token_invito: token
  })

  if (error) {
    console.error("Errore RPC accettazione:", error)
    throw new Error(error.message || "Errore durante l'accettazione dell'invito.")
  }

  // Finito!
  redirect('/app/volontario')
}