import { redirect } from 'next/navigation'

type LegacyOnboardingPageProps = {
  searchParams: Promise<{
    redirectTo?: string
  }>
}

export default async function LegacyOnboardingPage({ searchParams }: LegacyOnboardingPageProps) {
  const params = await searchParams
  const redirectTo =
    params.redirectTo && params.redirectTo.startsWith('/') && !params.redirectTo.startsWith('//')
      ? params.redirectTo
      : ''

  if (redirectTo) {
    redirect(`/app/onboarding?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  redirect('/app/onboarding')
}