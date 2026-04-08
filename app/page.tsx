export const dynamic = 'force-dynamic'; // Ora funzionerà perché abbiamo toccato il config

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Index() {
  const cookieStore = await cookies()
  
  // Controlliamo le chiavi PRIMA di darle a Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return (
      <div className="p-20 border-4 border-red-500 bg-red-50">
        <h1 className="text-red-700 font-bold text-2xl">⚠️ Errore Chiavi Supabase</h1>
        <p className="mt-4">Il server non legge il file <b>.env.local</b>.</p>
        <p className="text-sm mt-2">Assicurati che sia nella cartella principale (accanto a package.json) e non dentro "app".</p>
      </div>
    )
  }

  const supabase = createServerClient(url, key, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="text-4xl font-bold">Volontariamo 🤝</h1>
        <a href="/sign-in" className="bg-blue-600 text-white px-6 py-2 rounded-xl">Accedi per iniziare</a>
      </div>
    )
  }

  // Se è loggato, facciamo lo smistamento
  const { data: vol } = await supabase.from('volontari').select('id').eq('id', user.id).single()
  const { data: ass } = await supabase.from('associazioni').select('id').eq('id', user.id).single()

  if (!vol && !ass) redirect('/auth/registrazione/onboarding')
  if (vol) redirect('/app/volontario')
  if (ass) redirect('/app/associazione')

  return null
}