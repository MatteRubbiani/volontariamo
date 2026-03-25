import { completeOnboarding } from '../actions'

export default function AssociazioneOnboarding() {
  return (
    <form action={completeOnboarding} className="max-w-xl mx-auto py-20 px-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">Profilo Associazione</h1>
      <input type="hidden" name="role" value="associazione" />
      <input name="nome_ass" placeholder="Nome dell'Organizzazione" className="w-full p-4 border rounded-xl" required />
      <textarea name="descrizione" placeholder="Descrizione della vostra missione..." className="w-full p-4 border rounded-xl h-32" required />
      <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 rounded-xl">Crea Associazione</button>
    </form>
  )
}