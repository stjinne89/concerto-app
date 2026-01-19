'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import AttendeeList from './AttendeeList'

export default function RsvpControl({ eventId, myStatus: initialStatus, allRsvps }: { 
  eventId: string, 
  myStatus: string | undefined,
  allRsvps: any[]
}) {
  const [status, setStatus] = useState(initialStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  async function updateStatus(newStatus: string) {
    if (isUpdating) return
    setIsUpdating(true)

    const oldStatus = status
    const targetStatus = status === newStatus ? undefined : newStatus
    setStatus(targetStatus)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStatus(oldStatus)
      setIsUpdating(false)
      return
    }

    try {
      if (oldStatus === newStatus) {
        const { error } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)
        
        if (error) throw error
      } else {
        // AANGEPAST: We sturen nu 'going', 'interested' of 'cant' naar de database
        const { error } = await supabase
          .from('rsvps')
          .upsert({ 
            event_id: eventId, 
            user_id: user.id, 
            status: newStatus 
          })
        
        if (error) throw error
      }

      router.refresh()
      
    } catch (error) {
      console.error('RSVP error:', error)
      setStatus(oldStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <AttendeeList rsvps={allRsvps} />
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
          Jouw Status
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={() => updateStatus('going')}
          disabled={isUpdating}
          className={`py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
            status === 'going' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]' 
              : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
          }`}
        >
          Gaat
        </button>

        {/* AANGEPAST: Waarde is nu 'interested' */}
        <button 
          onClick={() => updateStatus('interested')}
          disabled={isUpdating}
          className={`py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
            status === 'interested' 
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]' 
              : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
          }`}
        >
          Interesse
        </button>

        {/* AANGEPAST: Waarde is nu 'cant' */}
        <button 
          onClick={() => updateStatus('cant')}
          disabled={isUpdating}
          className={`py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
            status === 'cant' 
              ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
              : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
          }`}
        >
          Niet
        </button>
      </div>
    </div>
  )
}