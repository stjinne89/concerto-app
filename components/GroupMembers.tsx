'use client'

import { useState, useEffect } from 'react'
import { Users, X, Loader2 } from 'lucide-react'
import { getGroupMembers } from '@/app/actions'
import GamifiedAvatar from '@/components/GamifiedAvatar'
import { getRank } from '@/utils/gamification'

export default function GroupMembers({ groupId, groupName }: { groupId: string, groupName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Als de modal opent, halen we de leden op
  useEffect(() => {
    if (isOpen && members.length === 0) {
      setLoading(true)
      getGroupMembers(groupId).then(data => {
        // Sorteer op XP (hoogste bovenaan) -> Toch stiekem een ranglijstje ;)
        const sorted = data.sort((a: any, b: any) => (b.xp_points || 0) - (a.xp_points || 0))
        setMembers(sorted)
        setLoading(false)
      })
    }
  }, [isOpen, groupId])

  return (
    <>
      {/* 1. DE KNOP */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300 transition-colors shadow-lg"
      >
        <Users size={14} />
        Leden
      </button>

      {/* 2. DE MODAL (POP-UP) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          
          {/* Donkere achtergrond overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* De Lijst zelf */}
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                  <h3 className="font-bold text-white text-lg">{groupName}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Ledenlijst</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Scrollbare lijst */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading ? (
                <div className="py-10 flex justify-center text-slate-500">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-1">
                  {members.map((member) => {
                    // Bereken rank voor de tekstkleur
                    const rank = getRank(member)
                    
                    return (
                      <div key={member.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors">
                        
                        {/* DE GAMIFIED AVATAR (Met Fallback Fix) */}
                        <div className="shrink-0">
                            <GamifiedAvatar 
                                profile={{
                                    ...member,
                                    // HIER IS DE FIX: Als avatar leeg is, gebruik placeholder
                                    avatar_url: member.avatar_url || '/images/avatar-placeholder.png'
                                }} 
                                size="md" 
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate text-sm">
                                {member.full_name}
                              </span>
                              {/* Rank Naam Badge */}
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-950/50 ${rank.borderColor} ${rank.textColor}`}>
                                {rank.name}
                              </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-2">
                             <span>{member.xp_points || 0} XP</span>
                             <span className="w-1 h-1 rounded-full bg-slate-700" />
                             <span>{member.events_created || 0} Events</span>
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}