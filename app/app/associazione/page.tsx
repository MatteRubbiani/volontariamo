import { redirect } from 'next/navigation'

export default function AssociazioneDashboardRedirect() {
  // I professionisti reindirizzano la rotta base direttamente sul centro operativo
  redirect('/app/associazione/posizioni')
}