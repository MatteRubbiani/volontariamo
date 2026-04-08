import OnboardingForm from './OnboardingForm'

type OnboardingPageProps = {
  searchParams: Promise<{
    redirectTo?: string
  }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams
  const redirectTo =
    params.redirectTo && params.redirectTo.startsWith('/') && !params.redirectTo.startsWith('//')
      ? params.redirectTo
      : ''

  return (
    <OnboardingForm redirectTo={redirectTo} />
  )
}
