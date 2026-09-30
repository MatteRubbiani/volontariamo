'use client'


export function VolontarioLayoutWrapper({
  children,
  userEmail
}: {
  children: React.ReactNode
  userEmail?: string
}) {
  return (

      <div className="flex-1">
        {children}
      </div>
      
  )
}