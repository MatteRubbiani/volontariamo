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
  const isAccettaInvitoRoute = pathname.startsWith('/accetta-invito') // <-- AGGIUNTO

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
    // SINGOLA QUERY ALLA TABELLA HUB
    const { data: profilo } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .maybeSingle()

    const hasCompletedOnboarding = !!profilo 
    const isOnboardingRoute = pathname.startsWith('/app/onboarding')

    // CONTROLLO 1: Se NON ha finito e sta girando altrove, mandalo all'onboarding
    // Permettiamo di vedere l'invito anche se non ha finito l'onboarding? Sì, lo gestirà la pagina stessa.
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
    // Escludiamo la rotta dell'invito così non viene rimbalzato!
    if (hasCompletedOnboarding && (isAuthRoute || isOnboardingRoute || isHomeRoute) && !isAccettaInvitoRoute) {
      const ruoloDestinazione = profilo?.ruolo || 'volontario'
      return redirectWithCookies(new URL(`/app/${ruoloDestinazione}`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}