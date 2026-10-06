'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/types/supabase'

/**
 * Utility per garantire che il redirect avvenga solo su path interni
 */
function getSafeRedirectTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

/**
 * Helper per creare il client Supabase Server tipizzato
 */
async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
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
}

/**
 * ⚡ SIGN IN
 */
export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))

  if (!email || !password) {
    return { error: 'Inserisci sia email che password.' }
  }

  const supabase = await getSupabaseServerClient()

  // 1. Verifica credenziali Supabase
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message === 'Email not confirmed') {
      redirect(`/auth/verifica?email=${encodeURIComponent(email)}`)
    }
    return { error: 'Credenziali non valide. Controlla email e password.' }
  }

  // 2. Controllo redirect prioritario passato dal form
  if (redirectTo) {
    redirect(redirectTo)
  }

  const userId = data.user.id

  // 3. Query per recuperare il ruolo dal profilo
  const { data: profile } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', userId)
    .maybeSingle()

  // 4. Controllo se l'utente ha completato l'onboarding
  // (Verifichiamo se esiste il record nella tabella specifica del ruolo)
  if (profile?.ruolo === 'associazione') {
    const { data: associazione } = await supabase
      .from('associazioni')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!associazione) {
      redirect('/app/onboarding/associazione')
    }
    redirect('/app/associazione')
  }

  if (profile?.ruolo === 'volontario') {
    const { data: volontario } = await supabase
      .from('volontari')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!volontario) {
      redirect('/app/onboarding/volontario')
    }
    redirect('/app/volontario')
  }

  // Fallback per impresa o ruoli non configurati
  redirect('/app/volontario')
}

/**
 * SIGN UP (Generico: email + password)
 */
export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))
  
  const headersList = await headers()
  const forwardedHost = headersList.get('x-forwarded-host')
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'https'
  const origin =
    headersList.get('origin') ??
    (forwardedHost
      ? `${protocol}://${forwardedHost}`
      : host
        ? `${protocol}://${host}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

  const supabase = await getSupabaseServerClient()

  // 1. Esecuzione registrazione
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  })

  const redirectParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''

  if (error) {
    redirect(`/auth/registrazione?error=${encodeURIComponent(error.message)}${redirectParam}`)
  }

  // 2. Controllo Anti-Ghosting (se identities è vuoto l'account esisteva già)
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    const userExistsMessage = "Questa email è già associata a un account. Effettua il login."
    redirect(`/auth/registrazione?error=${encodeURIComponent(userExistsMessage)}${redirectParam}`)
  }

  // 3. Redirect alla schermata di verifica OTP / conferma
  redirect(`/auth/verifica?email=${encodeURIComponent(email)}${redirectParam}`)
}

/**
 * LOGOUT
 */
export async function logout() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * RESET PASSWORD
 */
export async function resetPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error("❌ Errore Reset:", error.message)
    return redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/auth/forgot-password/verify?email=${encodeURIComponent(email)}`)
}