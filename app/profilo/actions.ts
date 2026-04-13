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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Non autorizzato")

  const role = formData.get('role') as string
  const nome = formData.get('nome') as string
  const bio = formData.get('bio') as string

  if (role === 'volontario') {
    // 1. Update dati base volontario
    const { error: updateError } = await supabase
      .from('volontari')
      .update({ nome_completo: nome, bio: bio })
      .eq('id', user.id)

    if (updateError) throw new Error("Errore aggiornamento profilo")

    // 2. Gestione TAG
    const tags = formData.getAll('tags') as string[]
    await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
    
    if (tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        volontario_id: user.id,
        tag_id: tagId
      }))
      await supabase.from('volontario_tags').insert(tagInserts)
    }

    // 3. Gestione COMPETENZE
    const competenze = formData.getAll('competenze') as string[]
    await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
    
    if (competenze.length > 0) {
      const compInserts = competenze.map(compId => ({
        volontario_id: user.id,
        competenza_id: compId
      }))
      await supabase.from('volontario_competenze').insert(compInserts)
    }

  } else if (role === 'associazione') {
    // 1. Upsert per le associazioni con TUTTI i campi
    const { error } = await supabase
      .from('associazioni')
      .upsert({
        id: user.id,
        nome: nome,
        descrizione: bio, // Mappa 'bio' del form a 'descrizione' del DB
        forma_giuridica: formData.get('forma_giuridica') as string || null,
        codice_fiscale: formData.get('codice_fiscale') as string || null,
        citta: formData.get('citta') as string || null,
        indirizzo_sede: formData.get('indirizzo_sede') as string || null,
        telefono: formData.get('telefono') as string || null,
        email_contatto: formData.get('email_contatto') as string || null,
        nome_referente: formData.get('nome_referente') as string || null,
        sito_web: formData.get('sito_web') as string || null,
        profili_social: formData.get('profili_social') as string || null,
      }, {
        onConflict: 'id'
      })

    if (error) throw new Error(`Errore aggiornamento associazione: ${error.message}`)

    // 2. Gestione TAG Associazione
    const tags = formData.getAll('tags') as string[]
    
    // Pulizia dei vecchi tag
    await supabase.from('associazione_tags').delete().eq('associazione_id', user.id)
    
    // Inserimento dei nuovi tag se presenti
    if (tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        associazione_id: user.id,
        tag_id: tagId
      }))
      await supabase.from('associazione_tags').insert(tagInserts)
    }
    
  } else if (role === 'impresa') {
    // 1. Upsert per le imprese con TUTTI i campi corporate
    const { error } = await supabase
      .from('imprese')
      .upsert({
        id: user.id,
        ragione_sociale: nome, // Mappato dal campo "nome" generico del form
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
      }, {
        onConflict: 'id'
      })

    if (error) throw new Error(`Errore aggiornamento impresa: ${error.message}`)
  }

  // Invalida la cache per far vedere subito le modifiche su tutto il sito
  revalidatePath('/profilo')
  revalidatePath('/profilo/modifica')
  revalidatePath('/', 'layout') // Invalida anche la Navbar e il resto dell'App
}