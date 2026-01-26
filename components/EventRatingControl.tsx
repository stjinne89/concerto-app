'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Save, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import WoepRating from './WoepRating'
import { getCriteriaForEvent } from '@/utils/ratingConfig'

type Props = {
    eventId: string
    userId: string
    eventName: string // <--- NIEUW
    eventType: string
    initialRating: any | null 
    allRatings: any[] 
    isAttending: boolean
}

export default function EventRatingControl({ eventId, userId, eventName, eventType, initialRating, allRatings, isAttending }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Scores van 0 tot 10
    const [scores, setScores] = useState({
        c1: initialRating?.criteria_1_score || 0,
        c2: initialRating?.criteria_2_score || 0,
        c3: initialRating?.criteria_3_score || 0,
    })
    const [comment, setComment] = useState(initialRating?.comment || '')

    const supabase = createClient()
    const router = useRouter()
    
    const criteria = getCriteriaForEvent(eventType)

    const globalAverage = allRatings.length > 0
        ? (allRatings.reduce((acc, r) => acc + Number(r.average_score), 0) / allRatings.length).toFixed(1)
        : null

    const myAverage = ((scores.c1 + scores.c2 + scores.c3) / 3).toFixed(1)

    const handleSave = async () => {
        setLoading(true)
        const totalAvg = (scores.c1 + scores.c2 + scores.c3) / 3
        
        const payload = {
            event_id: eventId,
            user_id: userId,
            criteria_1_score: scores.c1,
            criteria_2_score: scores.c2,
            criteria_3_score: scores.c3,
            average_score: totalAvg,
            comment: comment
        }

        const { error } = await supabase
            .from('event_ratings')
            .upsert(payload, { onConflict: 'event_id, user_id' })

        if (!error) {
            setIsOpen(false)
            router.refresh()
        } else {
            console.error(error)
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-end gap-2">
            
            {/* GLOBAL SCORE BADGE */}
            {globalAverage && (
                <div className="absolute top-4 right-14 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 z-20">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-white">{globalAverage}</span>
                </div>
            )}

            {/* DE KNOP */}
            {isAttending ? (
                <button 
                    onClick={() => setIsOpen(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${
                        initialRating 
                        ? 'bg-violet-500/20 text-violet-200 border-violet-500/30 hover:bg-violet-500/30' 
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20 animate-pulse'
                    }`}
                >
                    {initialRating ? (
                        <>
                            <Star size={14} className="text-violet-400" /> 
                            Jouw WoepScore: {Number(initialRating.average_score).toFixed(1)}
                        </>
                    ) : (
                        <>⭐ Rate dit event</>
                    )}
                </button>
            ) : (
                <div className="text-[10px] text-slate-500 italic px-2">
                    Alleen aanwezigen kunnen raten
                </div>
            )}

            {/* DE OVERLAY (MODAL) */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    
                    <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                        
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>

                        {/* HIER IS DE VOLGORDE OMGEDRAAID & NAAM TOEGEVOEGD */}
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-bold">
                            Rate {eventType}
                        </p>
                        <h3 className="text-xl font-black text-white mb-6 tracking-tight leading-tight">
                            Hoe was het bij <span className="text-violet-400">{eventName}</span>?
                        </h3>

                        <div className="space-y-7">
                            {/* Vraag 1 */}
                            <div>
                                <div className="flex justify-between mb-2 items-end">
                                    <label className="font-bold text-slate-200 text-lg">{criteria[0].label}</label>
                                    <span className="text-violet-400 font-mono font-bold text-lg">{scores.c1 > 0 ? scores.c1 : '-'}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{criteria[0].description}</p>
                                <WoepRating value={scores.c1} onChange={(v) => setScores({...scores, c1: v})} size={44} />
                            </div>

                            {/* Vraag 2 */}
                            <div>
                                <div className="flex justify-between mb-2 items-end">
                                    <label className="font-bold text-slate-200 text-lg">{criteria[1].label}</label>
                                    <span className="text-violet-400 font-mono font-bold text-lg">{scores.c2 > 0 ? scores.c2 : '-'}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{criteria[1].description}</p>
                                <WoepRating value={scores.c2} onChange={(v) => setScores({...scores, c2: v})} size={44} />
                            </div>

                            {/* Vraag 3 */}
                            <div>
                                <div className="flex justify-between mb-2 items-end">
                                    <label className="font-bold text-slate-200 text-lg">{criteria[2].label}</label>
                                    <span className="text-violet-400 font-mono font-bold text-lg">{scores.c3 > 0 ? scores.c3 : '-'}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{criteria[2].description}</p>
                                <WoepRating value={scores.c3} onChange={(v) => setScores({...scores, c3: v})} size={44} />
                            </div>

                            {/* Commentaar */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Opmerking (Optioneel)</label>
                                <textarea 
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
                                    placeholder="Wat bleef je het meeste bij?"
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Footer Score & Save */}
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold">Jouw Totaal</div>
                                <div className="text-3xl font-black text-white">{myAverage} <span className="text-sm font-bold text-violet-400 uppercase">WoepScore</span></div>
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50 transition-all hover:scale-105"
                            >
                                <Save size={18} /> {loading ? '...' : 'Opslaan'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}