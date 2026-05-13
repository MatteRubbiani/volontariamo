import { getUserWithRole } from '@/lib/auth'
import { AssociazioneLayoutWrapper } from './components/AssociazioneLayoutWrapper'

export default async function AssociazioneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getUserWithRole()

  return <AssociazioneLayoutWrapper userEmail={user?.email}>{children}</AssociazioneLayoutWrapper>
}
