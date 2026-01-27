'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, HelpCircle, X, Loader2, Plus } from 'lucide-react'
import GamifiedAvatar from '@/components/GamifiedAvatar'

// Types
type RsvpWithProfile = {
  status: string
  user_id: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
    // Deze stats hebben we nodig voor de GamifiedAvatar!
    xp_points?: number
    events_created?: number
    messages_count?: number
  } | null
}

type Reaction = {
  id: string
  target_user_id: string
  actor_user_id: string
  emoji: string
}

interface RsvpControlProps {
  eventId: string
  myStatus?: string
  allRsvps: any[]
  initialReactions: Reaction[]
  currentUserId: string
}

export default function RsvpControl({ eventId, myStatus, allRsvps, initialReactions, currentUserId }: RsvpControlProps) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions)
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null) // Welke gebruiker staat open voor reacties?
  
  const supabase = createClient()
  const router = useRouter()

  const rsvps = allRsvps as RsvpWithProfile[]
  const EMOJI_OPTIONS = ['🔥', '🍻', '🎉', '❤️', '🫡']

  // --- RSVP LOGICA ---
  const handleRsvp = async (newStatus: string) => {
    if (loading) return
    setLoading(true)
    
    try {
      if (myStatus === newStatus) {
          const { error } = await supabase.from('rsvps').delete().eq('event_id', eventId).eq('user_id', currentUserId)
          if (error) throw error
      } else {
          const { error } = await supabase.from('rsvps').upsert({
              event_id: eventId, user_id: currentUserId, status: newStatus
            }, { onConflict: 'event_id, user_id' })
          if (error) throw error
      }
      router.refresh()
    } catch (error) {
      console.error('RSVP Error:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  // --- REACTION LOGICA ---
  const handleReaction = async (targetUserId: string, emoji: string) => {
    // 1. Optimistic Update (meteen tonen)
    const existing = reactions.find(r => 
        r.target_user_id === targetUserId && 
        r.actor_user_id === currentUserId && 
        r.emoji === emoji
    )

    let newReactions = [...reactions]
    if (existing) {
        // Verwijder als hij al bestaat (toggle off)
        newReactions = newReactions.filter(r => r.id !== existing.id)
    } else {
        // Voeg toe (toggle on)
        newReactions.push({
            id: 'temp-' + Date.now(),
            target_user_id: targetUserId,
            actor_user_id: currentUserId,
            emoji
        })
    }
    setReactions(newReactions)
    setActiveReactionId(null) // Sluit menu na keuze

    // 2. Database Update
    try {
        if (existing) {
            await supabase.from('rsvp_reactions').delete().eq('id', existing.id)
        } else {
            await supabase.from('rsvp_reactions').insert({
                event_id: eventId,
                target_user_id: targetUserId,
                actor_user_id: currentUserId,
                emoji
            })
        }
        router.refresh()
    } catch (error) {
        console.error('Reaction failed', error)
        setReactions(initialReactions) // Rollback bij fout
    }
  }

  // --- HELPERS ---
  const sortedRsvps = [...rsvps].sort((a, b) => {
    const order: {[key: string]: number} = { going: 1, interested: 2, cant: 3 }
    return (order[a.status] || 4) - (order[b.status] || 4)
  })

  const goingCount = rsvps.filter(r => r.status === 'going').length
  const interestedCount = rsvps.filter(r => r.status === 'interested').length

  const getStatusInfo = (status: string) => {
      switch(status) {
          case 'going': return { color: 'bg-emerald-500', text: 'text-emerald-500', label: 'Gaat', icon: Check }
          case 'interested': return { color: 'bg-amber-500', text: 'text-amber-500', label: 'Interesse', icon: HelpCircle }
          case 'cant': return { color: 'bg-slate-500', text: 'text-slate-500', label: 'Niet', icon: X }
          default: return { color: 'bg-slate-500', text: 'text-slate-500', label: '?', icon: HelpCircle }
      }
  }

  const isGoing = myStatus === 'going'
  const isInterested = myStatus === 'interested'
  const isCant = myStatus === 'cant'

  return (
    <div className="mt-4">
      {/* 1. HEADER (De kleine rondjes) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors mb-4 w-full"
      >
        <div className="flex -space-x-2 items-center">
            {rsvps.filter(r => r.status === 'going').slice(0, 3).map((r, i) => (
                <div key={i} className="relative transition-transform hover:scale-110 hover:z-10">
                    <GamifiedAvatar 
                        // HIER IS DE FIX: Fallback naar placeholder
                        profile={r.profiles ? {
                            ...r.profiles,
                            avatar_url: r.profiles.avatar_url || '/images/avatar-placeholder.png'
                        } : null}
                        size="sm" 
                        showCrown={false} // Geen kroontjes in deze kleine weergave
                    />
                </div>
            ))}
            {goingCount > 3 && (
                 <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-xs font-bold shadow-sm relative z-0">
                    +{goingCount - 3}
                 </div>
            )}
        </div>

        <span className="flex-1 text-left text-xs">
           {goingCount} Gaan • {interestedCount} Interesse
        </span>
        <ChevronDown size={16} className={`transition-transform opacity-50 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 2. UITKLAPLIJST MET REACTIES */}
      {isOpen && (
          <div className="mb-4 bg-slate-900/50 border border-white/5 rounded-2xl p-2 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
              {sortedRsvps.length > 0 ? sortedRsvps.map((r) => {
                  const info = getStatusInfo(r.status)
                  const userReactions = reactions.filter(react => react.target_user_id === r.user_id)
                  
                  // Groepeer emoji's
                  const emojiCounts: {[key: string]: number} = {}
                  userReactions.forEach(react => {
                      emojiCounts[react.emoji] = (emojiCounts[react.emoji] || 0) + 1
                  })

                  const isMenuOpen = activeReactionId === r.user_id

                  return (
                    <div key={r.user_id} className="relative group/item">
                        <div 
                            onClick={() => setActiveReactionId(isMenuOpen ? null : r.user_id)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                
                                {/* HIER DE NIEUWE GAMIFIED AVATAR (MET FIX) */}
                                <div>
                                    <GamifiedAvatar 
                                        profile={r.profiles ? {
                                            ...r.profiles,
                                            avatar_url: r.profiles.avatar_url || '/images/avatar-placeholder.png'
                                        } : null}
                                        size="md" // Iets groter (48px) zodat de rand goed zichtbaar is
                                        showCrown={true} 
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="block text-sm font-bold text-slate-200">
                                            {r.profiles?.full_name?.split(' ')[0] || 'Onbekend'}
                                        </span>
                                        {/* Toon de ontvangen emoji's */}
                                        <div className="flex gap-1">
                                            {Object.entries(emojiCounts).map(([emoji, count]) => (
                                                <span key={emoji} className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full border border-white/5 text-slate-300">
                                                    {emoji} {count > 1 && <span className="text-[9px] opacity-70 ml-0.5 font-bold">x{count}</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${info.color}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${info.text}`}>
                                            {info.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-500 ${isMenuOpen ? 'opacity-100' : ''}`}>
                                <Plus size={16} />
                            </div>
                        </div>

                        {/* HET EMOJI MENU */}
                        {isMenuOpen && (
                            <div className="absolute left-14 bottom-10 z-20 bg-slate-800 border border-slate-700 shadow-xl rounded-full flex gap-1 p-1 animate-in zoom-in-95 duration-100">
                                {EMOJI_OPTIONS.map(emoji => {
                                    const hasReacted = userReactions.some(re => re.actor_user_id === currentUserId && re.emoji === emoji)
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={(e) => {
                                                e.stopPropagation() 
                                                handleReaction(r.user_id, emoji)
                                            }}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full text-lg hover:scale-125 transition-transform ${hasReacted ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'}`}
                                        >
                                            {emoji}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {/* Overlay om menu te sluiten */}
                        {isMenuOpen && (
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveReactionId(null)}
                            />
                        )}
                    </div>
                  )
              }) : (
                  <div className="text-center py-3 text-sm font-medium text-slate-500">Nog geen reacties</div>
              )}
          </div>
      )}

      {/* 3. KNOPPEN */}
      <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5 shadow-sm relative">
        {loading && <div className="absolute inset-0 bg-slate-950/50 z-10 rounded-xl flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
        
        <button 
            onClick={() => handleRsvp('going')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isGoing ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
            Gaat
        </button>
        <button 
            onClick={() => handleRsvp('interested')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isInterested ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
            Interesse
        </button>
        <button 
            onClick={() => handleRsvp('cant')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isCant ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
            Niet
        </button>
      </div>
    </div>
  )
}