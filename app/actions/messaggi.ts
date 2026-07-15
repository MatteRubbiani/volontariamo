'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function marcaMessaggiComeLetti(volontarioId: string, associazioneId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Aggiorniamo TUTTI i messaggi inviati da questo volontario a questa associazione
  const { error } = await supabase
    .from('messaggi')
    .update({ letto: true })
    .eq('volontario_id', volontarioId)
    .eq('associazione_id', associazioneId)
    .neq('mittente_id', associazioneId) // Tocchiamo solo quelli ricevuti, non quelli inviati da noi

  if (error) {
    console.error("Errore UPDATE Supabase:", error.message)
    return { success: false }
  }

  // 🔥 FONDAMENTALE: Diciamo a Next.js di distruggere la cache di questa pagina!
  revalidatePath('/associazione/messaggi', 'page')
  revalidatePath('/app/associazione/messaggi', 'page') // (Seleziona quella giusta in base al tuo routing)

  return { success: true }
}