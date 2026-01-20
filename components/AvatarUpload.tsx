'use client'

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { updateAvatar } from '@/app/actions' 

interface AvatarUploadProps {
  avatarUrl: string | null
  fallback: string | null
}

export default function AvatarUpload({ avatarUrl, fallback }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files?.length) {
         setUploading(true)
         // Dien het formulier direct in zodra er een bestand is gekozen
         e.target.form?.requestSubmit()
     }
  }

  return (
    <div className="flex flex-col items-center mb-8">
        <div className="relative group w-32 h-32">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-800 bg-slate-800 shadow-2xl relative">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-600 bg-slate-900">
                        {fallback}
                    </div>
                )}
                
                {/* Overlay met upload icoon (of laad-spinner) */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    {uploading ? (
                        <Loader2 className="animate-spin text-white" /> 
                    ) : (
                        <Camera className="text-white opacity-80" />
                    )}
                </div>
            </div>

            {/* Verborgen formulier */}
            <form action={updateAvatar} className="absolute inset-0 opacity-0 cursor-pointer">
                <input 
                    type="file" 
                    name="avatar" 
                    accept="image/*"
                    className="w-full h-full cursor-pointer"
                    onChange={handleChange} 
                    disabled={uploading}
                />
            </form>
        </div>
        <p className="text-xs text-slate-500 mt-3">Klik op de foto om te wijzigen</p>
    </div>
  )
}