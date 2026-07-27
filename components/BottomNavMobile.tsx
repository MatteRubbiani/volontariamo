'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, Building2, MessageSquare, User, Search, Heart } from 'lucide-react'

export default function BottomNavMobile({
  email,
  isVolontario,
  isAssociazione,
  isImpresa,
  isAziendale,
  dashboardLink
}: {
  email?: string
  isVolontario: boolean
  isAssociazione: boolean
  isImpresa: boolean
  isAziendale: boolean
  dashboardLink: string
}) {
  const pathname = usePathname()
  const isLoggedIn = !!email

  const isActive = (path: string) => pathname === path

  const itemClass = (path: string) => `
    flex flex-col items-center justify-center gap-1 flex-1 py-1.5 text-[10px] font-bold transition-all rounded-xl select-none active:scale-95
    ${isActive(path) 
      ? (isAziendale ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-950') 
      : (isAziendale ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700')}
  `

  return (
    // 🟢 z-[99999] per stare sempre IN CIMA A TUTTO (mappe, card, modali)
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-[99999] isolate px-4 pointer-events-none">
      <nav className={`max-w-md mx-auto backdrop-blur-xl border rounded-2xl shadow-2xl p-1.5 flex items-center justify-between pointer-events-auto transition-colors duration-300 ${
        isAziendale ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200/90'
      }`}>
        
        {isLoggedIn ? (
          <>
            {/* ASSOCIAZIONI: Mantengono la loro Bacheca */}
            {isAssociazione && (
              <Link 
                href="/app/associazione/posizioni" 
                className={itemClass('/app/associazione/posizioni')}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Bacheca</span>
              </Link>
            )}

            {/* VOLONTARI: Mappa, Associazioni, Candidature (Senza Home vuota) */}
            {isVolontario && (
              <>
                <Link href="/mappa" className={itemClass('/mappa')}>
                  <MapPin className="w-4 h-4" />
                  <span>Mappa</span>
                </Link>

                <Link href="/associazioni" className={itemClass('/associazioni')}>
                  <Building2 className="w-4 h-4" />
                  <span>Associazioni</span>
                </Link>

                <Link 
                  href={isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature"} 
                  className={itemClass(isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature")}
                >
                  <Heart className="w-4 h-4" />
                  <span>{isAziendale ? 'Iniziative' : 'Candidature'}</span>
                </Link>
              </>
            )}

            {/* ASSOCIAZIONI: Cerca & Messaggi */}
            {isAssociazione && (
              <>
                <Link href="/associazioni" className={itemClass('/associazioni')}>
                  <Search className="w-4 h-4" />
                  <span>Cerca</span>
                </Link>

                <Link href="/app/associazione/messaggi" className={itemClass('/app/associazione/messaggi')}>
                  <MessageSquare className="w-4 h-4" />
                  <span>Messaggi</span>
                </Link>
              </>
            )}

            {/* PROFILO (Presente per tutti) */}
            <Link href="/app/profilo" className={itemClass('/app/profilo')}>
              <User className="w-4 h-4" />
              <span>Profilo</span>
            </Link>
          </>
        ) : (
          /* OSPITI NON LOGGATI (Mappa, Associazioni, Accedi) */
          <>
            <Link href="/mappa" className={itemClass('/mappa')}>
              <MapPin className="w-4 h-4" />
              <span>Mappa</span>
            </Link>
            
            <Link href="/associazioni" className={itemClass('/associazioni')}>
              <Building2 className="w-4 h-4" />
              <span>Associazioni</span>
            </Link>

            <Link href="/auth/login" className={itemClass('/auth/login')}>
              <User className="w-4 h-4" />
              <span>Accedi</span>
            </Link>
          </>
        )}

      </nav>
    </div>
  )
}