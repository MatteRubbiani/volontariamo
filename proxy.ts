import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
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

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    const [{ data: volontario }, { data: associazione }, { data: impresa }] = await Promise.all([
      supabase.from('volontari').select('id').eq('id', user.id).maybeSingle(),
      supabase.from('associazioni').select('id').eq('id', user.id).maybeSingle(),
      supabase.from('imprese').select('id').eq('id', user.id).maybeSingle(),
    ])

    const hasCompletedOnboarding = Boolean(volontario || associazione || impresa)
    const isOnboardingRoute = pathname.startsWith('/app/onboarding')

    if (!hasCompletedOnboarding && !isOnboardingRoute) {
      const onboardingUrl = new URL('/app/onboarding', request.url)
      if (!pathname.startsWith('/auth')) {
        const currentPath = `${pathname}${request.nextUrl.search}`
        if (currentPath && currentPath !== '/') {
          onboardingUrl.searchParams.set('redirectTo', currentPath)
        }
      }
      return NextResponse.redirect(onboardingUrl)
    }

    if (isAuthRoute) {
      const destination = hasCompletedOnboarding ? '/app/volontario' : '/app/onboarding'
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
