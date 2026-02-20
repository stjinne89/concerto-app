'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { MapPin, Calendar, Check, X, Star } from 'lucide-react'
import Link from 'next/link'

type Event = {
    id: string
    title: string
    start_at: string
    image_url?: string
    venue_name?: string
    event_type?: string
    ticket_link?: string // Toegevoegd zodat we de link kunnen gebruiken
}

export default function EventSwiper({ initialEvents, userId }: { initialEvents: Event[], userId: string }) {
    const [events, setEvents] = useState(initialEvents)
    const supabase = createClient()

    // Als alles op is
    if (events.length === 0) {
        return (
            <div className="text-center animate-in zoom-in duration-500 flex flex-col items-center">
                
                {/* NIEUW: HET GROTE PLAATJE */}
                <div className="w-48 h-48 mb-6 relative">
                    <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" /> {/* Achtergrond gloed */}
                    <img 
                        src="/images/state-caught-up.png" 
                        alt="Helemaal bij" 
                        className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                    />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">Helemaal bij!</h2>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                    Je hebt alle events bekeken. Tijd om je agenda te checken of zelf iets te organiseren.
                </p>
                <Link 
                    href="/" 
                    className="bg-white text-slate-950 px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    Terug naar Home
                </Link>
            </div>
        )
    }

    // We tonen altijd de achterste kaarten voor het "stapel effect", maar interacten alleen met index 0
    return (
        <div className="relative w-full max-w-sm aspect-[3/4]">
            <AnimatePresence>
                {events.slice(0, 2).reverse().map((event, index) => {
                    const isTopCard = index === 1 || events.length === 1
                    
                    return (
                        <SwipeCard 
                            key={event.id} 
                            event={event} 
                            userId={userId}
                            isTopCard={isTopCard}
                            onSwipe={(direction) => {
                                // 1. Verwijder uit de lijst (Optimistic UI)
                                setEvents(current => current.slice(1))
                                
                                // 2. Sla op in database
                                const status = direction === 'right' ? 'going' : direction === 'up' ? 'interested' : 'cant'
                                supabase.from('rsvps').insert({ user_id: userId, event_id: event.id, status }).then()
                            }}
                        />
                    )
                })}
            </AnimatePresence>
        </div>
    )
}

// HET LOSSE KAARTJE
function SwipeCard({ event, userId, isTopCard, onSwipe }: { event: Event, userId: string, isTopCard: boolean, onSwipe: (dir: string) => void }) {
    // Motion values voor swipe effecten
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    
    // Rotatie gebaseerd op X beweging
    const rotate = useTransform(x, [-200, 200], [-25, 25])
    
    // Opacity van de overlays (Groen/Rood/Blauw)
    const opacityLike = useTransform(x, [0, 150], [0, 1])
    const opacityNope = useTransform(x, [0, -150], [0, 1])
    const opacityMaybe = useTransform(y, [0, -150], [0, 1])

    const handleDragEnd = (_: any, info: any) => {
        const threshold = 100
        if (info.offset.x > threshold) onSwipe('right')
        else if (info.offset.x < -threshold) onSwipe('left')
        else if (info.offset.y < -threshold) onSwipe('up')
    }

    const date = new Date(event.start_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', weekday: 'short' })

    return (
        <motion.div
            style={{ x, y, rotate, zIndex: isTopCard ? 10 : 0 }}
            drag={isTopCard ? true : false} // Alleen bovenste kaart mag slepen
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: x.get() < 0 ? -500 : 500, opacity: 0, transition: { duration: 0.2 } }}
            className="absolute inset-0 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing"
        >
            {/* AFBEELDING */}
            <div className="h-3/5 w-full bg-slate-800 relative">
                 {event.image_url ? (
                     <img src={event.image_url} className="w-full h-full object-cover pointer-events-none" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                         <span className="text-4xl">🎵</span>
                     </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80" />
                 
                 {/* OVERLAYS (Feedback tijdens slepen) */}
                 <motion.div style={{ opacity: opacityLike }} className="absolute top-8 left-8 border-4 border-green-500 text-green-500 rounded-xl px-4 py-2 font-black text-4xl uppercase tracking-widest -rotate-12 bg-black/20 backdrop-blur-sm">JA!</motion.div>
                 <motion.div style={{ opacity: opacityNope }} className="absolute top-8 right-8 border-4 border-red-500 text-red-500 rounded-xl px-4 py-2 font-black text-4xl uppercase tracking-widest rotate-12 bg-black/20 backdrop-blur-sm">NEE</motion.div>
                 <motion.div style={{ opacity: opacityMaybe }} className="absolute bottom-1/2 left-1/2 -translate-x-1/2 border-4 border-blue-400 text-blue-400 rounded-xl px-4 py-2 font-black text-2xl uppercase tracking-widest bg-black/20 backdrop-blur-sm">Misschien</motion.div>
            </div>

            {/* TEKST & INFO */}
            <div className="h-2/5 p-6 flex flex-col justify-between pointer-events-none">
                <div>
                    <h2 className="text-2xl font-black text-white leading-tight mb-2 line-clamp-2">
                        {event.ticket_link ? (
                            /* We voegen pointer-events-auto toe om de klik te vangen
                               en stopPropagation om te voorkomen dat je per ongeluk de kaart sleept */
                            <a 
                                href={event.ticket_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="pointer-events-auto hover:underline decoration-violet-400 decoration-2 underline-offset-4"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                {event.title}
                            </a>
                        ) : (
                            event.title
                        )}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <Calendar size={16} className="text-violet-400" /> {date}
                    </div>
                    {event.venue_name && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <MapPin size={16} className="text-violet-400" /> {event.venue_name}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{event.event_type || 'Event'}</span>
                </div>
            </div>

            {/* BUTTONS ONDERAAN (Voor wie niet wil swipen) */}
            {isTopCard && (
                <div className="absolute bottom-6 left-0 w-full flex justify-center gap-6 z-20 px-6">
                    <button onClick={() => onSwipe('left')} className="w-14 h-14 bg-red-500/10 border border-red-500/50 text-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"><X size={24} /></button>
                    <button onClick={() => onSwipe('up')} className="w-12 h-12 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform mt-2"><Star size={20} /></button>
                    <button onClick={() => onSwipe('right')} className="w-14 h-14 bg-green-500/10 border border-green-500/50 text-green-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"><Check size={24} /></button>
                </div>
            )}
        </motion.div>
    )
}