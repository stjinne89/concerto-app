'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Camera, Loader2 } from 'lucide-react'

// Hier definiëren we expliciet dat 'uid' een verplicht veld is
interface Props {
  uid: string
  url: string | null
  size: number
  onUpload?: (url: string) => void
}

export default function AvatarUpload({ uid, url, size, onUpload }: Props) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (url) setAvatarUrl(url)
  }, [url])

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Selecteer een afbeelding om te uploaden.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      // 1. Upload naar Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 2. Haal de publieke URL op
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update het profiel in de database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', uid)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      if (onUpload) onUpload(publicUrl)

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error bij uploaden avatar!')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group flex items-center justify-center">
      <div 
        className="rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 relative"
        style={{ height: size, width: size }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
             <Camera size={size * 0.3} />
          </div>
        )}
        
        {/* Overlay tijdens uploaden of hover */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
             {uploading ? (
                 <Loader2 className="text-white animate-spin" />
             ) : (
                 <Camera className="text-white opacity-80" />
             )}
        </div>
      </div>
      
      <input
        type="file"
        id="single"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  )
}