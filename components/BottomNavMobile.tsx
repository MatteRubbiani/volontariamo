'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, MessageSquare, User, Search, Heart, Palette } from 'lucide-react'

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
    // 🟢 z-[99999] e isolate per stare sempre IN CIMA A TUTTO (mappe, card, immagini)
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-[99999] isolate px-4 pointer-events-none">
      <nav className={`max-w-md mx-auto backdrop-blur-xl border rounded-2xl shadow-2xl p-1.5 flex items-center justify-between pointer-events-auto transition-colors duration-300 ${
        isAziendale ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200/90'
      }`}>
        
        {isLoggedIn ? (
          <>
            <Link 
              href={isAssociazione ? '/app/associazione/posizioni' : dashboardLink} 
              className={itemClass(isAssociazione ? '/app/associazione/posizioni' : dashboardLink)}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{isAssociazione ? 'Bacheca' : 'Home'}</span>
            </Link>

            {isVolontario && (
              <Link href="/mappa" className={itemClass('/mappa')}>
                <MapPin className="w-4 h-4" />
                <span>Mappa</span>
              </Link>
            )}

            {isAssociazione && (
              <Link href="/app/associazione/rete" className={itemClass('/app/associazione/rete')}>
                <Search className="w-4 h-4" />
                <span>Cerca</span>
              </Link>
            )}

            {isVolontario && (
              <Link 
                href={isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature"} 
                className={itemClass(isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature")}
              >
                <Heart className="w-4 h-4" />
                <span>{isAziendale ? 'Iniziative' : 'Candidature'}</span>
              </Link>
            )}

            {isAssociazione && (
              <Link href="/app/associazione/messaggi" className={itemClass('/app/associazione/messaggi')}>
                <MessageSquare className="w-4 h-4" />
                <span>Messaggi</span>
              </Link>
            )}

            {isAssociazione && (
              <Link href="/app/associazione/personalizza" className={itemClass('/app/associazione/personalizza')}>
                <Palette className="w-4 h-4" />
                <span>Vetrina</span>
              </Link>
            )}

            <Link href="/app/profilo" className={itemClass('/app/profilo')}>
              <User className="w-4 h-4" />
              <span>Profilo</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/mappa" className={itemClass('/mappa')}>
              <MapPin className="w-4 h-4" />
              <span>Mappa</span>
            </Link>
            <Link href="/auth/login" className={itemClass('/auth/login')}>
              <User className="w-4 h-4" />
              <span>Accedi</span>
            </Link>
            <Link href="/auth/registrazione" className={itemClass('/auth/registrazione')}>
              <Heart className="w-4 h-4" />
              <span>Unisciti</span>
            </Link>
          </>
        )}

      </nav>
    </div>
  )
}