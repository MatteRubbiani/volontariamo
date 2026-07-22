'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import PosizioneQuestionPanel from '@/components/PosizioneQuestionPanel'
import { Loader2, CheckCircle2, Send, LogIn, Clock } from 'lucide-react'

interface PanelProps {
  posizioneId: string
  slug: string
  associazioneId: string
  associazioneNome: string
  competenzeRichieste: any[]
  isMobileBanner?: boolean
}

export default function PannelloCandidatura({ 
  posizioneId, 
  slug, 
  associazioneId, 
  associazioneNome, 
  competenzeRichieste,
  isMobileBanner = false
}: PanelProps) {
  const [user, setUser] = useState<any>(null)
  const [candidatura, setCandidatura] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loginHref = `/auth/login?redirectTo=${encodeURIComponent(`/posizione/${slug}`)}`

  async function fetchAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setLoading(false)
      return
    }
    setUser(session.user)

    const { data: candData } = await supabase
      .from('candidature')
      .select('*')
      .eq('posizione_id', posizioneId)
      .eq('volontario_id', session.user.id)
      .maybeSingle()

    setCandidatura(candData)
    setLoading(false)
  }

  useEffect(() => {
    fetchAuthStatus()
  }, [posizioneId])

  async function handleCandidatura() {
    if (!user) return
    setIsSaving(true)

    const { error } = await supabase.from('candidature').upsert({
      posizione_id: posizioneId,
      volontario_id: user.id,
      stato: 'in_attesa'
    }, { 
      onConflict: 'posizione_id, volontario_id'
    })

    if (!error) {
      await supabase.from('messaggi').insert({
        associazione_id: associazioneId,
        volontario_id: user.id,
        mittente_id: user.id,
        testo: `✨ Mi sono candidato ufficialmente a questa posizione!`,
        posizione_id: posizioneId,
        is_system: true
      })
      await fetchAuthStatus()
    }
    setIsSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  const statoCandidatura = candidatura?.stato === 'accettata' ? 'accettato' : candidatura?.stato === 'rifiutata' ? 'rifiutato' : candidatura?.stato

  // 1️⃣ UTENTE NON LOGGATO: UNICO BOTTONE PULITO
  if (!user) {
    return (
      <div className="w-full">
        <Link 
          href={loginHref} 
          className="w-full h-12 px-5 rounded-2xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-center"
        >
          <LogIn className="w-4 h-4 text-violet-400 shrink-0" />
          <span>Accedi per partecipare</span>
        </Link>
      </div>
    )
  }

  // 2️⃣ UTENTE LOGGATO: AZIONE CANDIDATURA O STATO
  const renderCandidaturaAction = () => {
    if (!candidatura) {
      return (
        <button 
          type="button"
          onClick={handleCandidatura} 
          disabled={isSubmitting} 
          className="w-full h-12 px-6 rounded-2xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Invio in corso...</span>
            </>
          ) : (
            <>
              <span>Candidati Ora</span>
              <Send className="w-3.5 h-3.5 text-violet-400" />
            </>
          )}
        </button>
      )
    }

    return (
      <div className={`w-full h-12 px-4 rounded-2xl font-extrabold text-xs tracking-tight flex items-center justify-center gap-2 border ${
        statoCandidatura === 'in_attesa' ? 'bg-amber-50 text-amber-700 border-amber-200/80' :
        statoCandidatura === 'in_contatto' ? 'bg-blue-50 text-blue-700 border-blue-200/80' :
        statoCandidatura === 'accettato' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
        'bg-slate-100 text-slate-500 border-slate-200'
      }`}>
        {statoCandidatura === 'in_attesa' && <><Clock className="w-4 h-4 text-amber-600" /><span>Candidatura In Attesa</span></>}
        {statoCandidatura === 'in_contatto' && <><Send className="w-4 h-4 text-blue-600" /><span>In Contatto</span></>}
        {statoCandidatura === 'accettato' && <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>Candidatura Accettata</span></>}
        {statoCandidatura === 'rifiutato' && <span>Candidatura Non Accolta</span>}
      </div>
    )
  }

  // 📱 VERSION MOBILE BANNER
  if (isMobileBanner) {
    return (
      <div className="w-full">
        {renderCandidaturaAction()}
      </div>
    )
  }

  // 💻 VERSION DESKTOP SIDEBAR
  return (
    <div className="w-full flex flex-col gap-3">
      {renderCandidaturaAction()}

      <PosizioneQuestionPanel
        posizioneId={posizioneId}
        associazioneNome={associazioneNome}
        userId={user.id}
        loginHref={loginHref}
        initialCandidaturaId={candidatura?.id ?? null}
        buttonClassName="w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200/60 active:scale-95 flex items-center justify-center"
      />
    </div>
  )
}