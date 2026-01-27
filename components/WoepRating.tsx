'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
// Import WoepIcon is verwijderd, we doen het inline!

interface RatingProps {
  eventId: string
  userId: string
  eventName: string
  eventType: string
  allRatings: any[]
  initialRating: any | null
  isAttending: boolean
}

export default function WoepRating({ 
  eventId, userId, eventName, initialRating, isAttending 
}: RatingProps) {
  const [rating, setRating] = useState<number>(initialRating?.rating || 0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleRate = async (score: number) => {
    setLoading(true)
    setRating(score) // Direct feedback

    try {
      const { error } = await supabase
        .from('event_ratings')
        .upsert({
          event_id: eventId,
          user_id: userId,
          rating: score
        }, { onConflict: 'event_id, user_id' })

      if (error) throw error
      
      router.refresh()
    } catch (error) {
      console.error('Error rating:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAttending) return null

  return (
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Geef een WoepScore
        </span>
        {loading && <Loader2 size={14} className="animate-spin text-violet-500" />}
      </div>

      {/* De Rating Container */}
      <div className="flex justify-between gap-1 h-10 items-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
          // Is dit bolletje actief (geselecteerd of gehovered)?
          const isActive = score <= (hoverRating || rating)
          
          return (
            <button
              key={score}
              onClick={() => handleRate(score)}
              onMouseEnter={() => setHoverRating(score)}
              onMouseLeave={() => setHoverRating(0)}
              className="flex-1 h-full flex items-center justify-center focus:outline-none group relative"
            >
              {/* HIER ZIT DE MAGIE: HET RONDJE (DE "O") 
                  We tekenen dit gewoon met CSS (Tailwind classes)
              */}
              <div 
                className={`
                    rounded-full border-2 transition-all duration-300 ease-out
                    ${isActive 
                        ? 'w-3 h-3 bg-violet-500 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)] scale-125' // Actief: Gevuld, Gloed, Groter
                        : 'w-2.5 h-2.5 bg-transparent border-slate-600 opacity-40 group-hover:border-slate-400 group-hover:opacity-100' // Inactief: Leeg, Grijs
                    }
                `}
              />
              
              {/* Tooltip met cijfer (verschijnt alleen bij hoveren) */}
              {hoverRating === score && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-2 z-10">
                      {score}
                  </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Feedback tekst onderaan */}
      <div className="text-center mt-1 h-4">
        {rating > 0 && (
            <span className="text-xs font-bold text-violet-300 animate-in fade-in">
                {rating === 10 ? "LEGENDARISCH! 🤯" : 
                 rating >= 8 ? "Geweldig! 🔥" : 
                 rating >= 6 ? "Was leuk 👍" : 
                 "Mwah... 😐"}
            </span>
        )}
      </div>
    </div>
  )
}