import Image from 'next/image'
import { User } from 'lucide-react'

type Props = {
  profile: {
    avatar_url?: string | null
    full_name?: string | null
    // XP stats zijn niet meer nodig, maar we laten de types optioneel staan
    // voor als andere componenten ze nog meesturen
    xp_points?: number
    events_created?: number
    messages_count?: number
  } | null
  size?: 'sm' | 'md' | 'lg' | 'xl' // Verschillende formaten
}

export default function GamifiedAvatar({ profile, size = 'md' }: Props) {
  // Bepaal afmetingen op basis van size prop
  // De extra dikke borders zijn weggehaald
  const sizeClasses = {
    sm: 'w-8 h-8',      // Klein (voor lijstjes)
    md: 'w-12 h-12',    // Middel (standaard)
    lg: 'w-20 h-20',    // Groot
    xl: 'w-[140px] h-[140px]' // Extra groot (profiel pagina)
  }

  const currentSize = sizeClasses[size]

  return (
    <div className="relative inline-block">
      {/* De schone Avatar Cirkel met een subtiel randje */}
      <div className={`relative rounded-full ${currentSize} overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10 shadow-sm`}>
        {profile?.avatar_url ? (
          <Image 
            src={profile.avatar_url} 
            alt={profile.full_name || 'Avatar'} 
            fill
            className="object-cover"
          />
        ) : (
          <User className="text-slate-500 w-1/2 h-1/2" />
        )}
      </div>
    </div>
  )
}