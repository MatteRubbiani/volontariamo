import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { completeOnboarding } from '../actions'

export default async function VolontarioOnboarding() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })
  const { data: tags } = await supabase.from('tags').select('*').order('name')

  return (
    <form action={completeOnboarding} className="max-w-xl mx-auto py-20 px-6 space-y-8">
      <h1 className="text-3xl font-bold">Profilo Volontario</h1>
      <input type="hidden" name="role" value="volontario" />
      <input name="nome" placeholder="Nome Completo" className="w-full p-4 border rounded-xl" required />
      <textarea name="bio" placeholder="La tua bio..." className="w-full p-4 border rounded-xl h-32" />
      <div className="space-y-2">
        <p className="font-bold">I tuoi interessi:</p>
        <div className="flex flex-wrap gap-2">
          {tags?.map(t => (
            <label key={t.id} className="bg-slate-100 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-100">
              <input type="checkbox" name="tags" value={t.id} className="mr-2" /> {t.name}
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">Salva e Continua</button>
    </form>
  )
}