'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'
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
  const { workspace, hasAziendale } = useWorkspace()
  
  const isAziendale = isVolontario && workspace === 'aziendale'
  const isLoggedIn = !!email
  const needsOnboarding = isLoggedIn && !isVolontario && !isAssociazione && !isImpresa

  const chiudiMenu = () => setIsOpen(false)
  const userInitial = email ? email.charAt(0).toUpperCase() : 'U'

  const navBg = isAziendale ? 'bg-slate-900 border-purple-500/30' : 'bg-white/80 border-slate-200'
  const textColor = isAziendale ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-900'
  const logoIcon = isAziendale ? 'text-violet-400 group-hover:text-violet-300' : 'text-blue-600 group-hover:text-blue-700'
  const logoText = isAziendale ? 'text-white' : 'text-slate-900'
  
  return (
    <nav className={`border-b backdrop-blur-md sticky top-0 z-[100] transition-colors duration-500 ${navBg}`}>
      <div className="py-3 px-6 md:px-8 flex justify-between items-center max-w-7xl mx-auto">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-2">
          <Link href="/" onClick={chiudiMenu} className="group transition-opacity hover:opacity-90 flex items-center gap-2">
            <HeartHandshake className={`h-7 w-7 transition-colors ${logoIcon}`} />
            <span className={`text-xl font-black tracking-tight ${logoText}`}>Volontariando</span>
          </Link>
          
          {isAziendale && (
            <span className="hidden lg:inline-block ml-2 px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-black uppercase tracking-widest">
              Team ESG
            </span>
          )}
        </div>
        
        {/* NAVIGAZIONE CENTRALE */}
        <div className="hidden md:flex gap-6 items-center">
          {isLoggedIn && !needsOnboarding && (
            <>
              <Link href={dashboardLink} className={`text-sm font-bold transition-colors ${textColor}`}>
                Dashboard
              </Link>
              {isVolontario && (
                <>
                  <Link 
                    href="/app/volontario/mappa" 
                    className={`text-sm font-bold transition-colors ${textColor}`}
                  >
                    Mappa
                  </Link>
                  <Link 
                    href={isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature"} 
                    className={`text-sm font-bold transition-colors ${textColor}`}
                  >
                    {isAziendale ? 'Iniziative Team' : 'Le Mie Candidature'}
                  </Link>
                </>
              )}
              {/* NUOVO LINK PER LE ASSOCIAZIONI */}
              {isAssociazione && (
                <Link 
                  href="/app/associazione/candidature" 
                  className={`text-sm font-bold transition-colors ${textColor}`}
                >
                  Candidature Ricevute
                </Link>
              )}
            </>
          )}
        </div>

        {/* AREA DESTRA (IL CUORE DEL PROBLEMA) */}
        <div className="flex items-center gap-3">
          
          {/* WORKSPACE SWITCHER - Pulito e visibile */}
          {hasAziendale && isVolontario && (
            <div className="hidden md:flex items-center mr-2">
              <WorkspaceSwitcher />
            </div>
          )}

          {/* PROFILO E LOGOUT */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-1">
                <Link 
                  href="/profilo" 
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl border border-transparent transition-all group ${isAziendale ? 'hover:bg-slate-800 hover:border-slate-700' : 'hover:bg-slate-50 hover:border-slate-100'}`}
                >
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${isAziendale ? 'text-violet-400' : 'text-slate-400'}`}>Profilo</span>
                    <span className={`text-xs font-bold leading-none ${isAziendale ? 'text-slate-300' : 'text-slate-700'}`}>{email}</span>
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${isAziendale ? 'bg-slate-800 text-violet-300' : 'bg-slate-100 text-slate-600'}`}>
                    {userInitial}
                  </div>
                </Link>

                <form action={logout}>
                  <button type="submit" className={`p-2.5 rounded-xl transition-all ${isAziendale ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-bold text-slate-600 px-4 py-2 hover:text-blue-600 transition-colors">Accedi</Link>
                <Link href="/auth/registrazione" className="text-sm font-black bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all">
                  Unisciti
                </Link>
              </div>
            )}
          </div>

          {/* HAMBURGER MOBILE */}
          <button 
            className={`md:hidden p-2 rounded-lg transition-colors ${isAziendale ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <svg viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      {isOpen && (
        <div className={`md:hidden border-t px-6 py-6 flex flex-col gap-2 absolute w-full shadow-2xl ${isAziendale ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          
          {/* WORKSPACE SWITCHER (se volontario con azienda) */}
          {hasAziendale && isVolontario && (
            <div className={`mb-4 pb-4 border-b flex justify-center ${isAziendale ? 'border-slate-800' : 'border-slate-100'}`}>
              <WorkspaceSwitcher />
            </div>
          )}

          {/* LINK DI NAVIGAZIONE */}
          {isLoggedIn ? (
            <div className="flex flex-col gap-1">
              {!needsOnboarding && (
                <>
                  <Link 
                    href={dashboardLink} 
                    onClick={chiudiMenu}
                    className={`p-3 rounded-xl font-bold transition-all ${isAziendale ? 'text-white hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-50'}`}
                  >
                    Dashboard
                  </Link>

                  {isVolontario && (
                    <>
                      <Link 
                        href="/app/volontario/mappa" 
                        onClick={chiudiMenu}
                        className={`p-3 rounded-xl font-bold transition-all ${isAziendale ? 'text-white hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-50'}`}
                      >
                        Mappa
                      </Link>
                      <Link 
                        href={isAziendale ? "/app/volontario/iniziative-team" : "/app/volontario/candidature"} 
                        onClick={chiudiMenu}
                        className={`p-3 rounded-xl font-bold transition-all ${isAziendale ? 'text-white hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-50'}`}
                      >
                        {isAziendale ? 'Iniziative Team' : 'Le Mie Candidature'}
                      </Link>
                    </>
                  )}

                  {isAssociazione && (
                    <Link 
                      href="/app/associazione/candidature" 
                      onClick={chiudiMenu}
                      className={`p-3 rounded-xl font-bold transition-all ${isAziendale ? 'text-white hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-50'}`}
                    >
                      Candidature Ricevute
                    </Link>
                  )}
                </>
              )}

              {/* SEPARATORE */}
              <div className={`my-2 border-t ${isAziendale ? 'border-slate-800' : 'border-slate-100'}`}></div>

              {/* PROFILO E LOGOUT */}
              <Link 
                href="/profilo" 
                onClick={chiudiMenu}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isAziendale ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${isAziendale ? 'bg-slate-800 text-violet-300' : 'bg-slate-100 text-slate-600'}`}>
                  {userInitial}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${isAziendale ? 'text-violet-400' : 'text-slate-400'}`}>Profilo</span>
                  <span className={`text-sm font-bold leading-none ${isAziendale ? 'text-slate-300' : 'text-slate-700'}`}>{email}</span>
                </div>
              </Link>

              <form action={logout} className="mt-2">
                <button 
                  type="submit" 
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${isAziendale ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Esci
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <Link 
                href="/auth/login" 
                onClick={chiudiMenu}
                className="text-center font-bold text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Accedi
              </Link>
              <Link 
                href="/auth/registrazione" 
                onClick={chiudiMenu}
                className="text-center font-black bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg"
              >
                Unisciti
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}