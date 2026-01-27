'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Lock, Trophy, Medal, Crown } from 'lucide-react'
import GamifiedAvatar from '@/components/GamifiedAvatar'
import { getRank } from '@/utils/gamification'

// Pas dit aan naar hoeveel XP je nodig hebt om de ranking te zien
const UNLOCK_THRESHOLD = 300 

export default function HiddenRanking({ currentXp, currentUserId }: { currentXp: number, currentUserId: string }) {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Is de ranking 'unlocked' voor deze gebruiker?
  const isUnlocked = currentXp >= UNLOCK_THRESHOLD
  
  // Bereken percentage voor de progress bar (max 100%)
  const progressPercent = Math.min((currentXp / UNLOCK_THRESHOLD) * 100, 100)
  const xpNeeded = Math.max(0, UNLOCK_THRESHOLD - currentXp)

  const supabase = createClient()

  useEffect(() => {
    // We halen de data ALTIJD op, maar we tonen hem pas als isUnlocked true is (of we blurren hem)
    // Dit doen we zodat we de blur er 'echt' uit kunnen laten zien met data erachter
    const fetchLeaders = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, xp_points, events_created, messages_count')
        .order('xp_points', { ascending: false })
        .limit(10) // Top 10

      if (data) setLeaders(data)
      setLoading(false)
    }

    fetchLeaders()
  }, [])

  // Helper voor trofee kleuren
  const getPlaceIcon = (index: number) => {
    if (index === 0) return <Crown size={20} className="text-yellow-400 fill-yellow-400/20" />
    if (index === 1) return <Medal size={20} className="text-slate-300 fill-slate-300/20" />
    if (index === 2) return <Medal size={20} className="text-amber-700 fill-amber-700/20" />
    return <span className="font-bold text-slate-600 w-5 text-center">{index + 1}</span>
  }

  return (
    <div className="relative w-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* HEADER */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
           <Trophy className={isUnlocked ? "text-yellow-500" : "text-slate-600"} size={20} />
           <h3 className="font-bold text-white tracking-tight">
             {isUnlocked ? "Hall of Fame" : "Verborgen Ranglijst"}
           </h3>
        </div>
        {!isUnlocked && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg border border-white/5">
                <Lock size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Locked</span>
            </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="relative min-h-[300px]">
        
        {/* DE LIJST (Altijd gerenderd, maar misschien geblurd) */}
        <div className={`p-2 space-y-1 transition-all duration-700 ${isUnlocked ? 'filter-none opacity-100' : 'blur-md opacity-30 select-none pointer-events-none'}`}>
          {loading ? (
             <div className="text-center py-10 text-slate-600">Laden...</div>
          ) : (
            leaders.map((user, index) => {
              const isMe = user.id === currentUserId
              const rank = getRank(user)

              return (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-3 p-3 rounded-2xl ${isMe ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-transparent'}`}
                >
                  {/* Positie */}
                  <div className="flex-shrink-0 w-8 flex justify-center">
                      {getPlaceIcon(index)}
                  </div>

                  {/* Avatar */}
                  <GamifiedAvatar profile={user} size="sm" />

                  {/* Naam & Info */}
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold truncate ${isMe ? 'text-violet-200' : 'text-slate-300'}`}>
                              {user.full_name?.split(' ')[0]}
                          </span>
                          <span className="text-xs font-mono font-bold text-violet-400">
                              {user.xp_points} XP
                          </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] px-1.5 rounded border ${rank.borderColor} ${rank.textColor} bg-slate-950/50`}>
                             {rank.name}
                          </span>
                      </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* DE 'LOCKED' OVERLAY (Alleen als nog niet unlocked) */}
        {!isUnlocked && (
           <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                   <Lock size={32} className="text-slate-400" />
               </div>
               
               <h4 className="text-lg font-bold text-white mb-2">Toegang Geweigerd</h4>
               <p className="text-sm text-slate-400 mb-6 max-w-[200px]">
                   Verdien nog <span className="text-white font-bold">{xpNeeded} XP</span> om te zien wie de legendes zijn.
               </p>

               {/* Progress Bar */}
               <div className="w-full max-w-[200px] h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                   <div 
                      className="h-full bg-violet-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                   />
               </div>
               <span className="text-[10px] text-slate-500 mt-2 font-mono">
                   {currentXp} / {UNLOCK_THRESHOLD} XP
               </span>
           </div>
        )}

      </div>
    </div>
  )
}