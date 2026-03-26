import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { completeOnboarding } from '../actions'

export default async function VolontarioOnboarding() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Recuperiamo i tag per permettere al volontario di scegliere i suoi interessi
  const { data: tags } = await supabase.from('tags').select('*').order('name')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <form 
        action={completeOnboarding} 
        className="max-w-xl w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Profilo Volontario 👤</h1>
          <p className="text-slate-500 font-medium">Dicci chi sei e cosa ti appassiona per iniziare.</p>
        </div>

        <input type="hidden" name="role" value="volontario" />

        {/* CAMPO NOME */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nome Completo</label>
          <input 
            name="nome" 
            placeholder="Esempio: Mario Rossi" 
            className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-lg transition-all" 
            required 
          />
        </div>

        {/* SELEZIONE INTERESSI (TAGS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">I tuoi interessi</label>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">Seleziona i temi che preferisci</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {tags?.map(t => (
              <label 
                key={t.id} 
                className="group relative flex items-center cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  name="tags" 
                  value={t.id} 
                  className="peer sr-only" 
                />
                <span className="px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 font-bold text-sm transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-blue-200 group-hover:border-blue-200">
                  #{t.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-black py-6 rounded-[2rem] hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] text-xl"
        >
          Salva e Continua
        </button>
      </form>
    </div>
  )
}