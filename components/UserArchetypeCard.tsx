import { calculateCoordinates } from '@/utils/typecasting/calculator'
import { getArchetype, BadgeColor } from '@/utils/typecasting/dictionary'
import { User } from 'lucide-react'
import Image from 'next/image'

const COLOR_STYLES: Record<BadgeColor, string> = {
  gold: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.2)]',
  purple: 'bg-violet-500/10 border-violet-500/50 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.2)]',
  green: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  red: 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]',
  orange: 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.2)]',
  gray: 'bg-slate-800/50 border-slate-700 text-slate-400',
}

const ARCHETYPE_IMAGES: Record<string, string> = {
    'Headliner Held': '/images/badge-trophy.png',
    'Tourbus Nomade': '/images/icon-discover.png',
    'Pit Pirate': '/images/icon-discover.png',
    'Chatty Groupie': '/images/badge-group.png',
    'Merch Messias': '/images/badge-star.png', 
    'InstaReporter': '/images/badge-group.png',
    'Lobbyist': '/images/badge-group.png',
    'Review Rockstar': '/images/badge-star.png',
    'Fissa Filosoof': '/images/badge-star.png',
    'Studio Jury': '/images/badge-lock.png',
    'DieHard Fan': '/images/icon-discover.png',
    'Planner': '/images/badge-calendar.png',
    'Backstage Sluiper': '/images/badge-lock.png',
    'Silent DJ': '/images/badge-unlock.png',
    'Ghost Ticket': '/images/avatar-placeholder.png',
    'Sam Fender': '/images/event-placeholder.png',
    'Hangmat Hippie': '/images/state-caught-up.png',
    'Festival Ganger': '/images/badge-profile.png',
    'De Onbekende': '/images/badge-profile.png',
}

export default function UserArchetypeCard({ analytics }: { analytics: any }) {
  const coords = calculateCoordinates(analytics)
  const archetype = getArchetype(coords)
  
  const styles = COLOR_STYLES[archetype.badge_color] || COLOR_STYLES.gray
  const imagePath = ARCHETYPE_IMAGES[archetype.name] || null
  const FallbackIcon = User;

  return (
    <div className={`relative group overflow-hidden rounded-3xl border p-6 transition-all duration-500 hover:scale-[1.02] ${styles}`}>
      
      {/* Achtergrond: Grote versie van de badge (geblend) */}
      <div className="absolute top-0 right-0 w-3/5 h-full opacity-10 pointer-events-none mix-blend-overlay filter grayscale contrast-125">
        {imagePath ? (
            <Image 
               src={imagePath} 
               alt={archetype.name}
               fill
               className="object-contain object-right mask-image-gradient"
               style={{ maskImage: 'linear-gradient(to left, black 50%, transparent 100%)' }}
            />
        ) : (
             <FallbackIcon size={150} className="absolute top-4 right-4 opacity-20" />
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full">
        
        {/* Header met Badge Thumbnail */}
        <div className="flex items-center gap-4 mb-4">
           <div className={`relative h-16 w-16 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/20 backdrop-blur-sm shrink-0 p-2 flex items-center justify-center`}>
                {imagePath ? (
                    <Image 
                        src={imagePath} 
                        alt={archetype.name}
                        width={64}
                        height={64}
                        className="object-contain drop-shadow-md"
                    />
                ) : (
                    <FallbackIcon size={32} />
                )}
           </div>
           <div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-75 block mb-1">Concerto Type</span>
                <h3 className="text-2xl font-black tracking-tight font-serif leading-none shadow-black drop-shadow-sm">
                   {archetype.name}
                </h3>
           </div>
        </div>
        
        <p className="text-sm font-medium opacity-90 leading-relaxed max-w-[90%] mb-6 flex-grow">
          "{archetype.description}"
        </p>

        {/* STATS VISUALISATIE: Logo Gradiënt Kleuren */}
        <div className="grid grid-cols-3 gap-4 mt-auto">
             
             {/* As 1: Commitment (PAARS / VIOLET) */}
             <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 text-violet-300">Commitment</span>
                <div className="h-1.5 w-full bg-slate-900/60 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div 
                        className="h-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-1000" 
                        style={{ width: `${(coords.commitment + 0.5) * 20}%` }} 
                    />
                </div>
             </div>

             {/* As 2: Vibe (BLAUW / INDIGO) */}
             <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 text-center text-blue-300">Vibe</span>
                <div className="h-1.5 w-full bg-slate-900/60 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div 
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-1000" 
                        style={{ width: `${(coords.social + 0.5) * 20}%` }} 
                    />
                </div>
             </div>

             {/* As 3: Kritiek (CYAAN / SKY) */}
             <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 text-right text-cyan-300">Rate</span>
                <div className="h-1.5 w-full bg-slate-900/60 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div 
                        className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-1000 ml-auto" 
                        style={{ width: `${(coords.critic + 0.5) * 20}%` }} 
                    />
                </div>
             </div>
        </div>

      </div>
    </div>
  )
}