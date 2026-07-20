'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HeartHandshake, LogOut, Menu, X, User, MapPin, LayoutDashboard, MessageSquare, Search, Palette, Heart } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { useWorkspace } from '@/lib/context/WorkspaceContext'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'

export default function NavbarUI({
  email,
  isVolontario,
  isAssociazione,
  isImpresa,
  dashboardLink
}: {
  email?: string
  isVolontario: boolean
  isAssociazione: boolean
  isImpresa: boolean
  dashboardLink: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { workspace, hasAziendale } = useWorkspace()
  
  const isAziendale = isVolontario && workspace === 'aziendale'
  const isLoggedIn = !!email
  const needsOnboarding = isLoggedIn && !isVolontario && !isAssociazione && !isImpresa

  const chiudiMenu = () => setIsOpen(false)
  const userInitial = email ? email.charAt(0).toUpperCase() : 'U'

  // Stili condizionali
  const navBg = isAziendale 
    ? 'bg-slate-950/80 border-slate-800 text-slate-100' 
    : 'bg-white/80 border-slate-100 text-slate-900'

  const isActive = (path: string) => pathname === path

  const linkClass = (path: string) => `
    text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 select-none
    ${isActive(path) 
      ? (isAziendale ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-950 font-bold') 
      : (isAziendale ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80')}
  `

  return (
    <nav className={`border-b backdrop-blur-xl sticky top-0 z-[9999] transition-all duration-300 ${navBg}`}>
      <div className="py-2.5 px-6 md:px-8 flex justify-between items-center max-w-7xl mx-auto">
        
        {/* LOGO BRAND */}
        <div className="flex items-center gap-3">
          <Link href="/" onClick={chiudiMenu} className="group flex items-center gap-2.5 transition-transform active:scale-95">
            <div className={`p-1.5 rounded-xl transition-colors ${isAziendale ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-950 text-white'}`}>
              <HeartHandshake className="h-5 w-5" />
            </div>
            <span className={`text-base font-extrabold tracking-tight ${isAziendale ? 'text-white' : 'text-slate-950'}`}>
              Volontariando
            </span>
          </Link>
          
          {isAziendale && (
            <span className="hidden lg:inline-flex px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[9px] font-bold uppercase tracking-wider">
              Corporate ESG
            </span>
          )}
        </div>
        
        {/* NAVIGAZIONE CENTRALE (DESKTOP) */}
        <div className="hidden md:flex gap-1 items-center bg-slate-50/50 p-1 rounded-2xl border border-slate-100/60 dark:bg-slate-900/40 dark:border-slate-800">
          {isLoggedIn ? (
            !needsOnboarding && (
              <>
                <Link 
                  href={isAssociazione ? '/app/associazione/posizioni' : dashboardLink} 
                  className={linkClass(isAssociazione ? '/app/associazione/posizioni' : dashboardLink)}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 opacity-70" />
                  {isAssociazione ? 'Bacheca' : 'Dashboard'}
                </Link>
                
                {isVolontario && (
                  <>
                    <Link href="/mappa" className={linkClass('/mappa')}>
                      <MapPin className="w-3.5 h-3.5 opacity-70" />
                      Mappa
                    </Link>
                    <Link 
                      href={isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature"} 
                      className={linkClass(isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature")}
                    >
                      <Heart className="w-3.5 h-3.5 opacity-70" />
                      {isAziendale ? 'Iniziative Team' : 'Le mie Candidature'}
                    </Link>
                  </>
                )}

                {isAssociazione && (
                  <>
                    <Link href="/app/associazione/messaggi" className={linkClass('/app/associazione/messaggi')}>
                      <MessageSquare className="w-3.5 h-3.5 opacity-70" />
                      Messaggi
                    </Link>
                    <Link href="/app/associazione/rete" className={linkClass('/app/associazione/rete')}>
                      <Search className="w-3.5 h-3.5 opacity-70" />
                      Cerca Volontari
                    </Link>
                    <Link href="/app/associazione/personalizza" className={linkClass('/app/associazione/personalizza')}>
                      <Palette className="w-3.5 h-3.5 opacity-70" />
                      Vetrina
                    </Link>
                  </>
                )}
              </>
            )
          ) : (
            <Link href="/mappa" className={linkClass('/mappa')}>
              <MapPin className="w-3.5 h-3.5 opacity-70" />
              Esplora Mappa
            </Link>
          )}
        </div>

        {/* AREA DESTRA (UTENTE & WORKSPACE) */}
        <div className="flex items-center gap-2.5">
          
          {hasAziendale && isVolontario && (
            <div className="hidden md:flex items-center mr-1">
              <WorkspaceSwitcher />
            </div>
          )}

          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-100 dark:border-slate-800">
              
              {/* 🟢 ROTTA AGGIORNATA SU /app/profilo CON PILLOLA PULITA */}
              <Link 
                href="/app/profilo" 
                className={`flex items-center gap-2.5 p-1 pr-3 rounded-full border transition-all ${
                  isAziendale 
                    ? 'bg-slate-900 border-slate-800 hover:border-violet-500/40' 
                    : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs ${
                  isAziendale ? 'bg-violet-600 text-white' : 'bg-slate-950 text-white'
                }`}>
                  {userInitial}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate leading-tight">
                    {email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">
                    {isAssociazione ? 'Associazione' : isVolontario ? (isAziendale ? 'Team ESG' : 'Volontario') : 'Profilo'}
                  </span>
                </div>
              </Link>

              {/* PULSANTE LOGOUT */}
              <form action={logout}>
                <button 
                  type="submit" 
                  title="Disconnetti"
                  className={`p-2 rounded-xl transition-all ${
                    isAziendale 
                      ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30' 
                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="text-xs font-semibold text-slate-600 px-3.5 py-2 hover:text-slate-950 transition-colors">
                Accedi
              </Link>
              <Link href="/auth/registrazione" className="text-xs font-semibold bg-slate-950 text-white px-4 py-2 rounded-xl hover:bg-black transition-all shadow-xs active:scale-95">
                Unisciti
              </Link>
            </div>
          )}

          {/* HAMBURGER BUTTON MOBILE */}
          <button 
            className={`md:hidden p-2 rounded-xl transition-colors ${isAziendale ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100'}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Apri Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE COMPATTO */}
      {isOpen && (
        <div className={`md:hidden border-t px-5 py-5 flex flex-col gap-3 absolute w-full shadow-xl backdrop-blur-2xl transition-all ${
          isAziendale ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-100'
        }`}>
          
          {hasAziendale && isVolontario && (
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-center">
              <WorkspaceSwitcher />
            </div>
          )}

          {isLoggedIn ? (
            <div className="flex flex-col gap-1">
              {!needsOnboarding && (
                <>
                  <Link 
                    href={isAssociazione ? '/app/associazione/posizioni' : dashboardLink} 
                    onClick={chiudiMenu}
                    className="p-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {isAssociazione ? 'Bacheca' : 'Dashboard'}
                  </Link>

                  {isVolontario && (
                    <>
                      <Link href="/mappa" onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                        Mappa
                      </Link>
                      <Link href={isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature"} onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                        {isAziendale ? 'Iniziative Team' : 'Le Mie Candidature'}
                      </Link>
                    </>
                  )}

                  {isAssociazione && (
                    <>
                      <Link href="/app/associazione/messaggi" onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">Messaggi</Link>
                      <Link href="/app/associazione/rete" onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">Cerca Volontari</Link>
                      <Link href="/app/associazione/personalizza" onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">Vetrina</Link>
                    </>
                  )}
                </>
              )}

              <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>

              {/* 🟢 ROTTA AGGIORNATA MOBILE SU /app/profilo */}
              <Link 
                href="/app/profilo" 
                onClick={chiudiMenu}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs">
                  {userInitial}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{email}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Gestisci Profilo</span>
                </div>
              </Link>

              <form action={logout} className="mt-2">
                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Disconnetti
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              <Link href="/mappa" onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-bold text-center hover:bg-slate-100">
                Esplora Mappa
              </Link>
              <Link href="/auth/login" onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-bold text-center hover:bg-slate-100">
                Accedi
              </Link>
              <Link href="/auth/registrazione" onClick={chiudiMenu} className="p-2.5 rounded-xl text-xs font-bold text-center bg-slate-950 text-white">
                Unisciti
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}