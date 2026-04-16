'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateProfilo(formData: FormData) {
  // 🐛 ARMA SEGRETA: Stampa nel terminale TUTTO quello che arriva dal form
  console.log("📦 DATI RICEVUTI DAL FORM:", Object.fromEntries(formData.entries()))

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Non autorizzato")

  const role = formData.get('role') as string
  const nome = formData.get('nome') as string
  const bio = formData.get('bio') as string

  if (role === 'volontario') {
    const { error: updateError } = await supabase
      .from('volontari')
      .update({ nome_completo: nome, bio: bio })
      .eq('id', user.id)

    if (updateError) throw new Error("Errore aggiornamento profilo volontario")

    const tags = formData.getAll('tags') as string[]
    await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
    if (tags.length > 0) {
      await supabase.from('volontario_tags').insert(tags.map(id => ({ volontario_id: user.id, tag_id: id })))
    }

    const competenze = formData.getAll('competenze') as string[]
    await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
    if (competenze.length > 0) {
      await supabase.from('volontario_competenze').insert(competenze.map(id => ({ volontario_id: user.id, competenza_id: id })))
    }

  } else if (role === 'associazione') {
    // 🚨 FIX: Passiamo da UPSERT a UPDATE!
    const { error } = await supabase
      .from('associazioni')
      .update({
        nome: nome,
        descrizione: bio,
        forma_giuridica: formData.get('forma_giuridica') as string || null,
        codice_fiscale: formData.get('codice_fiscale') as string || null,
        citta: formData.get('citta') as string || null,
        indirizzo_sede: formData.get('indirizzo_sede') as string || null,
        telefono: formData.get('telefono') as string || null,
        email_contatto: formData.get('email_contatto') as string || null,
        nome_referente: formData.get('nome_referente') as string || null,
        sito_web: formData.get('sito_web') as string || null,
        profili_social: formData.get('profili_social') as string || null,
      })
      .eq('id', user.id) // <--- Fondamentale per l'UPDATE

    if (error) {
      console.error("❌ ERRORE UPDATE ASSOCIAZIONE:", error.message)
      throw new Error(`Errore DB: ${error.message}`)
    }

    const tags = formData.getAll('tags') as string[]
    await supabase.from('associazione_tags').delete().eq('associazione_id', user.id)
    if (tags.length > 0) {
      await supabase.from('associazione_tags').insert(tags.map(id => ({ associazione_id: user.id, tag_id: id })))
    }
    
  } else if (role === 'impresa') {
    // 🚨 FIX: Passiamo da UPSERT a UPDATE anche qui per coerenza
    const { error } = await supabase
      .from('imprese')
      .update({
        ragione_sociale: nome,
        forma_giuridica: formData.get('forma_giuridica') as string || null,
        partita_iva: formData.get('partita_iva') as string || null,
        codice_fiscale: formData.get('codice_fiscale') as string || null,
        settore_attivita: formData.get('settore_attivita') as string || null,
        fascia_dipendenti: formData.get('fascia_dipendenti') as string || null,
        indirizzo_sede: formData.get('indirizzo_sede') as string || null,
        area_operativa: formData.get('area_operativa') as string || null,
        nome_referente: formData.get('nome_referente') as string || null,
        sito_web: formData.get('sito_web') as string || null,
        profili_social: formData.get('profili_social') as string || null,
        obiettivi_esg: formData.get('obiettivi_esg') as string || null,
        valori_cause: formData.get('valori_cause') as string || null,
        tipologia_impatto: formData.get('tipologia_impatto') as string || null,
      })
      .eq('id', user.id)

    if (error) {
      console.error("❌ ERRORE UPDATE IMPRESA:", error.message)
      throw new Error(`Errore DB: ${error.message}`)
    }
  }

  revalidatePath('/profilo')
  revalidatePath('/profilo/modifica')
  revalidatePath('/', 'layout')
}