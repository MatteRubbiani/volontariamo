import { getUserWithRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AssociazioneLayoutWrapper } from './components/AssociazioneLayoutWrapper'

export default async function AssociazioneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role } = await getUserWithRole()

  // Controllo di sicurezza a livello di layout
  if (!user) {
    redirect('/auth/login?redirectTo=/app/associazione/oggi')
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Contenitore con padding di sicurezza per la dock bar mobile */}
      <AssociazioneLayoutWrapper>
        {children}
      </AssociazioneLayoutWrapper>
    </div>
  )
}