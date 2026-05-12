// src/app/profilo/modifica/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateProfilo } from '../actions'
import { redirect } from 'next/navigation'

// Importiamo i tre nuovi form modulari
import FormModificaAssociazione from './components/FormModificaAssociazione'
import FormModificaVolontario from './components/FormModificaVolontario'
import FormModificaImpresa from './components/FormModificaImpresa'

export default async function ModificaProfiloPage() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')
    
    const { data: hub, error: hubError } = await supabase.from('profili').select('ruolo').eq('id', user.id).maybeSingle()
    if (hubError || !hub?.ruolo) {
      return <div className="p-10 text-center text-red-600 font-bold">Errore: Profilo Hub non trovato.</div>
    }

    const role = hub.ruolo.toLowerCase().trim()
    
    // 1. Cataloghi Generali (Tags e Competenze)
    const { data: allTags } = await supabase.from('tags').select('*').order('name')
    const { data: allCompetenze } = await supabase.from('competenze').select('*').eq('is_official', true).order('name')

    // 2. RENDERING CONDIZIONALE BASATO SUL RUOLO
    
    // --- VOLONTARIO ---
    if (role === 'volontario') {
      const { data: vol } = await supabase.from('volontari').select('*').eq('id', user.id).maybeSingle()
      const { data: volTags } = await supabase.from('volontario_tags').select('tag_id').eq('volontario_id', user.id)
      const { data: volComp } = await supabase.from('volontario_competenze').select('competenza_id').eq('volontario_id', user.id)
      
      const tagsIniziali = volTags?.map(t => t.tag_id) || []
      const competenzeIniziali = volComp?.map(c => c.competenza_id) || []

      return (
        <div className="bg-slate-50 min-h-screen py-12">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-4xl font-black mb-10 text-slate-900 tracking-tight">Modifica Profilo Volontario</h1>
            <FormModificaVolontario 
              profilo={vol || { id: user.id }} 
              allTags={allTags || []}
              tagsIniziali={tagsIniziali}
              allCompetenze={allCompetenze || []}
              competenzeIniziali={competenzeIniziali}
              salvaAction={updateProfilo}
            />
          </div>
        </div>
      )
    }

    // --- ASSOCIAZIONE ---
    if (role === 'associazione') {
      const { data: ass } = await supabase
        .from('associazioni')
        .select(`*, associazioni_trasparenza (*), associazioni_sedi (*)`)
        .eq('id', user.id)
        .maybeSingle()

      const base = ass || { id: user.id }
      const trasp = Array.isArray(base.associazioni_trasparenza) ? base.associazioni_trasparenza[0] : base.associazioni_trasparenza || {}
      const sede = Array.isArray(base.associazioni_sedi) 
                   ? (base.associazioni_sedi.find((s: any) => s.is_principale) || base.associazioni_sedi[0] || {}) 
                   : base.associazioni_sedi || {}

      const profiloData = {
        ...base,
        denominazione: base.denominazione || '',
        indirizzo: sede.indirizzo || '',
        cap: sede.cap || '',
        comune: sede.comune || '',
        provincia: sede.provincia || '',
        referente_progetto_nome: trasp.referente_progetto_nome || '',
        referente_progetto_cognome: trasp.referente_progetto_cognome || '',
        referente_progetto_ruolo: trasp.referente_progetto_ruolo || '',
        legale_rappresentante_nome: trasp.legale_rappresentante_nome || '',
        legale_rappresentante_cognome: trasp.legale_rappresentante_cognome || '',
        pec: trasp.pec || '',
        num_soci: trasp.num_soci || 0,
        num_volontari_attivi: trasp.num_volontari_attivi || 0,
        num_dipendenti: trasp.num_dipendenti || 0,
        is_iscritto_runts: trasp.is_iscritto_runts || false,
      }
      
      const { data: assTags } = await supabase.from('associazione_tags').select('tag_id').eq('associazione_id', user.id)
      const tagsIniziali = assTags?.map(t => t.tag_id) || []

      return (
        <div className="bg-slate-50 min-h-screen py-12">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-4xl font-black mb-10 text-slate-900 tracking-tight text-center md:text-left">Profilo Ente</h1>
            <FormModificaAssociazione 
              profilo={profiloData} 
              allTags={allTags || []}
              tagsIniziali={tagsIniziali}
              salvaAction={updateProfilo}
            />
          </div>
        </div>
      )
    }

    // --- IMPRESA ---
    if (role === 'impresa') {
      const { data: imp } = await supabase.from('imprese').select('*').eq('id', user.id).maybeSingle()
      return (
        <div className="bg-slate-50 min-h-screen py-12">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-4xl font-black mb-10 text-slate-900 tracking-tight">Profilo Aziendale</h1>
            <FormModificaImpresa 
              profilo={imp || { id: user.id }} 
              salvaAction={updateProfilo}
            />
          </div>
        </div>
      )
    }

    redirect('/app/onboarding')

  } catch (error: any) {
    return <div className="p-10 text-red-600 font-bold text-center">Errore critico: {error.message}</div>
  }
}