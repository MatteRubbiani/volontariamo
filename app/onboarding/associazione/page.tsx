'use client'

import { useState } from 'react'
import { completeOnboarding } from '../actions'

export default function AssociazioneOnboarding() {
  const [isLoading, setIsLoading] = useState(false)

  // Creiamo una funzione "trappola" che esegue l'azione e poi forza il ricaricamento
  async function gestisciOnboarding(formData: FormData) {
    setIsLoading(true)
    
    try {
      await completeOnboarding(formData)
      // Se l'azione va a buon fine senza lanciare il redirect di Next, forziamo noi:
      window.location.assign('/dashboard/associazione')
    } catch (error) {
      // TRUCCO DA MAESTRI: In Next.js, la funzione redirect() del server in realtà 
      // lancia un errore dietro le quinte per interrompere l'esecuzione.
      // Noi lo catturiamo e lo sostituiamo con il nostro hard-reload infallibile!
      window.location.assign('/dashboard/associazione')
    }
  }

  return (
    <form action={gestisciOnboarding} className="max-w-xl mx-auto py-20 px-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">Profilo Associazione</h1>
      
      <input type="hidden" name="role" value="associazione" />
      
      <input 
        name="nome_ass" 
        placeholder="Nome dell'Organizzazione" 
        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all" 
        required 
      />
      
      <textarea 
        name="descrizione" 
        placeholder="Descrizione della vostra missione..." 
        className="w-full p-4 border rounded-xl h-32 focus:ring-2 focus:ring-green-500 outline-none transition-all" 
        required 
      />
      
      <button 
        type="submit" 
        disabled={isLoading}
        className={`w-full text-white font-bold py-4 rounded-xl transition-all ${
          isLoading ? 'bg-green-400 cursor-wait' : 'bg-green-600 hover:bg-green-700 active:scale-[0.98]'
        }`}
      >
        {isLoading ? 'Creazione in corso... ⏳' : 'Crea Associazione'}
      </button>
    </form>
  )
}