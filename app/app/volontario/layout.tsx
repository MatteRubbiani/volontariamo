import { redirect } from 'next/navigation'
import { getUserWithRole } from '@/lib/auth'

export default async function VolontarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, role } = await getUserWithRole()

  if (!session) redirect('/auth/login')
  if (!role) redirect('/app/onboarding')

  if (role === 'associazione') redirect('/app/associazione')
  if (role === 'impresa') redirect('/app/impresa')

  return <>{children}</>
}
