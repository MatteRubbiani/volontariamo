import { redirect } from 'next/navigation'
import { getUserWithRole } from '@/lib/auth'

export default async function ImpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, role } = await getUserWithRole()

  if (!session) redirect('/auth/login')
  if (!role) redirect('/app/onboarding')

  if (role === 'volontario') redirect('/app/volontario')
  if (role === 'associazione') redirect('/app/associazione')

  return <>{children}</>
}
