'use client'

import { createClient } from '@/utils/supabase/client'
import { toggleRSVP } from '@/app/actions'
import { useState, useEffect } from 'react'
import { CheckCircle2, HelpCircle, XCircle, Users } from 'lucide-react'

type RsvpStatus = 'going' | 'maybe' | 'not_going' | null

export default function RsvpControl({ eventId, myStatus }: { eventId: string, myStatus: RsvpStatus }) {
  const [status, setStatus] = useState<RsvpStatus>(myStatus)
  const [counts, setCounts] = useState({ going: 0, maybe: 0 })
  const supabase = createClient()

  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase.from('rsvps').select('status').eq('event_id', eventId)
      if (data) {
        setCounts({
          going: data.filter(r => r.status === 'going').length,
          maybe: data.filter(r => r.status === 'maybe').length
        })
      }
    }
    fetchCounts()
    const channel = supabase.channel(`rsvp-${eventId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps', filter: `event_id=eq.${eventId}` }, fetchCounts).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase])

  const handleToggle = async (newStatus: RsvpStatus) => {
    const statusToSend = status === newStatus ? null : newStatus
    setStatus(statusToSend) // Optimistic UI
    await toggleRSVP(eventId, statusToSend || 'remove')
  }

  // Hulpfunctie voor knop stijlen
  const btnBase = "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border"
  
  const styles = {
    going: status === 'going' 
      ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm" 
      : "bg-white text-slate-600 hover:bg-emerald-50 border-slate-200",
    maybe: status === 'maybe'
      ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm"
      : "bg-white text-slate-600 hover:bg-amber-50 border-slate-200",
    not: status === 'not_going'
      ? "bg-rose-100 text-rose-700 border-rose-200 shadow-sm"
      : "bg-white text-slate-400 hover:bg-rose-50 border-slate-200 hover:text-rose-600"
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm font-bold text-slate-700 gap-1.5">
          <Users size={16} className="text-violet-600" />
          {counts.going > 0 ? (
            <span>{counts.going} {counts.going === 1 ? 'gaat' : 'gaan'}</span>
          ) : (
            <span className="text-slate-500 font-medium">Nog niemand gaat</span>
          )}
          {counts.maybe > 0 && <span className="text-slate-400 text-xs font-medium">(+{counts.maybe} misschien)</span>}
        </div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jouw status</span>
      </div>
      
      <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
        <button onClick={() => handleToggle('going')} className={`${btnBase} ${styles.going}`}>
          <CheckCircle2 size={16} className={status === 'going' ? "fill-emerald-600 text-white" : ""} />
          Gaat
        </button>
        <button onClick={() => handleToggle('maybe')} className={`${btnBase} ${styles.maybe}`}>
          <HelpCircle size={16} className={status === 'maybe' ? "fill-amber-500 text-white" : ""} />
          Misschien
        </button>
        <button onClick={() => handleToggle('not_going')} className={`${btnBase} ${styles.not}`}>
          <XCircle size={16} className={status === 'not_going' ? "fill-rose-500 text-white" : ""} />
          Niet
        </button>
      </div>
    </div>
  )
}