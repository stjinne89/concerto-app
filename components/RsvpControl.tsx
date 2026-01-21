'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, HelpCircle, X, Loader2 } from 'lucide-react'

type RsvpWithProfile = {
  status: string
  user_id: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface RsvpControlProps {
  eventId: string
  myStatus?: string
  allRsvps: any[]
}

export default function RsvpControl({ eventId, myStatus, allRsvps }: RsvpControlProps) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const rsvps = allRsvps as RsvpWithProfile[]

  const handleRsvp = async (newStatus: string) => {
    if (loading) return
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Toggle logica: Als je klikt op wat je al hebt, verwijder je de RSVP
      if (myStatus === newStatus) {
          const { error } = await supabase
            .from('rsvps')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', user.id)
          
          if (error) throw error
      } else {
          const { error } = await supabase
            .from('rsvps')
            .upsert({
              event_id: eventId,
              user_id: user.id,
              status: newStatus
            }, { 
              onConflict: 'event_id, user_id'
            })
          
          if (error) throw error
      }

      router.refresh()
    } catch (error) {
      console.error('RSVP Error:', error)
      alert('Kon status niet aanpassen. Check je internet of rechten.')
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  const sortedRsvps = [...rsvps].sort((a, b) => {
    // AANGEPAST: Hier stond nog 'not_going', nu 'cant'
    const order: {[key: string]: number} = { going: 1, interested: 2, cant: 3 }
    return (order[a.status] || 4) - (order[b.status] || 4)
  })

  const goingCount = rsvps.filter(r => r.status === 'going').length
  const interestedCount = rsvps.filter(r => r.status === 'interested').length

  const getStatusInfo = (status: string) => {
      switch(status) {
          case 'going': return { color: 'bg-emerald-500', text: 'text-emerald-500', label: 'Gaat', icon: Check }
          case 'interested': return { color: 'bg-amber-500', text: 'text-amber-500', label: 'Interesse', icon: HelpCircle }
          // AANGEPAST: 'cant' toegevoegd als hoofd-case
          case 'cant': return { color: 'bg-slate-500', text: 'text-slate-500', label: 'Niet', icon: X }
          default: return { color: 'bg-slate-500', text: 'text-slate-500', label: '?', icon: HelpCircle }
      }
  }

  const isGoing = myStatus === 'going'
  const isInterested = myStatus === 'interested'
  // AANGEPAST: Check op 'cant'
  const isCant = myStatus === 'cant'

  return (
    <div className="mt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors mb-4 w-full"
      >
        <div className="flex -space-x-3">
            {rsvps.filter(r => r.status === 'going').slice(0, 3).map((r, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden relative shadow-sm">
                    {r.profiles?.avatar_url ? (
                        <img src={r.profiles.avatar_url} alt="Av" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                            {r.profiles?.full_name?.charAt(0)}
                        </div>
                    )}
                </div>
            ))}
            {goingCount > 3 && (
                 <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-xs font-bold shadow-sm">
                    +{goingCount - 3}
                 </div>
            )}
        </div>

        <span className="flex-1 text-left text-xs">
           {goingCount} Gaan • {interestedCount} Interesse
        </span>
        <ChevronDown size={16} className={`transition-transform opacity-50 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
          <div className="mb-4 bg-slate-900/50 border border-white/5 rounded-2xl p-2 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
              {sortedRsvps.length > 0 ? sortedRsvps.map((r) => {
                  const info = getStatusInfo(r.status)
                  return (
                    <div key={r.user_id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-900 relative shadow-sm">
                                {r.profiles?.avatar_url ? (
                                    <img src={r.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">
                                        {r.profiles?.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-slate-200">
                                    {r.profiles?.full_name?.split(' ')[0] || 'Onbekend'}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${info.color}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${info.text}`}>
                                        {info.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                  )
              }) : (
                  <div className="text-center py-3 text-sm font-medium text-slate-500">Nog geen reacties</div>
              )}
          </div>
      )}

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
        
        {/* AANGEPAST: Functie en stijl checken nu op 'cant' */}
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