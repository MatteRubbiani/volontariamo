import { redirect } from 'next/navigation'
import { getUserWithRole } from '@/lib/auth'

export default async function ImpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role } = await getUserWithRole()

  if (!user) redirect('/auth/login')
  if (!role) redirect('/app/onboarding')

  if (role === 'volontario') redirect('/app/volontario')
  if (role === 'associazione') redirect('/app/associazione')

  return <>{children}</>
}
