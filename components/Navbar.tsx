import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logout } from '@/app/auth/actions'

export default async function Navbar() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Identifichiamo il ruolo dell'utente
  let isVolontario = false
  let isAssociazione = false
  let dashboardLink = "/onboarding"

  if (user) {
    const [volRes, assRes] = await Promise.all([
      supabase.from('volontari').select('id').eq('id', user.id).single(),
      supabase.from('associazioni').select('id').eq('id', user.id).single()
    ])

    if (volRes.data) {
      isVolontario = true
      dashboardLink = "/dashboard/volontario"
    }
    if (assRes.data) {
      isAssociazione = true
      dashboardLink = "/dashboard/associazione"
    }
  }

  return (
    <nav className="border-b bg-white py-4 px-8 flex justify-between items-center shadow-sm sticky top-0 z-[100]">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter hover:scale-105 transition-transform">
          VOLONTARIAMO
        </Link>
        
        <div className="hidden md:flex gap-6 items-center">
          {user && (
            <>
              {/* LINK COMUNI */}
              <Link href={dashboardLink} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>

              {/* LINK SPECIFICI VOLONTARIO */}
              {isVolontario && (
                <>
                  <Link href="/annunci" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                    Esplora Annunci
                  </Link>
                  <Link 
                    href="/dashboard/volontario/candidature" 
                    className="text-sm font-black text-blue-500 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    Le Mie Candidature 📭
                  </Link>
                </>
              )}

              {/* LINK SPECIFICI ASSOCIAZIONE */}
              {isAssociazione && (
                <>
                  <Link 
                    href="/dashboard/associazione/candidature" 
                    className="text-sm font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                  >
                    Candidature Ricevute 🔔
                  </Link>
                  {/* Potresti aggiungere qui anche il link rapido per creare un nuovo annuncio */}
                  <Link href="/dashboard/associazione/posizioni/nuova" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                    Nuovo Annuncio +
                  </Link>
                </>
              )}

              <Link href="/profilo" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                Mio Profilo
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">Account</span>
              <span className="text-xs font-bold text-slate-500 leading-none">{user.email}</span>
            </div>
            
            <form action={logout}>
              <button 
                type="submit" 
                className="text-sm font-black text-red-500 bg-red-50 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl transition-all border border-red-100 active:scale-95"
              >
                ESCI
              </button>
            </form>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className="text-sm font-bold px-4 py-2 hover:text-blue-600 transition-colors">
              Accedi
            </Link>
            <Link 
              href="/auth/sign-up" 
              className="text-sm font-black bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Unisciti
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}