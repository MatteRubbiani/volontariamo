'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getSafeRedirectTo(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

function parseMultiValue(formData: FormData, key: string): string[] {
  const values = formData.getAll(key).filter((item): item is string => typeof item === 'string' && item.length > 0)
  if (values.length > 0) return values

  const single = formData.get(key)
  if (typeof single !== 'string' || single.length === 0) return []

  try {
    const parsed = JSON.parse(single)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
    }
  } catch {
    return []
  }

  return []
}

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
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))

  if (role === 'volontario') {
    const nome = String(formData.get('nome') ?? '').trim()
    const cognome = String(formData.get('cognome') ?? '').trim()
    const nomeCompleto = `${nome} ${cognome}`.trim()

    // 1. Salviamo l'identità del volontario (con l'email obbligatoria)
    const { error: volError } = await supabase
      .from('volontari')
      .upsert({ 
        id: user.id, 
        nome_completo: nomeCompleto || nome,
        email: user.email
      })
      
    if (volError) {
      console.error("ERRORE DATABASE VOLONTARIO:", volError.message)
      throw new Error(`Errore DB: ${volError.message}`)
    }

    // 2. GESTIONE TAG (Il Cuore)
    const tags = parseMultiValue(formData, 'tags')
    
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
    const competenze = parseMultiValue(formData, 'competenze')
    
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
    const nome = String(formData.get('nome') ?? '').trim()
    const mission = String(formData.get('mission') ?? '').trim()
    const sitoWeb = String(formData.get('sitoWeb') ?? '').trim()
    
    // Salviamo i dati base per l'associazione (con l'email obbligatoria)
    const { error: assError } = await supabase
      .from('associazioni')
      .upsert({ 
        id: user.id, 
        nome: nome,
        email_contatto: user.email,
        descrizione: mission || null,
        sito_web: sitoWeb || null
      })
      
    if (assError) {
      console.error("ERRORE DATABASE ASSOCIAZIONE:", assError.message)
      throw new Error(`Errore DB: ${assError.message}`)
    }
  } else if (role === 'impresa') {
    const nome = String(formData.get('nome') ?? '').trim()
    const mission = String(formData.get('mission') ?? '').trim()
    const partita_iva = String(formData.get('partitaIva') ?? '').trim()
    const tags = parseMultiValue(formData, 'tags')

    const payloadAttempts: Record<string, unknown>[] = [
      { id: user.id, nome, email_contatto: user.email, mission: mission || null, partita_iva: partita_iva || null },
      { id: user.id, nome_impresa: nome, email_contatto: user.email, mission: mission || null, partita_iva: partita_iva || null },
      { id: user.id, ragione_sociale: nome, email_contatto: user.email, mission: mission || null, partita_iva: partita_iva || null },
      { id: user.id, nome, email: user.email, mission: mission || null, partita_iva: partita_iva || null },
    ]

    let impresaSaved = false
    let lastErrorMessage = 'Profilo impresa non salvato'

    for (const payload of payloadAttempts) {
      const { error: impError } = await supabase.from('imprese').upsert(payload)
      if (!impError) {
        impresaSaved = true
        break
      }
      lastErrorMessage = impError.message
    }

    if (!impresaSaved) {
      console.error('ERRORE DATABASE IMPRESA:', lastErrorMessage)
      throw new Error(`Errore DB: ${lastErrorMessage}`)
    }

    await supabase.from('impresa_tags').delete().eq('impresa_id', user.id)
    if (tags.length > 0) {
      const tagRows = tags.map((tagId) => ({ impresa_id: user.id, tag_id: tagId }))
      await supabase.from('impresa_tags').insert(tagRows)
    }
  }

  // Svuotiamo la cache per far ricaricare i dati freschi
  revalidatePath('/app/volontario')
  revalidatePath('/app/associazione')
  revalidatePath('/profilo')

  if (redirectTo) {
    redirect(redirectTo)
  }

  if (role === 'associazione') {
    redirect('/app/associazione')
  }
  if (role === 'impresa') {
    redirect('/app/impresa')
  }

  redirect('/app/volontario')
}