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

  // Controllo ruolo per i link personalizzati
  let dashboardLink = "/onboarding"
  if (user) {
    const { data: vol } = await supabase.from('volontari').select('id').eq('id', user.id).single()
    const { data: ass } = await supabase.from('associazioni').select('id').eq('id', user.id).single()
    if (vol) dashboardLink = "/dashboard/volontario"
    if (ass) dashboardLink = "/dashboard/associazione"
  }

  return (
    <nav className="border-b bg-white py-4 px-8 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">
          VOLONTARIAMO
        </Link>
        
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <Link href="/annunci" className="hover:text-blue-600 transition-colors">
            Esplora Annunci
          </Link>
          {user && (
            <>
              <Link href={dashboardLink} className="hover:text-blue-600 transition-colors">
                La mia Dashboard
              </Link>
              {/* LINK PROFILO AGGIUNTO QUI */}
              <Link href="/profilo" className="hover:text-blue-600 transition-colors font-bold text-slate-900">
                Mio Profilo
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-400 hidden lg:block">{user.email}</span>
            <form action={logout}>
              <button 
                type="submit" 
                className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
              >
                Esci
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
              className="text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all"
            >
              Unisciti
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}