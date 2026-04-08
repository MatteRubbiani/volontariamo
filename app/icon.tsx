import { ImageResponse } from 'next/og'
import { HeartHandshake } from 'lucide-react'

// Configurazione dell'immagine (standard per le favicon)
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      // Qui "disegniamo" la tua favicon usando il componente Lucide
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb', // Il blu-600 che usiamo nel sito
        }}
      >
        <HeartHandshake width={24} height={24} />
      </div>
    ),
    {
      ...size,
    }
  )
}