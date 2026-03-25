'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPosizione(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  // 1. Controllo Autenticazione
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. Recupero dati base dal Form
  const titolo = formData.get('titolo') as string
  const descrizione = formData.get('descrizione') as string
  const tipo = formData.get('tipo') as string 
  const dove = formData.get('dove') as string
  const ora_inizio = formData.get('ora_inizio') as string
  const ora_fine = formData.get('ora_fine') as string
  
  // RECUPERO TAGS: Qui Next.js legge gli input nascosti che il tuo form ha generato
  const selectedTags = formData.getAll('tags') as string[]

  // 3. Logica per la colonna "quando"
  const data_esatta = tipo === 'una_tantum' ? (formData.get('data_esatta') as string) : null
  const giorni_settimana = tipo === 'ricorrente' ? (formData.getAll('giorni_settimana') as string[]) : []

  const quando = tipo === 'una_tantum' 
    ? data_esatta 
    : giorni_settimana.join(', ')

  if (!quando) {
    throw new Error("Devi specificare una data o almeno un giorno della settimana.")
  }

  // 4. Inserimento nella tabella principale 'posizioni'
  const { data: posizione, error: posError } = await supabase
    .from('posizioni')
    .insert({
      associazione_id: user.id,
      titolo,
      descrizione,
      tipo,
      dove,
      ora_inizio,
      ora_fine,
      quando,
      data_esatta,
      giorni_settimana, 
    })
    .select() // FONDAMENTALE: chiediamo a Supabase di restituirci l'ID appena creato
    .single()

  if (posError) {
    console.error("Errore Creazione Posizione:", posError.message)
    throw new Error("Errore salvataggio posizione: " + posError.message)
  }

  // 5. Inserimento tag nella tabella ponte 'posizione_tags'
  if (selectedTags.length > 0 && posizione) {
    const tagsToInsert = selectedTags.map(tId => ({
      posizione_id: posizione.id,
      tag_id: tId
    }))

    const { error: tagError } = await supabase
      .from('posizione_tags')
      .insert(tagsToInsert)

    // SE C'È UN ERRORE QUI, FERMIAMO TUTTO! (Così te ne accorgi)
    if (tagError) {
      console.error("ERRORE SALVATAGGIO TAG:", tagError.message)
      throw new Error("La posizione è stata creata, ma il salvataggio dei TAG è fallito: " + tagError.message)
    }
  }

  // 6. Refresh e Reindirizzamento
  revalidatePath('/dashboard/associazione')
  revalidatePath('/dashboard/volontario') // Puliamo la cache anche per il volontario
  redirect('/dashboard/associazione')
}