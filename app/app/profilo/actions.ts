'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateProfilo(formData: FormData) {
  console.log("📦 DATI RICEVUTI DAL FORM:", Object.fromEntries(formData.entries()))

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Utente non autorizzato o sessione scaduta." }

    const { data: profiloHub, error: hubError } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .single()

    if (hubError || !profiloHub?.ruolo) return { error: "Impossibile verificare il ruolo dell'utente." }
    const role = profiloHub.ruolo.toLowerCase().trim()

    // ESTRAZIONE AMBITI COMUNI
    const tagsRaw = formData.get('tags_selezionati') as string
    let tags: string[] = []
    try { tags = tagsRaw ? JSON.parse(tagsRaw) : [] } catch (e) { console.error("Errore parse tags", e) }

    // ==========================================================
    // 👤 1. GESTIONE VOLONTARIO
    // ==========================================================
    if (role === 'volontario') {
      const compRaw = formData.get('competenze_selezionate') as string
      let competenze: string[] = []
      try { competenze = compRaw ? JSON.parse(compRaw) : [] } catch (e) { console.error("Errore parse competenze", e) }

      let dataNascita = formData.get('data_nascita') as string | null
      if (dataNascita === '') dataNascita = null

      const fileAvatar = formData.get('file_avatar') as File | null
      let fotoProfiloUrl = undefined

      if (fileAvatar && fileAvatar.size > 0 && fileAvatar.name) {
        const fileExtension = fileAvatar.name.split('.').pop()
        const fileName = `${user.id}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileAvatar, { cacheControl: '3600', upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
          fotoProfiloUrl = publicUrl
        } else {
          console.error("Errore storage volontario:", uploadError.message)
        }
      }

      const updatePayload: any = {
        nome: formData.get('nome') as string || null,
        cognome: formData.get('cognome') as string || null,
        bio: formData.get('bio') as string || null,
        email_contatto: formData.get('email_contatto') as string || null,
        telefono: formData.get('telefono') as string || null,
        citta_residenza: formData.get('citta_residenza') as string || null,
        cap: formData.get('cap') as string || null,
        data_nascita: dataNascita,
        sesso: formData.get('sesso') as string || null,
        grado_istruzione: formData.get('grado_istruzione') as string || null,
      }

      if (fotoProfiloUrl) {
        updatePayload.foto_profilo_url = fotoProfiloUrl
      }

      const { error: updateError } = await supabase
        .from('volontari')
        .update(updatePayload)
        .eq('id', user.id)

      if (updateError) return { error: `Errore aggiornamento dati: ${updateError.message}` }

      await supabase.from('volontario_tags').delete().eq('volontario_id', user.id)
      if (tags.length > 0) {
        await supabase.from('volontario_tags').insert(tags.map(id => ({ volontario_id: user.id, tag_id: id })))
      }

      await supabase.from('volontario_competenze').delete().eq('volontario_id', user.id)
      if (competenze.length > 0) {
        await supabase.from('volontario_competenze').insert(competenze.map(id => ({ volontario_id: user.id, competenza_id: id })))
      }
    } 
    // ==========================================================
    // 🏢 2. GESTIONE ASSOCIAZIONE
    // ==========================================================
    else if (role === 'associazione') {
      const getInt = (val: FormDataEntryValue | null) => val ? parseInt(val as string, 10) : null
      const getDate = (val: FormDataEntryValue | null) => (val && val !== '') ? (val as string) : null

      // ESTRAZIONE LOGO DALL'INPUT HIDDEN O DA EVENTUALE FILE FISICO
      const fileLogo = formData.get('file_logo') as File | null
      let logoUrlInput = (formData.get('logo_url') as string) || (formData.get('logo_url_statico') as string) || null

      if (fileLogo && fileLogo.size > 0 && fileLogo.name) {
        const fileExtension = fileLogo.name.split('.').pop()
        const fileName = `images/${user.id}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from('media_associazioni')
          .upload(fileName, fileLogo, { cacheControl: '3600', upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('media_associazioni').getPublicUrl(fileName)
          logoUrlInput = publicUrl
        } else {
          console.error("Errore storage associazione:", uploadError.message)
        }
      }

      const codiceFiscalePayload = formData.get('codice_fiscale') as string || null

      // 1. SALVATAGGIO MASTER IN TABELLA ASSOCIAZIONI
      const associazionePayload: any = {
        id: user.id,
        denominazione: formData.get('denominazione') as string || null,
        nome_breve: formData.get('denominazione') as string || null,
        codice_fiscale: codiceFiscalePayload,
        partita_iva: formData.get('partita_iva') as string || null,
        forma_giuridica: formData.get('forma_giuridica') as string || 'Associazione',
        email_associazione: formData.get('email_associazione') as string || user.email || '',
        telefono: formData.get('telefono') as string || null,
        sito_web: formData.get('sito_web') as string || null,
        descrizione: formData.get('descrizione') as string || null,
        anno_fondazione: getInt(formData.get('anno_fondazione')),
        logo_url: logoUrlInput, // 🟢 Master
      }

      const { error: coreError } = await supabase
        .from('associazioni')
        .upsert(associazionePayload)

      if (coreError) return { error: `Errore anagrafica associazione: ${coreError.message}` }

      // 2. SINCRONIZZAZIONE ESPLICITA SUL LAYOUT GRAFICO DELLA VETRINA (SE ESISTE)
      const { data: graph } = await supabase
        .from('associazioni_grafica')
        .select('layout_draft, layout_config')
        .eq('associazione_id', user.id)
        .maybeSingle()

      if (graph) {
        const updateLayoutLogo = (rawLayout: any) => {
          if (!rawLayout) return rawLayout
          let layout = typeof rawLayout === 'string' ? JSON.parse(rawLayout) : rawLayout
          if (Array.isArray(layout)) {
            return layout.map((b: any) => b.type === 'hero' ? { ...b, content: { ...b.content, logoUrl: logoUrlInput || '' } } : b)
          }
          return rawLayout
        }

        const newDraft = updateLayoutLogo(graph.layout_draft)
        const newConfig = updateLayoutLogo(graph.layout_config)

        await supabase
          .from('associazioni_grafica')
          .update({
            layout_draft: newDraft,
            layout_config: newConfig,
            updated_at: new Date().toISOString()
          })
          .eq('associazione_id', user.id)
      }

      // 3. TRASPARENZA
      const isRunts = formData.get('is_iscritto_runts') === 'true'
      const { error: traspError } = await supabase
        .from('associazioni_trasparenza')
        .upsert({
          associazione_id: user.id,
          is_iscritto_runts: isRunts,
          runts_repertorio: isRunts ? (formData.get('runts_repertorio') as string || null) : null,
          runts_sezione: isRunts ? (formData.get('runts_sezione') as string || null) : null,
          runts_data_iscrizione: isRunts ? getDate(formData.get('runts_data_iscrizione')) : null,
          legale_rappresentante_nome: formData.get('legale_rappresentante_nome') as string || null,
          legale_rappresentante_cognome: formData.get('legale_rappresentante_cognome') as string || null,
          referente_progetto_nome: formData.get('referente_progetto_nome') as string || 'Non inserito',
          referente_progetto_cognome: formData.get('referente_progetto_cognome') as string || 'Non inserito',
          referente_progetto_ruolo: formData.get('referente_progetto_ruolo') as string || 'Referente',
          pec: formData.get('pec') as string || null,
          num_soci: getInt(formData.get('num_soci')),
          num_volontari_attivi: getInt(formData.get('num_volontari_attivi')),
          num_dipendenti: getInt(formData.get('num_dipendenti')),
          dichiarazione_veridicita: true,
          consenso_privacy: true,
        }, { onConflict: 'associazione_id' })

      if (traspError) return { error: `Errore trasparenza: ${traspError.message}` }

      // 4. SEDI
      const comune = formData.get('citta_residenza') as string || formData.get('citta') as string || 'Non specificato'
      const { error: sedeError } = await supabase
        .from('associazioni_sedi')
        .upsert({
          associazione_id: user.id,
          tipologia: 'legale_operativa',
          indirizzo: formData.get('indirizzo') as string || formData.get('indirizzo_sede') as string || 'Non specificato',
          cap: formData.get('cap') as string || '00000',
          comune: comune,
          provincia: formData.get('provincia') as string || 'XX',
          lat: formData.get('lat') as string || null, 
          lng: formData.get('lng') as string || null, 
          is_principale: true
        }, { onConflict: 'associazione_id' })

      if (sedeError) return { error: `Errore registrazione sede: ${sedeError.message}` }

      // 5. TAGS
      await supabase.from('associazione_tags').delete().eq('associazione_id', user.id)
      if (tags.length > 0) {
        await supabase.from('associazione_tags').insert(tags.map(id => ({ associazione_id: user.id, tag_id: id })))
      }
    }

    revalidatePath('/app/profilo')
    revalidatePath('/app/profilo/modifica')
    revalidatePath('/app/associazione/personalizza')
    return { success: true }

  } catch (error: any) {
    return { error: error.message || "Errore critico interno del server." }
  }
}