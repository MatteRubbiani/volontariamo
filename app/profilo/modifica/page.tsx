import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateProfilo } from '../actions' // Controlla che il path sia giusto
import FormModificaProfilo from './components/FormModificaProfilo'
import { redirect } from 'next/navigation'

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
    
    // 1. Chiediamo il ruolo
    const { data: hub, error: hubError } = await supabase.from('profili').select('ruolo').eq('id', user.id).maybeSingle()
    if (hubError || !hub?.ruolo) {
      return <div className="p-10 text-center text-red-600 font-bold">Errore: Profilo Hub non trovato. Completa la registrazione.</div>
    }

    const role = hub.ruolo.toLowerCase().trim()
    let profiloData: any = {}
    let tagsIniziali: string[] = []
    let competenzeIniziali: string[] = []

    // 2. QUERY SEPARATE (Anti-Crash)
    if (role === 'volontario') {
      // Scarica solo i dati base (sempre sicuro)
      const { data: vol } = await supabase.from('volontari').select('*').eq('id', user.id).maybeSingle()
      profiloData = vol || { id: user.id }

      // Scarica i tag a parte
      const { data: volTags } = await supabase.from('volontario_tags').select('tag_id').eq('volontario_id', user.id)
      tagsIniziali = volTags?.map(t => t.tag_id) || []

      // Scarica le competenze a parte
      const { data: volComp } = await supabase.from('volontario_competenze').select('competenza_id').eq('volontario_id', user.id)
      competenzeIniziali = volComp?.map(c => c.competenza_id) || []

    } else if (role === 'associazione') {
      const { data: ass } = await supabase
        .from('associazioni')
        .select(`
          *,
          associazioni_trasparenza (*),
          associazioni_sedi (*)
        `)
        .eq('id', user.id)
        .maybeSingle()

      const base = ass || { id: user.id }
      
      // 🛡️ FIX SENIOR: Gestiamo sia Oggetto che Array per Trasparenza e Sedi
      const trasp = Array.isArray(base.associazioni_trasparenza) 
        ? base.associazioni_trasparenza[0] 
        : base.associazioni_trasparenza || {}

      const sede = Array.isArray(base.associazioni_sedi)
        ? (base.associazioni_sedi.find((s: any) => s.is_principale) || base.associazioni_sedi[0] || {})
        : base.associazioni_sedi || {}

      profiloData = {
        ...base,
        nome: base.denominazione || '',
        indirizzo: sede.indirizzo || '',
        cap: sede.cap || '',
        comune: sede.comune || '',
        provincia: sede.provincia || '',
        referente_progetto_nome: trasp.referente_progetto_nome || '',
        referente_progetto_cognome: trasp.referente_progetto_cognome || '',
        referente_progetto_ruolo: trasp.referente_progetto_ruolo || '',
        legale_rappresentante_nome: trasp.legale_rappresentante_nome || '',
        pec: trasp.pec || '',
        num_soci: trasp.num_soci || 0,
        num_volontari_attivi: trasp.num_volontari_attivi || 0,
        num_dipendenti: trasp.num_dipendenti || 0,
        runts_repertorio: trasp.runts_repertorio || '',
        runts_sezione: trasp.runts_sezione || '',
        runts_data_iscrizione: trasp.runts_data_iscrizione || '',
        is_iscritto_runts: trasp.is_iscritto_runts || false,
      }
      
      const { data: assTags } = await supabase.from('associazione_tags').select('tag_id').eq('associazione_id', user.id)
      tagsIniziali = assTags?.map(t => t.tag_id) || []
    } else if (role === 'impresa') {
      const { data: imp } = await supabase.from('imprese').select('*').eq('id', user.id).maybeSingle()
      profiloData = imp || { id: user.id }
    }

    // 3. Cataloghi Generali
    const { data: allTags } = await supabase.from('tags').select('*').order('name')
    const { data: allCompetenze } = await supabase.from('competenze').select('*').eq('is_official', true).order('name')

    return (
      <div className="max-w-2xl mx-auto py-12 px-6 pb-24">
        <h1 className="text-4xl font-black mb-10 text-slate-900 tracking-tight">Modifica Profilo</h1>
        <FormModificaProfilo 
          ruolo={role} 
          profilo={profiloData} 
          allTags={allTags || []}
          tagsIniziali={tagsIniziali}
          allCompetenze={allCompetenze || []}
          competenzeIniziali={competenzeIniziali}
          salvaAction={updateProfilo}
        />
      </div>
    )
  } catch (error: any) {
    // Se salta la corrente, almeno vediamo perché!
    return <div className="p-10 text-red-600 font-bold">Errore di caricamento pagina: {error.message}</div>
  }
}