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
  // ✨ FIX COMPILAZIONE: Accetta l'ID nullo e l'URL opzionale per i nuovi caricamenti
  onSelect: (id: string | null, url?: string | null) => void;
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

  const handleSelezione = (id: string, url: string) => {
    const isGiaSelezionato = selectedId === id
    const newId = isGiaSelezionato ? null : id
    const newUrl = isGiaSelezionato ? null : url
    
    setSelectedId(newId)
    onSelect(newId, newUrl) // Sincronizzazione atomica con il padre
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error("Utente non autenticato")

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${authData.user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('posizioni-immagini')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('posizioni-immagini').getPublicUrl(filePath)

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

      // Aggiorna l'array di stato locale
      setGalleria([newMedia, ...galleria])
      
      // ✨ FIX PREMIUM: Forza la selezione immediata passando ID e URL dell'immagine appena nata
      setSelectedId(newMedia.id)
      onSelect(newMedia.id, newMedia.url)

    } catch (error) {
      console.error("Errore durante l'upload:", error)
      alert("C'è stato un problema durante il caricamento dell'immagine.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      {/* ELEGANZA AIRBNB: Rimosso il box di intestazione pesante, etichetta pulita */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* TASTO UPLOAD MINIMALE */}
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`aspect-video rounded-2xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
            isUploading 
              ? 'border-slate-200 bg-slate-50' 
              : 'border-slate-300 bg-slate-50/50 hover:border-slate-900 hover:bg-slate-50 group'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
              <span className="text-[11px] font-semibold text-slate-400">Caricamento...</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-1 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Aggiungi foto</span>
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
              onClick={() => handleSelezione(img.id, img.url)}
              className={`relative aspect-video rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                isSelected ? 'ring-2 ring-slate-900 shadow-md' : 'border border-slate-100'
              }`}
            >
              <img 
                src={img.url} 
                alt={img.nome} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-slate-900/5' : 'bg-slate-900/0 group-hover:bg-slate-900/5'}`}></div>
              
              {/* Checkmark in Stile Apple/Airbnb */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-slate-900 text-white p-1 rounded-full shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
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