import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAppRoute = pathname.startsWith('/app')
  const isAuthRoute = pathname.startsWith('/auth')
  const isHomeRoute = pathname === '/' 
  const isAccettaInvitoRoute = pathname.startsWith('/accetta-invito') 
  
  // 🚨 NUOVA ROTTA WHITELISTATA
  const isUpdatePasswordRoute = pathname === '/auth/update-password'

  // Salviamo i cookie di Supabase anche quando facciamo redirect
  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  if (isAppRoute && !user) {
    return redirectWithCookies(new URL('/auth/login', request.url))
  }

  if (user) {
    // 🚨 IL LASCIAPASSARE: 
    // Se l'utente è loggato (tramite OTP) ed è sulla pagina di reset password, 
    // fermiamo tutti i controlli successivi e lo lasciamo passare.
    if (isUpdatePasswordRoute) {
      return supabaseResponse
    }

    // SINGOLA QUERY ALLA TABELLA HUB
    const { data: profilo } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .maybeSingle()

    const hasCompletedOnboarding = !!profilo 
    const isOnboardingRoute = pathname.startsWith('/app/onboarding')
    const ruolo = profilo?.ruolo || 'volontario'

    // CONTROLLO 1: Se NON ha finito e sta girando altrove, mandalo all'onboarding
    if (!hasCompletedOnboarding && !isOnboardingRoute && !isAccettaInvitoRoute) {
      const onboardingUrl = new URL('/app/onboarding', request.url)
      if (!isAuthRoute) {
        const currentPath = `${pathname}${request.nextUrl.search}`
        if (currentPath && currentPath !== '/') {
          onboardingUrl.searchParams.set('redirectTo', currentPath)
        }
      }
      return redirectWithCookies(onboardingUrl)
    }

    // CONTROLLO 2: Se HA FINITO e prova ad andare su Login, Onboarding OPPURE sulla Home (/)
    if (hasCompletedOnboarding && (isAuthRoute || isOnboardingRoute || isHomeRoute) && !isAccettaInvitoRoute) {
      return redirectWithCookies(new URL(`/app/${ruolo}`, request.url))
    }

    // CONTROLLO 3: Protezione delle rotte per ruolo (RBAC)
    // Entra in azione solo se l'utente è dentro /app/ e ha finito l'onboarding
    if (hasCompletedOnboarding && isAppRoute && !isOnboardingRoute) {
      
      const protectedRoutes = {
        '/app/volontario': 'volontario',
        '/app/associazione': 'associazione',
        '/app/impresa': 'impresa',
      }

      // Cicliamo sulle rotte protette. Se la rotta richiesta inizia con una di queste 
      // (es. /app/impresa/team) ma il ruolo non combacia, scatta il blocco.
      for (const [route, allowedRole] of Object.entries(protectedRoutes)) {
        if (pathname.startsWith(route) && ruolo !== allowedRole) {
          console.warn(`Accesso negato: Utente [${ruolo}] ha tentato di accedere a ${pathname}`)
          return redirectWithCookies(new URL(`/app/${ruolo}`, request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}