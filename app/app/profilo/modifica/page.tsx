'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateProfilo } from '../actions'
import { redirect } from 'next/navigation'

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
    
    const { data: hub, error: hubError } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .maybeSingle()

    if (hubError || !hub?.ruolo) {
      return <div className="p-10 text-center text-red-600 font-bold">Errore: Profilo Hub non trovato.</div>
    }

    const role = hub.ruolo.toLowerCase().trim()
    
    // Cataloghi Generali
    const { data: allTags } = await supabase.from('tags').select('*').order('name')
    const { data: allCompetenze } = await supabase.from('competenze').select('*').eq('is_official', true).order('name')

    // ==========================================================
    // 👤 FLUSSO VOLONTARIO
    // ==========================================================
    if (role === 'volontario') {
      const { data: vol } = await supabase.from('volontari').select('*').eq('id', user.id).maybeSingle()
      const { data: volTags } = await supabase.from('volontario_tags').select('tag_id').eq('volontario_id', user.id)
      const { data: volComp } = await supabase.from('volontario_competenze').select('competenza_id').eq('volontario_id', user.id)
      
      const tagsIniziali = volTags?.map(t => t.tag_id) || []
      const competenzeIniziali = volComp?.map(c => c.competenza_id) || []

      return (
        <div className="bg-white min-h-screen py-12 font-sans antialiased selection:bg-slate-100">
          <div className="max-w-[540px] mx-auto px-6">
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

    // ==========================================================
    // 🏢 FLUSSO ASSOCIAZIONE
    // ==========================================================
    if (role === 'associazione') {
      const [{ data: ass }, { data: graph }, { data: assTags }] = await Promise.all([
        supabase.from('associazioni').select(`*, associazioni_trasparenza (*), associazioni_sedi (*)`).eq('id', user.id).maybeSingle(),
        supabase.from('associazioni_grafica').select('layout_draft, layout_config').eq('associazione_id', user.id).maybeSingle(),
        supabase.from('associazione_tags').select('tag_id').eq('associazione_id', user.id)
      ])

      const base = ass || { id: user.id }
      const trasp = Array.isArray(base.associazioni_trasparenza) ? base.associazioni_trasparenza[0] : base.associazioni_trasparenza || {}
      const sede = Array.isArray(base.associazioni_sedi) 
                   ? (base.associazioni_sedi.find((s: any) => s.is_principale) || base.associazioni_sedi[0] || {}) 
                   : base.associazioni_sedi || {}

      // Fallback tattico: Se associazioni.logo_url non esiste ancora, proviamo ad estrarlo dalla vetrina grafica
      let logoUrlVetrina = ''
      if (!base.logo_url) {
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

      const profiloData = {
        ...base,
        logo_url: base.logo_url || logoUrlVetrina, // 🟢 Master primario con fallback vetrina
        logo_url_vetrina: logoUrlVetrina,
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
      
      const tagsIniziali = assTags?.map(t => t.tag_id) || []

      return (
        <div className="bg-white min-h-screen py-12 font-sans antialiased selection:bg-slate-100">
          <div className="max-w-[540px] mx-auto px-6">
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

    redirect('/app/onboarding')
  } catch (error: any) {
    return <div className="p-10 text-red-600 font-medium text-center text-sm">Errore critico: {error.message}</div>
  }
}