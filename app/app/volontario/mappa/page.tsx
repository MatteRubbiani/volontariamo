import VistaEsplora from '@/components/VistaEsplora'

// Niente chiamate DB qui! Fa tutto il client in base allo schermo.
export default function VolontarioDashboard() {
  return (
    // L'altezza fissa impedisce alla pagina di scrollare, lasciando scorrere solo la colonna sinistra
    <div className="bg-white w-full h-[calc(100vh-70px)] overflow-hidden">
      <VistaEsplora />
    </div>
  )
}