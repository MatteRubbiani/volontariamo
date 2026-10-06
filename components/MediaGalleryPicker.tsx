'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Plus, Check } from 'lucide-react'

interface Media {
  id: string
  url: string
  nome: string
}

interface Props {
  mediaIniziali?: Media[]
  valoreIniziale?: string | null
  onSelect: (id: string | null, url?: string | null) => void
}

const BUCKET_NAME = 'posizioni'

export default function MediaGalleryPicker({ mediaIniziali = [], valoreIniziale, onSelect }: Props) {
  const [galleria, setGalleria] = useState<Media[]>(mediaIniziali)
  const [selectedId, setSelectedId] = useState<string | null>(valoreIniziale || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  )

  // 📂 Recupera in automatico le foto già caricate dall'utente nello storage
  useEffect(() => {
    async function caricaFotoEsistenti() {
      setIsLoadingGallery(true)
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) return

        const { data: files, error } = await supabase.storage
          .from(BUCKET_NAME)
          .list(authData.user.id, {
            limit: 30,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (error) {
          console.warn('Avviso lettura bucket storage:', error.message)
          return
        }

        if (files && files.length > 0) {
          const recuperate: Media[] = files
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map(f => {
              const filePath = `${authData.user.id}/${f.name}`
              const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath)

              return {
                id: filePath,
                url: urlData.publicUrl,
                nome: f.name
              }
            })

          setGalleria(recuperate)
        }
      } catch (err) {
        console.error('Errore recupero foto:', err)
      } finally {
        setIsLoadingGallery(false)
      }
    }

    caricaFotoEsistenti()
  }, [supabase])

  const handleSelezione = (id: string, url: string) => {
    const isGiaSelezionato = selectedId === id || selectedId === url
    const newId = isGiaSelezionato ? null : id
    const newUrl = isGiaSelezionato ? null : url
    
    setSelectedId(newId)
    onSelect(newId, newUrl)
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

      // Upload diretto sul bucket posizioni
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      const nuovoMedia: Media = {
        id: filePath,
        url: urlData.publicUrl,
        nome: file.name
      }

      // Aggiorna lo stato locale senza toccare tabelle SQL inesistenti
      setGalleria(prev => [nuovoMedia, ...prev])
      setSelectedId(nuovoMedia.id)
      onSelect(nuovoMedia.id, nuovoMedia.url)

    } catch (error: any) {
      console.error("Errore durante l'upload:", error)
      alert("C'è stato un problema durante il caricamento dell'immagine. Verifica che il bucket 'posizioni' sia pubblico.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* TASTO UPLOAD AIRBNB STYLE */}
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
              <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
              <span className="text-[11px] font-semibold text-slate-400">Caricamento...</span>
            </div>
          ) : (
            <>
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-1 transition-colors" />
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

        {/* SPINNER CARICAMENTO FOTO ESISTENTI */}
        {isLoadingGallery && galleria.length === 0 && (
          <div className="aspect-video rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        )}

        {/* GALLERIA FOTO CARICATE */}
        {galleria.map((img) => {
          const isSelected = selectedId === img.id || selectedId === img.url
          return (
            <div 
              key={img.id}
              onClick={() => handleSelezione(img.id, img.url)}
              className={`relative aspect-video rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                isSelected ? 'ring-2 ring-slate-900 shadow-md' : 'border border-slate-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={img.url} 
                alt={img.nome} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-slate-900/10' : 'bg-slate-900/0 group-hover:bg-slate-900/5'}`} />
              
              {/* Checkmark Apple/Airbnb */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-slate-900 text-white p-1 rounded-full shadow-md animate-in zoom-in-75 duration-200">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}