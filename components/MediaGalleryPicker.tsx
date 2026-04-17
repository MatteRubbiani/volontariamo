'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Media {
  id: string;
  url: string;
  nome: string;
}

interface Props {
  mediaIniziali: Media[];
  onSelect: (id: string | null) => void;
}

export default function MediaGalleryPicker({ mediaIniziali, onSelect }: Props) {
  const [galleria, setGalleria] = useState<Media[]>(mediaIniziali)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSelezione = (id: string) => {
    // Se clicco l'immagine già selezionata, la deseleziono
    const newId = selectedId === id ? null : id;
    setSelectedId(newId);
    onSelect(newId); // Comunico al form padre l'id scelto
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error("Utente non autenticato")

      // 1. Creiamo un nome file unico
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${authData.user.id}/${fileName}` // Organizziamo in cartelle per associazione

      // 2. Upload su Storage
      const { error: uploadError } = await supabase.storage
        .from('posizioni-immagini')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      // 3. Otteniamo l'URL pubblico
      const { data: urlData } = supabase.storage.from('posizioni-immagini').getPublicUrl(filePath)

      // 4. Salviamo nel database per la libreria
      const { data: newMedia, error: dbError } = await supabase
        .from('media_associazioni')
        .insert({
          associazione_id: authData.user.id,
          url: urlData.publicUrl,
          storage_path: filePath,
          nome: file.name
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 5. Aggiorniamo la UI
      setGalleria([newMedia, ...galleria])
      handleSelezione(newMedia.id)

    } catch (error) {
      console.error("Errore durante l'upload:", error)
      alert("C'è stato un problema durante il caricamento dell'immagine.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = '' // Reset input
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">
          Immagine di Copertina <span className="text-slate-400 font-medium normal-case tracking-normal">(Opzionale)</span>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* TASTO UPLOAD */}
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
            isUploading 
              ? 'border-slate-200 bg-slate-50' 
              : 'border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50 group'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold text-slate-500">Caricamento...</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Carica Foto</span>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept="image/png, image/jpeg, image/webp" 
            className="hidden" 
          />
        </div>

        {/* GALLERIA IMMAGINI ESISTENTI */}
        {galleria.map((img) => {
          const isSelected = selectedId === img.id;
          return (
            <div 
              key={img.id}
              onClick={() => handleSelezione(img.id)}
              className={`relative aspect-video rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 ${
                isSelected ? 'ring-4 ring-blue-600 scale-[0.98]' : 'hover:scale-[1.02] shadow-sm'
              }`}
            >
              <img 
                src={img.url} 
                alt={img.nome} 
                className="w-full h-full object-cover"
              />
              {/* Overlay scuro hover/selected */}
              <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-blue-900/20' : 'bg-slate-900/0 group-hover:bg-slate-900/10'}`}></div>
              
              {/* Checkmark in alto a destra se selezionato */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}