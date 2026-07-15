'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import PosizioneQuestionPanel from '@/components/PosizioneQuestionPanel'
import CompetenzaBadge from '@/components/CompetenzaBadge'

interface PanelProps {
  posizioneId: string
  slug: string
  associazioneId: string
  associazioneNome: string
  competenzeRichieste: any[]
}

export default function PannelloCandidatura({ posizioneId, slug, associazioneId, associazioneNome, competenzeRichieste }: PanelProps) {
  const [user, setUser] = useState<any>(null)
  const [candidatura, setCandidatura] = useState<any>(null)
  const [competenzeVolontario, setCompetenzenVolontario] = useState<string[]>([])
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

    const [candResult, compResult] = await Promise.all([
      supabase.from('candidature').select('*').eq('posizione_id', posizioneId).eq('volontario_id', session.user.id).maybeSingle(),
      supabase.from('volontario_competenze').select('competenza_id').eq('volontario_id', session.user.id)
    ])

    setCandidatura(candResult.data)
    setCompetenzenVolontario(compResult.data?.map(c => c.competenza_id) || [])
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
    return <div className="w-full h-12 bg-slate-100 animate-pulse rounded-xl" />
  }

  const statoCandidatura = candidatura?.stato === 'accettata' ? 'accettato' : candidatura?.stato === 'rifiutata' ? 'rifiutato' : candidatura?.stato

  return (
    <div className="space-y-6 w-full">
      {/* Visualizzazione intelligente delle competenze (Match vs Mancanti) */}
      {competenzeRichieste.length > 0 && user && (
        <div className="border-t border-slate-100 pt-4 mb-4 hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Il tuo Match di Competenze</p>
          <div className="flex flex-wrap gap-1.5">
            {competenzeRichieste.map((comp) => {
              const checkMatch = competenzeVolontario.includes(comp.id)
              return (
                <div key={comp.id} className={checkMatch ? "opacity-100" : "opacity-35"}>
                  <CompetenzaBadge nome={comp.name} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 w-full">
        {!user ? (
          <Link href={loginHref} className="flex items-center justify-center bg-slate-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl text-sm transition-colors col-span-1 text-center">
            Accedi
          </Link>
        ) : !candidatura ? (
          <button onClick={handleCandidatura} disabled={isSubmitting} className="flex items-center justify-center bg-slate-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl text-sm transition-colors col-span-1">
            {isSubmitting ? 'Invio...' : 'Candidati'}
          </button>
        ) : (
          <div className={`flex items-center justify-center font-bold py-3.5 rounded-xl text-xs border col-span-1 ${
            statoCandidatura === 'in_attesa' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            statoCandidatura === 'in_contatto' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            statoCandidatura === 'accettato' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {statoCandidatura === 'in_attesa' && 'In Attesa'}
            {statoCandidatura === 'in_contatto' && 'In Contatto'}
            {statoCandidatura === 'accettato' && 'Assegnata'}
            {statoCandidatura === 'rifiutato' && 'Rifiutata'}
          </div>
        )}

        <PosizioneQuestionPanel
          posizioneId={posizioneId}
          associazioneNome={associazioneNome}
          userId={user?.id ?? null}
          loginHref={loginHref}
          initialCandidaturaId={candidatura?.id ?? null}
          buttonClassName="w-full col-span-1"
        />
      </div>
    </div>
  )
}