'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Camera, Upload, Loader2, X, Check, Trash2, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import Cropper from 'react-easy-crop' // <--- De magie
import { getCroppedImg } from '@/utils/canvasUtils' // <--- Onze helper

export default function AvatarUpload({ uid, url, size }: { uid: string, url: string | null, size: number }) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)
  
  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Bestand selecteren
  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '')
        setIsEditorOpen(true) // Open de editor
        setZoom(1)
      })
      reader.readAsDataURL(file)
    }
  }

  // 2. Crop positie opslaan bij elke beweging
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  // 3. De daadwerkelijke upload (na klikken op 'Opslaan')
  const uploadAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    try {
      setUploading(true)
      
      // Maak de crop
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (!croppedBlob) throw new Error('Kon afbeelding niet bijsnijden')

      // Upload naar Supabase
      const fileExt = 'jpg' // We converteren alles naar jpg in de helper
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob)

      if (uploadError) throw uploadError

      // Update Profiel Tabel
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', uid)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setIsEditorOpen(false) // Sluit editor
      setImageSrc(null)

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Uploaden mislukt!')
    } finally {
      setUploading(false)
    }
  }

  // 4. Verwijder foto
  const deleteAvatar = async () => {
      if(!confirm("Weet je zeker dat je je profielfoto wilt verwijderen?")) return;
      
      setUploading(true)
      try {
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', uid)
            
        if (error) throw error
        setAvatarUrl(null)
      } catch (error) {
          console.error(error)
      } finally {
          setUploading(false)
      }
  }

  return (
    <div className="relative group">
      
      {/* DE AVATAR ZELF */}
      <div 
        style={{ width: size, height: size }} 
        className="relative rounded-full overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-2xl"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            className="object-cover"
            priority // Belangrijk voor LCP (Largest Contentful Paint)
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-slate-800 text-slate-600">
             <Camera size={size / 3} />
          </div>
        )}

        {/* Loading Overlay */}
        {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        )}

        {/* Hover Overlay met Acties */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:scale-110 border border-white/20"
                title="Foto wijzigen"
            >
                <Upload size={20} />
            </button>
            
            {avatarUrl && (
                <button 
                    onClick={deleteAvatar}
                    className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-200 transition-all transform hover:scale-110 border border-red-500/30"
                    title="Foto verwijderen"
                >
                    <Trash2 size={20} />
                </button>
            )}
        </div>
      </div>

      {/* Verborgen Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="single"
        accept="image/*"
        onChange={onSelectFile}
        disabled={uploading}
        className="hidden"
      />

      {/* --- DE EDITOR MODAL --- */}
      {isEditorOpen && imageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl mx-4">
                
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Foto bijsnijden</h3>
                    <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative w-full h-80 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} // 1:1 ratio voor ronde avatars
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="round" // Laat een rondje zien ipv vierkant
                        showGrid={false}
                    />
                </div>

                {/* Controls */}
                <div className="p-6 space-y-6">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-4">
                        <ZoomIn size={20} className="text-slate-400" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsEditorOpen(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                        >
                            Annuleren
                        </button>
                        <button 
                            onClick={uploadAvatar}
                            disabled={uploading}
                            className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Opslaan</>}
                        </button>
                    </div>
                </div>

             </div>
          </div>
      )}
    </div>
  )
}