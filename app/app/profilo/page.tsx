'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfiloVolontario from './components/ProfiloVolontario'
import ProfiloAssociazione from './components/ProfiloAssociazione'
import ProfiloImpresa from './components/ProfiloImpresa'

export default async function ProfiloPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Leggiamo l'informazione del ruolo dalla tabella Hub "profili"
  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  const role = profilo?.ruolo

  // ==========================================================
  // 👤 1. RENDER VOLONTARIO
  // ==========================================================
  if (role === 'volontario') {
    const { data: vol } = await supabase
      .from('volontari')
      .select(`
        *, 
        tags:volontario_tags(tag:tags(id, name, description, categoria)), 
        competenze:volontario_competenze(competenza:competenze(id, name))
      `)
      .eq('id', user.id)
      .single()
      
    // 📊 ALGORITMO DINAMICO COMPLETAMENTO
    let completamento = 40; // Base onboarding (Nome, Cognome, Sede)
    const taskMancanti: string[] = [];

    if (vol?.foto_profilo_url) {
      completamento += 20;
    } else {
      taskMancanti.push("Carica una foto profilo (+20%)");
    }

    if (vol?.bio && vol.bio.trim().length > 10) {
      completamento += 15;
    } else {
      taskMancanti.push("Scrivi una breve biografia (+15%)");
    }

    if (vol?.data_nascita || vol?.sesso) {
      completamento += 15;
    } else {
      taskMancanti.push("Inserisci genere o data di nascita (+15%)");
    }

    if (vol?.telefono && vol.telefono.trim().length > 5) {
      completamento += 10;
    } else {
      taskMancanti.push("Aggiungi un numero di telefono (+10%)");
    }

    const suggerimento = taskMancanti.length > 0 
      ? `Prossimo step consigliato: ${taskMancanti[0]}`
      : 'Incredibile! Il tuo profilo è completo al 100%.';

    return (
      <ProfiloVolontario 
        data={vol!} 
        email={user.email!} 
        percentage={completamento} 
        suggerimento={suggerimento} 
      />
    )
  }

  // ==========================================================
  // 🏢 2. RENDER ASSOCIAZIONE (ALLINEAMENTO SORGENTE DI VERITÀ)
  // ==========================================================
  if (role === 'associazione') {
    // 🟢 Query parallela per massimizzare la velocità di caricamento (Next.js Best Practice)
    const [{ data: ass, error }, { data: graph }] = await Promise.all([
      supabase
        .from('associazioni')
        .select(`
          *,
          associazioni_trasparenza (*),
          associazioni_sedi (*),
          tags:associazione_tags(tag:tags(id, name, description, categoria))
        `)
        .eq('id', user.id)
        .single(),
      supabase
        .from('associazioni_grafica')
        .select('layout_draft, layout_config')
        .eq('associazione_id', user.id)
        .maybeSingle()
    ])

    if (error || !ass) {
      console.error("❌ Errore recupero dati associazione:", error?.message)
      redirect('/app/onboarding?role=associazione')
    }

    // 🟢 Fallback strutturale sul JSON della vetrina se la colonna master logo_url è vuota
    let logoUrlVetrina = ''
    if (!ass.logo_url) {
      const rawLayout = graph?.layout_draft || graph?.layout_config
      if (rawLayout) {
        const layout = typeof rawLayout === 'string' ? JSON.parse(rawLayout) : rawLayout
        if (Array.isArray(layout)) {
          const heroBlock = layout.find((b: any) => b.type === 'hero')
          if (heroBlock?.content?.logoUrl) {
            logoUrlVetrina = heroBlock.content.logoUrl
          }
        }
      }
    }

    // Uniamo l'anteprima del logo della vetrina nei dati pronti per il componente di rendering
    const dataPronta = {
      ...ass,
      logo_url_vetrina: logoUrlVetrina
    }

    // 📊 ALGORITMO DINAMICO COMPLETAMENTO
    let completamento = 50; // Base onboarding (Dati fiscali, Sede, Referente)
    const taskMancanti: string[] = [];

    // Il logo è considerato presente se caricato in anagrafica o recuperato tramite la vetrina
    if (ass.logo_url || logoUrlVetrina) {
      completamento += 20;
    } else {
      taskMancanti.push("Carica il logo dell'organizzazione (+20%)");
    }

    if (ass.descrizione && ass.descrizione.trim().length > 20) {
      completamento += 15;
    } else {
      taskMancanti.push("Aggiungi la presentazione della vostra Mission (+15%)");
    }

    if (ass.sito_web || ass.telefono) {
      completamento += 15;
    } else {
      taskMancanti.push("Inserisci un recapito telefonico o il sito web (+15%)");
    }

    const suggerimento = taskMancanti.length > 0
      ? `Consiglio per migliorare la visibilità: ${taskMancanti[0]}`
      : 'Ottimo lavoro! Il profilo dell’ente è completo al 100%.';

    return (
      <ProfiloAssociazione 
        data={dataPronta} 
        email={user.email!} 
        percentage={completamento} 
        suggerimento={suggerimento} 
      />
    )
  }

  // ==========================================================
  // 🏢 3. RENDER IMPRESA
  // ==========================================================
  if (role === 'impresa') {
    const { data: imp } = await supabase
      .from('imprese')
      .select('*')
      .eq('id', user.id)
      .single()
    return <ProfiloImpresa data={imp!} email={user.email!} />
  }

  redirect('/app/onboarding')
}