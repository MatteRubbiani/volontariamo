'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DndContext, PointerSensor, TouchSensor, MouseSensor, closestCenter, DragEndEvent, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FileText, GripVertical, Image as ImageIcon, LayoutGrid, Link2, Plus, Quote, Save, Settings2, Sparkles, Trash2, Users, Loader2, UploadCloud, Heart, Briefcase, MessageSquare, Video, Mail, Target, Eye, Move, ChevronUp, ChevronDown } from 'lucide-react'
import PosizioneCard from '@/components/PosizioneCard'

// ==========================================
// 1. TIPI E COSTANTI
// ==========================================
type BlockType = 'hero' | 'stats' | 'about' | 'mission' | 'vision' | 'gallery' | 'links' | 'faq' | 'documents' | 'partners' | 'positions' | 'donations' | 'projects' | 'testimonials' | 'video' | 'contacts'
type LayoutBlock = { id: string; type: BlockType; content: any }
type HeroContent = { 
  title: string; eyebrow: string; subtitle: string; coverUrl: string; logoUrl: string; brandColor: string;
  coverY?: number; coverZoom?: number;
  logoX?: number; logoY?: number; logoZoom?: number;
}

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const DEFAULT_BRAND = '#111827'
const BUCKET_NAME = 'media_associazioni'

const blockLibrary = [
  { type: 'about', label: 'Testo Libero / Chi siamo', icon: Quote, desc: 'Aggiungi paragrafi descrittivi o la vostra storia', isUnique: false },
  { type: 'stats', label: 'Numeri chiave', icon: Users, desc: 'Mostra statistiche d’impatto della tua associazione', isUnique: true },
  { type: 'mission', label: 'La nostra Mission', icon: Target, desc: 'Il motivo per cui esistete e l’impatto generato', isUnique: true },
  { type: 'vision', label: 'La nostra Vision', icon: Eye, desc: 'La direzione futura che volete costruire', isUnique: true },
  { type: 'gallery', label: 'Galleria Foto', icon: ImageIcon, desc: 'Mosaico visivo fluido auto-adattivo', isUnique: false },
  { type: 'donations', label: 'Dona & Sostieni', icon: Heart, desc: 'IBAN, 5x1000 e raccolta fondi pulita', isUnique: true },
  { type: 'projects', label: 'Progetti Attivi', icon: Briefcase, desc: 'Mostra cosa fate sul territorio', isUnique: false },
  { type: 'testimonials', label: 'Testimonianze', icon: MessageSquare, desc: 'Storie d’impatto con foto dei tuoi volontari', isUnique: false },
  { type: 'video', label: 'Video Storytelling', icon: Video, desc: 'Incastona un video emozionale da YouTube/Vimeo', isUnique: false },
  { type: 'faq', label: 'FAQ', icon: Settings2, desc: 'Domande frequenti', isUnique: true },
  { type: 'documents', label: 'Documenti', icon: FileText, desc: 'Moduli e file scaricabili', isUnique: true },
  { type: 'links', label: 'Link Utili', icon: Link2, desc: 'Sito web e social network', isUnique: true },
  { type: 'contacts', label: 'Contatti & Sedi', icon: Mail, desc: 'Info di contatto e form rapido per domande', isUnique: true },
  { type: 'partners', label: 'Partner e Sponsor', icon: LayoutGrid, desc: 'Con chi collaborate', isUnique: true },
  { type: 'positions', label: 'Posizioni', icon: Users, desc: 'Le tue posizioni aperte (Automatico)', isUnique: true },
]

function uid() { return Math.random().toString(36).slice(2, 10) }

// ==========================================
// 2. MOTORE DI UPLOAD
// ==========================================
async function uploadFileToSupabase(file: File, folder: 'images' | 'documents'): Promise<{ url: string, name: string } | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${uid()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    return { url: data.publicUrl, name: file.name.replace(`.${fileExt}`, '') }
  } catch (error) {
    alert("Errore durante il caricamento. Riprova.")
    return null
  }
}

// ==========================================
// 3. COMPONENTI UI PREMIUM (CON FOCUS & KEYBOARD AUTO-SCROLL)
// ==========================================
function EditableField({ value, placeholder, onChange, className = '', inputClassName = '', multiline = false, tag = 'div', disableWFull = false }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const ref = useRef<any>(null)

  // 🟢 AUTO-SCROLL SULLA TASTIERA MOBILE + FOCUS INTELLIGENTE
  useEffect(() => { 
    if (isEditing) {
      window.requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.focus()
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    } 
  }, [isEditing])

  if (isEditing) {
    const widthClass = disableWFull ? '' : 'w-full'
    // 🟢 text-base (16px) PREVIENE LO ZOOM AUTOMATICO SU SAFARI MOBILE
    const commonClasses = `${widthClass} bg-slate-50 outline-none ring-4 ring-slate-100/50 rounded-xl transition-all p-2 -ml-2 text-base md:text-inherit ${inputClassName} ${className}`
    if (multiline) {
      return <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} onBlur={() => setIsEditing(false)} 
        onKeyDown={e => { if (e.key === 'Escape') setIsEditing(false) }}
        className={`${commonClasses} resize-none min-h-[120px] whitespace-pre-wrap`} 
      />
    }
    return <input ref={ref} value={value} onChange={e => onChange(e.target.value)} onBlur={() => setIsEditing(false)} 
      onKeyDown={e => { if (e.key === 'Escape' || e.key === 'Enter') setIsEditing(false) }}
      className={commonClasses} 
    />
  }

  const Tag = tag as any
  return (
    <Tag onClick={() => setIsEditing(true)} 
      className={`cursor-text hover:bg-slate-50 rounded-xl -ml-2 p-2 transition-colors duration-200 ${value ? 'whitespace-pre-wrap' : 'text-slate-300 italic'} ${className}`}>
      {value?.trim() || placeholder}
    </Tag>
  )
}

function EditableImage({ value, onChange, className = '', children }: any) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const result = await uploadFileToSupabase(file, 'images')
    if (result) onChange(result.url)
    setIsUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={`relative group cursor-pointer overflow-hidden bg-slate-100 transition-all ${className}`} onClick={() => !value && inputRef.current?.click()}>
      <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      {isUploading && <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-md z-40"><Loader2 className="w-8 h-8 animate-spin text-slate-900" /></div>}
      {value ? <img src={value} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Contenuto" /> : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors">
          <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
          <span className="text-[9px] uppercase font-bold tracking-widest text-center">Carica</span>
        </div>
      )}
      {value && !isUploading && (
        <div className="absolute inset-0 bg-black/20 md:opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-10 backdrop-blur-[2px]">
          <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }} className="p-2 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all" title="Sostituisci"><UploadCloud className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onChange('') }} className="p-2 bg-red-500 text-white rounded-full shadow-2xl hover:scale-110 transition-all" title="Rimuovi"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {children}
    </div>
  )
}

function EditableDocumentItem({ doc, onFileUploaded, onRemove, onNameChange }: { doc: any, onFileUploaded: (res: {nome: string, url: string}) => void, onRemove: () => void, onNameChange: (name: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const result = await uploadFileToSupabase(file, 'documents')
    if (result) onFileUploaded({ nome: result.name, url: result.url })
    setIsUploading(false)
  }

  return (
    <div className="relative group flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => !doc.url && inputRef.current?.click()}>
      <input type="file" ref={inputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
      
      <div className="w-10 h-10 shrink-0 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        {doc.url ? (
          <div className="w-full">
            <EditableField 
              tag="span" 
              value={doc.nome} 
              placeholder="Dai un nome a questo PDF..." 
              onChange={onNameChange} 
              className="font-bold text-slate-900 text-sm leading-snug block whitespace-pre-wrap break-words" 
            />
          </div>
        ) : (
          <span className="font-bold text-slate-400 text-sm block py-1">Carica file PDF</span>
        )}
        {doc.url && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PDF Scaricabile</span>}
      </div>

      {doc.url && !isUploading && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove() }} 
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors self-start"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// 🟢 WRAPPER BLOCCO CON TRANSIZIONI CSS E ID PER AUTO-SCROLL
function SortableBlockShell({ block, onRemove, onMoveUp, onMoveDown, isFirst, isLast, children, locked = false }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: locked })
  
  // 🟢 TRANSIZIONE MORBIDA PER LO SPOSTAMENTO DEI BLOCCHI
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition: transition || 'transform 300ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div 
      id={`block-${block.id}`}
      ref={setNodeRef} 
      style={style} 
      className={`group flex flex-col relative w-full rounded-[2.5rem] transition-all duration-300 ${isDragging ? 'opacity-95 shadow-2xl bg-white ring-1 ring-slate-200' : ''}`}
    >
      
      {/* CONTROLLI MOBILE (Barra orizzontale in alto al blocco) */}
      {!locked && (
        <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-slate-100/90 backdrop-blur-md rounded-2xl mb-1 border border-slate-200/60 shadow-xs">
          <div className="flex items-center gap-1">
            <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1.5 bg-white text-slate-700 active:scale-90 disabled:opacity-30 rounded-xl shadow-xs border border-slate-200/80">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1.5 bg-white text-slate-700 active:scale-90 disabled:opacity-30 rounded-xl shadow-xs border border-slate-200/80">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="p-1.5 bg-white text-slate-600 rounded-xl shadow-xs border border-slate-200/80 flex items-center gap-1 text-[10px] font-bold">
              <GripVertical className="w-4 h-4" /> Trascina
            </button>
            <button type="button" onClick={() => onRemove(block.id)} className="p-1.5 bg-white text-rose-600 active:scale-90 rounded-xl shadow-xs border border-slate-200/80">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CONTROLLI DESKTOP (Sidecar a sinistra) */}
      <div className={`hidden md:flex absolute -left-12 top-6 flex-col items-center gap-1 opacity-0 transition-opacity duration-200 ${!locked && 'group-hover:opacity-100'}`}>
        <button {...attributes} {...listeners} className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing shadow-sm bg-white border border-slate-100"><GripVertical className="h-5 w-5" /></button>
        <button onClick={() => onRemove(block.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg shadow-sm bg-white border border-slate-100"><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className={`flex-1 w-full rounded-[2.5rem] px-2 py-1 transition-colors ${!isDragging && 'hover:bg-slate-50/50'}`}>
        {children}
      </div>
    </div>
  )
}

// ==========================================
// 4. COMPONENTI BLOCCO CORE + NOTION/LINKEDIN CROP
// ==========================================
const Blocks = {
  hero: ({ content, onChange }: any) => {
    const [editMode, setEditMode] = useState<'none' | 'cover' | 'logo'>('none');
    const [tempPos, setTempPos] = useState({ x: 50, y: 50, zoom: 1 });
    
    const coverInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState<'cover'|'logo'|null>(null);

    const startReposition = (type: 'cover' | 'logo') => {
      setEditMode(type);
      setTempPos({
        x: type === 'cover' ? 50 : (content.logoX ?? 50),
        y: type === 'cover' ? (content.coverY ?? 50) : (content.logoY ?? 50),
        zoom: type === 'cover' ? (content.coverZoom ?? 1) : (content.logoZoom ?? 1)
      });
    };

    const handleSave = () => {
      if (editMode === 'cover') {
        onChange({ ...content, coverY: tempPos.y, coverZoom: tempPos.zoom });
      } else if (editMode === 'logo') {
        onChange({ ...content, logoX: tempPos.x, logoY: tempPos.y, logoZoom: tempPos.zoom });
      }
      setEditMode('none');
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(type);
      const result = await uploadFileToSupabase(file, 'images');
      setIsUploading(null);
      if (result) {
        onChange({
          ...content,
          [type === 'cover' ? 'coverUrl' : 'logoUrl']: result.url,
          [type === 'cover' ? 'coverY' : 'logoY']: 50,
          [type === 'cover' ? 'coverZoom' : 'logoZoom']: 1,
          ...(type === 'logo' ? { logoX: 50 } : {})
        });
      }
    };

    const adjustZoom = (delta: number) => {
      setTempPos(p => ({ ...p, zoom: Math.max(1, Math.min(3, parseFloat((p.zoom + delta).toFixed(2)))) }));
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, isAxisYOnly: boolean) => {
      if (e.buttons !== 1) return;
      const target = e.currentTarget;
      const deltaX = (e.movementX / target.clientWidth) * 100;
      const deltaY = (e.movementY / target.clientHeight) * 100;

      setTempPos(p => ({
        ...p,
        x: isAxisYOnly ? 50 : Math.max(0, Math.min(100, p.x - deltaX / p.zoom)),
        y: Math.max(0, Math.min(100, p.y - deltaY / p.zoom))
      }));
    };

    const renderCover = () => {
      const isEditing = editMode === 'cover';
      const pos = isEditing ? tempPos : { x: 50, y: content.coverY ?? 50, zoom: content.coverZoom ?? 1 };

      return (
        <div className="w-full h-32 md:h-48 rounded-[2rem] bg-slate-100 overflow-hidden relative shadow-sm border border-slate-100/50 z-0 group/cover">
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFile(e, 'cover')} />
          {isUploading === 'cover' && <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm z-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-900" /></div>}

          {content.coverUrl ? (
             <div
               className={`w-full h-full relative ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
               onPointerDown={isEditing ? e => e.currentTarget.setPointerCapture(e.pointerId) : undefined}
               onPointerMove={isEditing ? e => handlePointerMove(e, true) : undefined}
             >
               <img src={content.coverUrl} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `50% ${pos.y}%`, transform: `scale(${pos.zoom})` }} alt="Copertina" />
               {isEditing && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}
             </div>
          ) : (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
               <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
               <span className="text-[10px] uppercase font-bold tracking-widest">Carica Copertina</span>
             </div>
          )}

          {!isEditing && (
            <div className="absolute top-3 right-3 flex items-center bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-xl shadow-sm gap-1 md:opacity-0 group-hover/cover:opacity-100 transition-opacity z-30">
               <button onClick={() => coverInputRef.current?.click()} className="text-[11px] font-bold text-slate-700 hover:text-black hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors">Cambia</button>
               {content.coverUrl && <button onClick={() => startReposition('cover')} className="text-[11px] font-bold text-slate-700 hover:text-black hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors">Riposiziona</button>}
               {content.coverUrl && <button onClick={() => onChange({...content, coverUrl: ''})} className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          )}

          {isEditing && (
            <>
              <div className="absolute top-4 left-0 w-full text-center pointer-events-none z-30">
                <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg tracking-wide">Trascina su e giù per riposizionare</span>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-xl gap-2 z-40">
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-2">
                    <button onClick={() => adjustZoom(-0.1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-black font-bold hover:scale-105 transition-transform">-</button>
                    <span className="text-[10px] font-black uppercase text-slate-400 w-8 text-center">Zoom</span>
                    <button onClick={() => adjustZoom(0.1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-black font-bold hover:scale-105 transition-transform">+</button>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <button onClick={() => setEditMode('none')} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">Annulla</button>
                  <button onClick={handleSave} className="text-[11px] font-bold text-white bg-slate-900 hover:bg-black px-4 py-1.5 rounded-xl shadow-md transition-colors">Salva</button>
              </div>
            </>
          )}
        </div>
      );
    };

    const renderLogo = () => {
      const isEditing = editMode === 'logo';
      const pos = isEditing ? tempPos : { x: content.logoX ?? 50, y: content.logoY ?? 50, zoom: content.logoZoom ?? 1 };

      return (
        <div className={`relative group/logo ${isEditing ? 'z-50' : 'z-20'}`}>
          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFile(e, 'logo')} />
          {isUploading === 'logo' && <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm z-50 rounded-3xl flex items-center justify-center border-[4px] border-white"><Loader2 className="w-6 h-6 animate-spin text-slate-900" /></div>}

          <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-white rounded-3xl shadow-lg border-[4px] border-white overflow-hidden relative">
            {content.logoUrl ? (
               <div
                 className={`w-full h-full relative ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
                 onPointerDown={isEditing ? e => e.currentTarget.setPointerCapture(e.pointerId) : undefined}
                 onPointerMove={isEditing ? e => handlePointerMove(e, false) : undefined}
               >
                 <img src={content.logoUrl} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `${pos.x}% ${pos.y}%`, transform: `scale(${pos.zoom})` }} alt="Logo" />
                 {isEditing && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}
               </div>
            ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => !isEditing && logoInputRef.current?.click()}>
                 <ImageIcon className="w-5 h-5 mb-1 opacity-40" />
                 <span className="text-[9px] uppercase font-bold tracking-widest">Carica</span>
               </div>
            )}
          </div>

          {!isEditing && (
            <div className="absolute top-full left-0 mt-2 md:top-0 md:left-auto md:-right-2 md:translate-x-full flex flex-row md:flex-col bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-xl shadow-md gap-1 md:opacity-0 group-hover/logo:opacity-100 transition-opacity z-30">
               <button onClick={() => logoInputRef.current?.click()} className="text-[10px] font-bold text-slate-700 hover:text-black hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors text-left whitespace-nowrap">Cambia Logo</button>
               {content.logoUrl && <button onClick={() => startReposition('logo')} className="text-[10px] font-bold text-slate-700 hover:text-black hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors text-left whitespace-nowrap">Riposiziona</button>}
               {content.logoUrl && <button onClick={() => onChange({...content, logoUrl: ''})} className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors text-left whitespace-nowrap">Rimuovi</button>}
            </div>
          )}

          {isEditing && (
            <div className="absolute top-full left-0 mt-2 md:top-1/2 md:left-auto md:-right-4 md:translate-x-full md:-translate-y-1/2 flex flex-col bg-white/95 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-2xl gap-2 z-40 min-w-[140px]">
               <div className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-wider pt-1">Zoom</div>
               <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-full justify-between">
                 <button onClick={() => adjustZoom(-0.1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-black font-bold">-</button>
                 <button onClick={() => adjustZoom(0.1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-black font-bold">+</button>
               </div>
               <div className="h-px w-full bg-slate-100 my-0.5" />
               <button onClick={handleSave} className="text-[11px] font-bold text-white bg-slate-900 hover:bg-black px-3 py-2 rounded-xl shadow-md transition-colors w-full">Salva</button>
               <button onClick={() => setEditMode('none')} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors w-full">Annulla</button>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="relative w-full group/heroblock pt-4 pb-0">
        {renderCover()}
        <div className={`px-2 md:px-8 relative -mt-10 md:-mt-12 flex flex-col items-start ${editMode === 'cover' ? 'opacity-30 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
          {renderLogo()}
          <div className="mt-4 w-full space-y-1 pointer-events-auto">
            <EditableField tag="span" value={content.eyebrow} placeholder="Es. Ente del Terzo Settore" onChange={(n: string) => onChange({...content, eyebrow: n})} className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-slate-400" />
            <EditableField tag="h1" value={content.title} placeholder="Titolo Associazione" onChange={(n: string) => onChange({...content, title: n})} className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900" />
            <EditableField tag="p" value={content.subtitle} placeholder="Il vostro motto o sottotitolo breve..." multiline onChange={(n: string) => onChange({...content, subtitle: n})} className="text-base md:text-lg text-slate-600 font-light max-w-2xl leading-relaxed whitespace-pre-wrap" />
          </div>
        </div>
      </div>
    );
  },

  about: ({ content, onChange }: any) => (
    <section>
      <EditableField tag="h3" value={content.title || 'In evidenza'} placeholder="Titolo sezione..." onChange={(n: string) => onChange({...content, title: n})} className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-4" />
      <EditableField tag="p" value={content.body} placeholder="Scrivi del testo libero, racconti o dettagli aggiuntivi..." multiline onChange={(n: string) => onChange({...content, body: n})} className="text-lg text-slate-600 font-light leading-relaxed whitespace-pre-wrap" />
    </section>
  ),

  stats: ({ content, onChange }: any) => {
    const items = content.items || [{ value: '100+', label: 'Volontari Attivi' }]
    return (
      <section className="space-y-4 w-full">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Numeri e Statistiche</h3>
          {items.length < 3 && (
            <button onClick={() => onChange({...content, items: [...items, { value: '0', label: 'Nuova statistica' }]})} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-100">
              <Plus className="w-3.5 h-3.5" /> Aggiungi numero
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 py-4 border-y border-slate-50 w-full text-center">
          {items.map((stat: any, i: number) => (
            <div key={i} className="min-w-[120px] flex flex-col items-center group/stat relative">
              <EditableField disableWFull tag="div" value={stat.value} placeholder="0" inputClassName="max-w-[130px] text-center !text-4xl md:!text-7xl font-extrabold tracking-tighter" onChange={(n: string) => { const newItems = [...items]; newItems[i].value = n; onChange({...content, items: newItems}) }} className="text-4xl md:text-7xl font-extrabold tracking-tighter text-slate-900 mb-1 leading-none" />
              <EditableField disableWFull tag="div" value={stat.label} placeholder="Etichetta" inputClassName="max-w-[150px] text-center text-xs" onChange={(n: string) => { const newItems = [...items]; newItems[i].label = n; onChange({...content, items: newItems}) }} className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 px-4" />
              
              {items.length > 1 && (
                <button onClick={() => onChange({...content, items: items.filter((_: any, idx: number) => idx !== i)})} className="absolute -top-3 -right-2 p-1.5 bg-white text-slate-300 hover:text-red-500 border border-slate-100 rounded-full shadow-sm md:opacity-0 group-hover/stat:opacity-100 transition-opacity" title="Rimuovi"><Trash2 className="w-3 h-3" /></button>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  },

  gallery: ({ content, onChange }: any) => {
    const rawImages = content.items || []
    const images = rawImages.filter(Boolean)

    const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const result = await uploadFileToSupabase(file, 'images')
      if (result) {
        onChange({ ...content, items: [...images, result.url] })
      }
    }

    const getGridLayout = () => {
      const count = images.length
      if (count === 1) return 'grid-cols-1'
      if (count === 2) return 'grid-cols-2 gap-2 md:gap-4'
      if (count === 3) return 'grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'
      if (count === 4) return 'grid-cols-2 gap-2 md:gap-4'
      return 'grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 auto-rows-[120px] md:auto-rows-[160px]'
    }

    const getImageStyle = (index: number) => {
      const count = images.length
      if (count === 1) return 'w-full h-52 md:h-80 rounded-[2rem]'
      if (count === 2 || count === 3) return 'w-full aspect-[4/3] rounded-2xl md:rounded-[1.75rem]'
      if (count === 4) return 'w-full aspect-video rounded-2xl'
      if (index === 0) return 'col-span-2 row-span-2 rounded-[2rem]'
      return 'col-span-1 row-span-1 rounded-2xl md:rounded-3xl'
    }

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Galleria Foto</h3>
          {images.length < 6 && (
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-100">
              <Plus className="w-3.5 h-3.5" /> Aggiungi foto
              <input type="file" className="hidden" accept="image/*" onChange={handleAddPhoto} />
            </label>
          )}
        </div>

        {images.length > 0 ? (
          <div className={`grid ${getGridLayout()}`}>
            {images.map((img: string, i: number) => (
              <EditableImage 
                key={i} 
                value={img} 
                onChange={(url: string) => {
                  const newImg = [...images]
                  if (url) {
                    newImg[i] = url
                  } else {
                    newImg.splice(i, 1)
                  }
                  onChange({ ...content, items: newImg })
                }} 
                className={`${getImageStyle(i)} shadow-sm`} 
              />
            ))}
          </div>
        ) : (
          <div className="p-8 md:p-12 border-2 border-slate-100 border-dashed rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-center">
            <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">Nessuna foto inserita. Clicca su aggiungi in alto a destra.</p>
          </div>
        )}
      </section>
    )
  },

  mission: ({ content, onChange }: any) => (
    <section>
      <EditableField tag="h3" value={content.title || 'La nostra Mission'} placeholder="Mission" onChange={(n: string) => onChange({...content, title: n})} className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-3" />
      <EditableField tag="p" value={content.body} placeholder="Descrivi il motivo per cui esistete e l’impatto che volete generare..." multiline onChange={(n: string) => onChange({...content, body: n})} className="text-base md:text-lg text-slate-600 leading-relaxed font-light whitespace-pre-wrap" />
    </section>
  ),

  vision: ({ content, onChange }: any) => (
    <section>
      <EditableField tag="h3" value={content.title || 'La nostra Vision'} placeholder="Vision" onChange={(n: string) => onChange({...content, title: n})} className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-3" />
      <EditableField tag="p" value={content.body} placeholder="Racconta la direzione futura che volete costruire insieme alla comunità..." multiline onChange={(n: string) => onChange({...content, body: n})} className="text-base md:text-lg text-slate-600 leading-relaxed font-light whitespace-pre-wrap" />
    </section>
  ),

  donations: ({ content, onChange }: any) => {
    const handleCopy = (text: string) => { if (text) { navigator.clipboard.writeText(text); alert('Copiato negli appunti!'); } }
    return (
      <section className="bg-gradient-to-br from-rose-50/50 to-white p-5 md:p-8 rounded-[2.5rem] border border-rose-100/60">
        <EditableField tag="h3" value={content.title || 'Sostieni la nostra causa'} placeholder="Titolo" onChange={(n: string) => onChange({...content, title: n})} className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-2" />
        <EditableField tag="p" value={content.description || 'Ogni piccolo contributo si trasforma in un impatto tangibile per la nostra comunità locale.'} placeholder="Descrizione" multiline onChange={(n: string) => onChange({...content, description: n})} className="text-slate-600 font-light mb-6 max-w-2xl text-base whitespace-pre-wrap" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Donazione Bancaria</span>
              <EditableField tag="p" value={content.ibanLabel || 'IBAN Intesa Sanpaolo'} placeholder="Nome Banca" onChange={(n: string) => onChange({...content, ibanLabel: n})} className="font-bold text-slate-900 text-sm mt-1" />
              <EditableField tag="p" value={content.iban || 'IT00 X000 0000 0000 0000 0000 000'} placeholder="Inserisci IBAN" onChange={(n: string) => onChange({...content, iban: n})} className="text-xs font-mono text-slate-500 tracking-tight select-all mt-1" />
            </div>
            <button onClick={() => handleCopy(content.iban)} className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all">Copia IBAN</button>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Dona il 5x1000</span>
              <p className="font-bold text-slate-900 text-sm mt-1">Codice Fiscale Associazione</p>
              <EditableField tag="p" value={content.cf || '00000000000'} placeholder="Inserisci CF" onChange={(n: string) => onChange({...content, cf: n})} className="text-lg font-mono font-black text-slate-800 mt-1 select-all" />
            </div>
            <button onClick={() => handleCopy(content.cf)} className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all">Copia Codice Fiscale</button>
          </div>
        </div>
      </section>
    )
  },

  projects: ({ content, onChange }: any) => {
    const items = content.items || [
      { title: 'Progetto Natura Pulita', desc: 'Riqualificazione delle aree boschive locali.', img: '' },
      { title: 'Inclusione Digitale', desc: 'Corsi di tecnologia per la terza età.', img: '' }
    ]
    return (
      <section>
        <EditableField tag="h3" value={content.title || 'I nostri progetti d’impatto'} placeholder="Titolo" onChange={(n: string) => onChange({...content, title: n})} className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((proj: any, i: number) => (
            <div key={i} className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              <EditableImage value={proj.img} onChange={(url: string) => { const newItems = [...items]; newItems[i].img = url; onChange({...content, items: newItems}) }} className="w-full h-44 shrink-0" aspect="auto" />
              <div className="p-5 flex-1 flex flex-col justify-between gap-2">
                <div className="space-y-1">
                  <EditableField tag="h4" value={proj.title} placeholder="Titolo Progetto" onChange={(n: string) => { const newItems = [...items]; newItems[i].title = n; onChange({...content, items: newItems}) }} className="font-bold text-slate-900 text-lg leading-snug" />
                  <EditableField tag="p" value={proj.desc} placeholder="Descrizione progetto..." multiline onChange={(n: string) => { const newItems = [...items]; newItems[i].desc = n; onChange({...content, items: newItems}) }} className="text-sm text-slate-500 font-light leading-relaxed whitespace-pre-wrap" />
                </div>
                {items.length > 1 && (
                  <button onClick={() => { onChange({...content, items: items.filter((_: any, idx: number) => idx !== i)}) }} className="text-xs text-red-400 hover:text-red-500 self-end mt-2 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Rimuovi progetto</button>
                )}
              </div>
            </div>
          ))}
          <button onClick={() => onChange({...content, items: [...items, { title: 'Nuovo Progetto', desc: 'Breve descrizione.', img: '' }]})} className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-all min-h-[180px]">
            <Plus className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-bold">Aggiungi un Progetto</span>
          </button>
        </div>
      </section>
    )
  },

  testimonials: ({ content, onChange }: any) => {
    const items = content.items || [{ quote: 'Fare volontariato qui ha completamente cambiato la mia prospettiva di comunità.', author: 'Marco, 24 anni', role: 'Volontario dal 2024', avatarUrl: '' }]
    return (
      <section className="px-1 md:px-2">
        <EditableField tag="h3" value={content.title || 'La voce di chi vive l’associazione'} placeholder="Titolo" onChange={(n: string) => onChange({...content, title: n})} className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6" />
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {items.map((test: any, i: number) => (
            <div key={i} className="snap-start shrink-0 w-[92%] md:w-[65%] bg-slate-50 p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between border border-slate-100/50 min-h-[220px]">
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-slate-300 transform rotate-180" />
                <EditableField tag="p" value={test.quote} placeholder="Inserisci la citazione..." multiline onChange={(n: string) => { const newItems = [...items]; newItems[i].quote = n; onChange({...content, items: newItems}) }} className="text-base md:text-xl font-light text-slate-800 leading-relaxed italic whitespace-pre-wrap" />
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <EditableImage value={test.avatarUrl} onChange={(url: string) => { const newItems = [...items]; newItems[i].avatarUrl = url; onChange({...content, items: newItems}) }} className="w-11 h-11 rounded-full border border-white shadow-md shrink-0" />
                  <div>
                    <EditableField tag="p" value={test.author} placeholder="Nome Volontario" onChange={(n: string) => { const newItems = [...items]; newItems[i].author = n; onChange({...content, items: newItems}) }} className="font-bold text-slate-900 text-sm leading-none" />
                    <EditableField tag="p" value={test.role} placeholder="Ruolo o anno..." onChange={(n: string) => { const newItems = [...items]; newItems[i].role = n; onChange({...content, items: newItems}) }} className="text-xs text-slate-400 font-medium mt-1" />
                  </div>
                </div>
                {items.length > 1 && (
                  <button onClick={() => { onChange({...content, items: items.filter((_: any, idx: number) => idx !== i)}) }} className="p-2 text-slate-300 hover:text-red-500 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))}
          <button onClick={() => onChange({...content, items: [...items, { quote: 'La mia testimonianza.', author: 'Nome Volontario', role: 'Ruolo', avatarUrl: '' }]})} className="snap-start shrink-0 w-[50%] md:w-[25%] border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">Aggiungi</span>
          </button>
        </div>
      </section>
    )
  },

  video: ({ content, onChange }: any) => {
    const getEmbedUrl = (url: string) => {
      if (!url) return ''
      if (url.includes('youtube.com/embed/')) return url
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
      const match = url.match(regExp)
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url
    }
    const embedUrl = getEmbedUrl(content.url)
    return (
      <section className="space-y-4">
        <EditableField tag="h3" value={content.title || 'Guarda la nostra storia in azione'} placeholder="Titolo video" onChange={(n: string) => onChange({...content, title: n})} className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900" />
        <div className="w-full aspect-video rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-md relative group/video">
          {embedUrl ? (
            <iframe src={embedUrl} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Video className="w-12 h-12 mb-2 opacity-40" />
              <p className="text-sm font-bold">Nessun video collegato</p>
            </div>
          )}
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 pl-2">Link YouTube:</span>
          <input type="text" value={content.url || ''} onChange={(e) => onChange({...content, url: e.target.value})} placeholder="Incolla l’URL del video (es. https://www.youtube.com/watch?v=...)" className="w-full text-base md:text-sm bg-white border border-slate-200 outline-none p-2 rounded-xl text-slate-700" />
        </div>
      </section>
    )
  },

  faq: ({ content, onChange }: any) => {
    const rawItems = Array.isArray(content.items) ? content.items : []
    const items = rawItems.length > 0 ? rawItems : [{ q: '', a: '' }]

    const handleAddItem = () => {
      onChange({ ...content, items: [...items, { q: '', a: '' }] })
    }

    const handleRemoveItem = (index: number) => {
      if (items.length <= 1) return
      const newItems = items.filter((_: any, idx: number) => idx !== index)
      onChange({ ...content, items: newItems })
    }

    const handleUpdateItem = (index: number, key: 'q' | 'a', value: string) => {
      const newItems = [...items]
      newItems[index] = { ...newItems[index], [key]: value }
      onChange({ ...content, items: newItems })
    }

    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl md:text-3xl font-extrabold tracking-tight text-slate-900">Domande frequenti</h3>
          <button 
            type="button"
            onClick={handleAddItem} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-100"
          >
            <Plus className="w-3.5 h-3.5" /> Domanda
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <div key={i} className="group/faq relative border-b border-slate-100 pb-4 last:border-0 last:pb-0 pr-8">
              <EditableField 
                tag="h4" 
                value={item.q} 
                placeholder={`Domanda ${i + 1}...`} 
                onChange={(val: string) => handleUpdateItem(i, 'q', val)} 
                className="text-base md:text-lg font-bold text-slate-900 mb-1" 
              />
              <EditableField 
                tag="p" 
                value={item.a} 
                placeholder="Inserisci la risposta..." 
                multiline 
                onChange={(val: string) => handleUpdateItem(i, 'a', val)} 
                className="text-sm md:text-base text-slate-600 font-light leading-relaxed whitespace-pre-wrap" 
              />
              {items.length > 1 && (
                <button 
                  type="button"
                  onClick={() => handleRemoveItem(i)} 
                  className="absolute right-0 top-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all md:opacity-0 group-hover/faq:opacity-100" 
                  title="Elimina domanda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  },

  documents: ({ content, onChange }: any) => {
    const items = content.items || [{ nome: '', url: '' }, { nome: '', url: '' }, { nome: '', url: '' }]
    return (
      <section className="bg-slate-50 p-5 md:p-8 rounded-[2rem] border border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Documenti Utili</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((doc: any, i: number) => (
            <EditableDocumentItem 
              key={i} 
              doc={doc} 
              onFileUploaded={(res) => {
                const newItems = [...items]
                newItems[i] = res
                onChange({...content, items: newItems})
              }}
              onRemove={() => {
                const newItems = [...items]
                newItems[i] = { nome: '', url: '' }
                onChange({...content, items: newItems})
              }}
              onNameChange={(n: string) => {
                const newItems = [...items]
                newItems[i].nome = n
                onChange({...content, items: newItems})
              }}
            />
          ))}
        </div>
      </section>
    )
  },

  links: ({ content, onChange }: any) => (
    <div className="bg-white py-2">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Link Utili</h3>
      <div className="flex flex-col md:flex-row flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-200 p-2 rounded-xl transition-all">
          <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Sito:</span>
          <EditableField tag="span" value={content.website} placeholder="https://..." onChange={(n: string) => onChange({...content, website: n})} className="text-xs font-semibold text-slate-900" />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-200 p-2 rounded-xl transition-all">
          <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">IG:</span>
          <EditableField tag="span" value={content.instagram} placeholder="@username" onChange={(n: string) => onChange({...content, instagram: n})} className="text-xs font-semibold text-slate-900" />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-200 p-2 rounded-xl transition-all">
          <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">FB:</span>
          <EditableField tag="span" value={content.facebook} placeholder="/pagina" onChange={(n: string) => onChange({...content, facebook: n})} className="text-xs font-semibold text-slate-900" />
        </div>
      </div>
    </div>
  ),

  contacts: ({ content, onChange }: any) => (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-slate-50 p-5 md:p-8 rounded-[2.5rem] border border-slate-100">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Mettiti in contatto</span>
          <EditableField tag="h3" value={content.title || 'Vieni a trovarci o scrivici'} placeholder="Titolo contatti" onChange={(n: string) => onChange({...content, title: n})} className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900" />
        </div>
        <div className="space-y-2 text-sm text-slate-600 font-light leading-relaxed">
          <div className="flex gap-2"><strong>Sede:</strong><EditableField tag="span" value={content.address || 'Via Roma 12, Milano'} placeholder="Indirizzo" onChange={(n: string) => onChange({...content, address: n})} className="font-normal text-slate-800" /></div>
          <div className="flex gap-2"><strong>Email:</strong><EditableField tag="span" value={content.email || 'info@associazione.it'} placeholder="Email" onChange={(n: string) => onChange({...content, email: n})} className="font-normal text-slate-800" /></div>
          <div className="flex gap-2"><strong>Tel:</strong><EditableField tag="span" value={content.phone || '+39 02 123456'} placeholder="Telefono" onChange={(n: string) => onChange({...content, phone: n})} className="font-normal text-slate-800" /></div>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-2xl border border-slate-100/80 space-y-3 pointer-events-none opacity-85">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invia un messaggio rapido</p>
        <div className="h-9 w-full bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-300 flex items-center px-3">La tua email...</div>
        <div className="h-16 w-full bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-300 flex items-start px-3 py-2">Come possiamo aiutarti?</div>
        <div className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold text-center">Invia Messaggio</div>
      </div>
    </section>
  ),

  partners: ({ content, onChange }: any) => {
    const items = content.items || ['Partner Esempio']
    return (
      <section className="space-y-4 text-center py-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partner e Sponsor</h3>
          <button onClick={() => onChange({...content, items: [...items, '']})} className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
            <Plus className="w-3 h-3" /> Aggiungi Partner
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 md:gap-x-10 md:gap-y-6 opacity-75 grayscale items-center pt-2">
          {items.map((partner: string, i: number) => (
             <div key={i} className="flex items-center gap-2 group/partner bg-slate-50/50 hover:bg-slate-50 px-4 py-2 rounded-2xl transition-all border border-transparent hover:border-slate-100 relative">
               <EditableField disableWFull tag="span" value={partner} placeholder="Nome Partner..." onChange={(n: string) => { const newItems = [...items]; newItems[i] = n; onChange({...content, items: newItems}) }} className="font-bold text-sm md:text-base text-slate-800" />
               {items.length > 1 && (
                 <button onClick={() => onChange({...content, items: items.filter((_: any, idx: number) => idx !== i)})} className="p-1 text-slate-300 hover:text-red-500 rounded-full transition-colors md:opacity-0 group-hover/partner:opacity-100" title="Elimina"><Trash2 className="w-3.5 h-3.5" /></button>
               )}
             </div>
          ))}
        </div>
      </section>
    )
  },

  positions: ({ positions, brandColor }: any) => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Posizioni aperte</h3>
        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-sm md:text-base">{positions?.length || 0}</span>
      </div>
      {positions?.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {positions.map((p: any) => (
            <div key={p.id} className="snap-start shrink-0 w-[88%] md:w-[45%]">
              <PosizioneCard posizione={p} ruolo="volontario" coloreBrand={brandColor} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 md:p-8 border-2 border-slate-100 border-dashed rounded-3xl bg-white text-center">
          <p className="text-slate-400 font-medium text-sm md:text-base">Le tue posizioni aperte appariranno qui automaticamente.</p>
        </div>
      )}
    </div>
  ),

  generic: ({ type }: any) => (
    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center text-slate-400">
      <span className="capitalize font-bold">{type}</span> - Configurazione disponibile a breve.
    </div>
  )
}

// ==========================================
// 5. PAGINA PRINCIPALE CON SENSORI TOUCH & AUTO-SCROLL
// ==========================================
export default function PersonalizzaPagina() {
  const router = useRouter()
  const [layout, setLayout] = useState<LayoutBlock[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [associazioneSlug, setAssociazioneSlug] = useState<string | null>(null)

  // SENSORE TOUCH CALIBRATO
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }
    })
  )

  const brandColor = (layout.find(b => b.type === 'hero')?.content as HeroContent)?.brandColor || DEFAULT_BRAND

  // Caricamento Iniziale
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/auth/login')

      const [{ data: assoc }, { data: graph }, { data: pos }] = await Promise.all([
        supabase.from('associazioni').select('*').eq('id', user.id).single(),
        supabase.from('associazioni_grafica').select('*').eq('associazione_id', user.id).single(),
        supabase.from('posizioni').select('*, media_associazioni(url), tags:posizione_tags(tag:tags(id, name))').eq('associazione_id', user.id)
      ])

      if (assoc?.slug) {
        setAssociazioneSlug(assoc.slug)
      }

      const rawDraft = graph?.layout_draft
      const rawConfig = graph?.layout_config
      
      let parsedLayout = null
      if (rawDraft) {
        parsedLayout = typeof rawDraft === 'string' ? JSON.parse(rawDraft) : rawDraft
      } else if (rawConfig) {
        parsedLayout = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig
      }
      
      let initialLayout = parsedLayout && Array.isArray(parsedLayout) && parsedLayout.length > 0 ? parsedLayout : null
      
      if (initialLayout) {
        initialLayout = initialLayout.flatMap((block: any) => {
          if (block.type === 'missionVision') {
            return [
              { id: uid(), type: 'mission', content: { title: block.content.missionTitle || 'Mission', body: block.content.mission || '' } },
              { id: uid(), type: 'vision', content: { title: block.content.visionTitle || 'Vision', body: block.content.vision || '' } }
            ]
          }
          return block
        })
      } else {
        initialLayout = [
          { id: uid(), type: 'hero', content: { title: assoc?.denominazione || 'Associazione', coverUrl: graph?.cover_url, logoUrl: assoc?.logo_url, brandColor: graph?.colore_brand || DEFAULT_BRAND } },
          { id: uid(), type: 'about', content: { title: 'Chi Siamo', body: graph?.chi_siamo || '' } }
        ]
      }

      setLayout(initialLayout)
      setPositions(pos || [])
      setIsLoading(false)
    }
    loadData()
  }, [router])

  // AUTO-SAVE BOZZA
  useEffect(() => {
    if (isLoading || layout.length === 0) return

    setAutoSaveStatus('saving')
    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('associazioni_grafica').upsert({
        associazione_id: user.id,
        layout_draft: layout,
        updated_at: new Date().toISOString()
      }, { onConflict: 'associazione_id' })

      if (!error) setAutoSaveStatus('saved')
    }, 2000)

    return () => clearTimeout(timer)
  }, [layout, isLoading])

  const handlePublish = async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const hero = layout.find(b => b.type === 'hero')?.content
    
    const { error } = await supabase.from('associazioni_grafica').upsert({
      associazione_id: user?.id,
      layout_config: layout,
      layout_draft: layout,
      colore_brand: hero?.brandColor || DEFAULT_BRAND,
      cover_url: hero?.coverUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'associazione_id' })
    
    if (!error && associazioneSlug) {
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: `/associazione/${associazioneSlug}` })
        })
      } catch (err) {
        console.error("Errore durante la revalidation on-demand:", err)
      }
    }
    
    setIsSaving(false)
    const btn = document.getElementById('publish-btn')
    if(btn) { btn.innerText = 'Vetrina Pubblicata!'; setTimeout(() => btn.innerText = 'Pubblica', 2500) }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLayout((current) => {
      const oldIndex = current.findIndex(b => b.id === active.id)
      const newIndex = current.findIndex(b => b.id === over.id)
      if (current[oldIndex]?.type === 'hero' || current[newIndex]?.type === 'hero') return current 
      return arrayMove(current, oldIndex, newIndex)
    })
  }

  // 🟢 SPOSTAMENTO ESPLICITO A FRECCE CON AUTO-SCROLL FLUIDO
  const moveBlockUp = (index: number) => {
    if (index <= 1) return
    const targetBlockId = layout[index].id
    setLayout(current => arrayMove(current, index, index - 1))
    
    setTimeout(() => {
      const element = document.getElementById(`block-${targetBlockId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const moveBlockDown = (index: number) => {
    if (index >= layout.length - 1) return
    const targetBlockId = layout[index].id
    setLayout(current => arrayMove(current, index, index + 1))

    setTimeout(() => {
      const element = document.getElementById(`block-${targetBlockId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const usedBlockTypes = layout.map(b => b.type)
  const availableBlocks = blockLibrary.filter(b => {
    if (b.type === 'hero') return false
    if (b.isUnique && usedBlockTypes.includes(b.type as any)) return false
    return true
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-sans text-slate-500 font-medium">Caricamento Vetrina...</div>

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-32">
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* NAVBAR SUPERIORE */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-[860px] mx-auto flex items-center justify-between p-3 md:p-4 px-4 md:px-0">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/app/associazione" className="text-xs md:text-sm font-bold text-slate-400 hover:text-black transition-colors flex items-center gap-1 md:gap-2">
               <span className="text-base md:text-lg leading-none mb-0.5">←</span> Torna indietro
            </Link>
            <span className="text-[10px] md:text-xs font-medium text-slate-400 border-l border-slate-200 pl-2 md:pl-4 truncate max-w-[120px] md:max-w-none">
              {autoSaveStatus === 'saving' && 'Salvataggio...'}
              {autoSaveStatus === 'saved' && 'Bozza salvata'}
              {autoSaveStatus === 'idle' && 'Bozza ok'}
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Editor Vetrina</span>
            <button id="publish-btn" onClick={handlePublish} disabled={isSaving} className="bg-slate-900 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold shadow-lg hover:bg-black transition-all active:scale-95">
              {isSaving ? 'Pubblicazione...' : 'Pubblica'}
            </button>
          </div>
        </div>
      </div>

      {/* CANVAS */}
      <main className="max-w-[860px] mx-auto pt-4 md:pt-8 px-3 md:px-0">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext items={layout.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4 md:gap-8">
              {layout.map((block, index) => {
                const BlockComponent = Blocks[block.type as keyof typeof Blocks] || Blocks.generic
                return (
                  <SortableBlockShell 
                    key={block.id} 
                    block={block} 
                    locked={block.type === 'hero'} 
                    isFirst={index === 1}
                    isLast={index === layout.length - 1}
                    onMoveUp={() => moveBlockUp(index)}
                    onMoveDown={() => moveBlockDown(index)}
                    onRemove={(id: string) => setLayout(l => l.filter(b => b.id !== id))}
                  >
                    <BlockComponent 
                      type={block.type} 
                      content={block.content} 
                      positions={positions} 
                      brandColor={brandColor} 
                      onChange={(next: any) => setLayout(l => l.map(b => b.id === block.id ? { ...b, content: next } : b))} 
                    />
                  </SortableBlockShell>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* MENU AGGIUNTA BLOCCHI */}
        {availableBlocks.length > 0 && (
          <div className="w-full mt-8 md:mt-10 relative pb-20">
            {!showAddMenu ? (
              <button onClick={() => setShowAddMenu(true)} className="w-full py-5 md:py-6 flex items-center justify-center gap-2 md:gap-3 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all">
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
                <span className="font-bold text-base md:text-lg">Aggiungi sezione</span>
              </button>
            ) : (
              <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-5 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-200">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h3 className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight">Aggiungi alla Vetrina</h3>
                  <button onClick={() => setShowAddMenu(false)} className="text-slate-400 hover:text-black bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors">✕</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {availableBlocks.map(item => {
                    const Icon = item.icon
                    return (
                      <button key={item.type} onClick={() => { 
                        const initialContent = item.type === 'faq' ? { items: [{ q: '', a: '' }] } : {}
                        const newId = uid()
                        setLayout([...layout, { id: newId, type: item.type as BlockType, content: initialContent }]); 
                        setShowAddMenu(false) 
                        setTimeout(() => {
                          document.getElementById(`block-${newId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }, 100)
                      }}
                        className="flex flex-col items-start gap-3 p-4 md:p-5 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all text-left group border border-transparent hover:border-slate-800 hover:shadow-xl"
                      >
                        <div className="bg-white shadow-sm border border-slate-100 p-2.5 rounded-xl group-hover:bg-slate-800 group-hover:border-slate-700 transition-colors">
                          <Icon className="w-5 h-5 text-slate-600 group-hover:text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 group-hover:text-white">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 group-hover:text-slate-400">{item.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}