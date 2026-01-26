import Image from 'next/image'
import { getRank } from '@/utils/gamification'
import { User } from 'lucide-react'

type Props = {
  profile: {
    avatar_url?: string | null
    full_name?: string | null
    xp_points?: number
    events_created?: number
    messages_count?: number
  } | null
  size?: 'sm' | 'md' | 'lg' | 'xl' // Verschillende formaten
  showCrown?: boolean // Optie om kroontje te verbergen in kleine lijstjes
}

export default function GamifiedAvatar({ profile, size = 'md', showCrown = true }: Props) {
  // 1. Bereken de rank
  // Als er geen stats zijn (bijv. oude query), behandelen we het als 0 (Tourist)
  const rank = getRank({
    xp_points: profile?.xp_points || 0,
    events_created: profile?.events_created || 0,
    messages_count: profile?.messages_count || 0
  })

  // 2. Bepaal afmetingen op basis van size prop
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',      // Klein (voor lijstjes)
    md: 'w-12 h-12 border-[3px]', // Middel (standaard)
    lg: 'w-20 h-20 border-4',    // Groot
    xl: 'w-[140px] h-[140px] border-4' // Extra groot (profiel pagina)
  }

  const iconSizes = {
    sm: 'text-[10px] -top-2',
    md: 'text-sm -top-3',
    lg: 'text-xl -top-4',
    xl: 'text-4xl -top-6'
  }

  const currentSize = sizeClasses[size]
  const currentIconSize = iconSizes[size]

  return (
    <div className="relative inline-block">
      {/* De Avatar Cirkel met Rank Kleur */}
      <div className={`relative rounded-full ${currentSize} ${rank.borderColor} ${size === 'xl' ? rank.glow : ''} p-[2px]`}>
        <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
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

      {/* Het Kroontje (Alleen tonen als showCrown true is én er een icoon is) */}
      {showCrown && rank.icon && (
        <div className={`absolute left-1/2 -translate-x-1/2 animate-bounce filter drop-shadow-md ${currentIconSize}`}>
          {rank.icon}
        </div>
      )}
    </div>
  )
}