import { getUserWithRole } from '@/lib/auth'
import { ImpresaLayoutWrapper } from './components/ImpresaLayoutWrapper'

export default async function ImpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getUserWithRole()

  return <ImpresaLayoutWrapper userEmail={user?.email}>{children}</ImpresaLayoutWrapper>
}
