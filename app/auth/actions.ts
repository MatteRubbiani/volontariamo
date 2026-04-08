'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function getSafeRedirectTo(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

function buildErrorRedirect(basePath: string, message: string, redirectTo: string | null) {
  const params = new URLSearchParams()
  params.set('error', message)
  if (redirectTo) {
    params.set('redirectTo', redirectTo)
  }
  return `${basePath}?${params.toString()}`
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(buildErrorRedirect('/auth/login', 'Credenziali non valide', redirectTo))
  }

  redirect(redirectTo || '/app/volontario')
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/protected`,
    },
  })

  if (error) {
    redirect(buildErrorRedirect('/auth/registrazione', 'Registrazione non riuscita', redirectTo))
  }

  const onboardingRedirect = redirectTo
    ? `/app/onboarding?redirectTo=${encodeURIComponent(redirectTo)}`
    : '/app/onboarding'
  redirect(onboardingRedirect)
}

export async function logout() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.signOut()
  redirect('/')
}