'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, MessageCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

type NotificationDropdownProps = {
  profile: any
  events: any[]
  currentUserId: string
}

export default function NotificationDropdown({ profile, events, currentUserId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sluit dropdown als je ernaast klikt
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Bereken notificaties
  const notifications = events.flatMap(event => {
    const myRsvp = event.rsvps?.find((r: any) => r.user_id === currentUserId)
    const lastRead = myRsvp?.last_read_at ? new Date(myRsvp.last_read_at) : new Date(0)
    const lastMessage = event.last_message_at ? new Date(event.last_message_at) : null
    
    const list = []

    // 1. Chat notificatie (Rood)
    if (lastMessage && lastMessage > lastRead) {
        list.push({
            type: 'chat',
            event_id: event.id,
            title: event.title,
            text: 'Nieuwe berichten',
            date: lastMessage
        })
    }

    // 2. Nieuw Event notificatie (Groen)
    // (< 3 dagen oud en geen RSVP)
    const createdAt = new Date(event.created_at)
    const threeDaysAgo = new Date(Date.now() - (72 * 60 * 60 * 1000))
    if (createdAt > threeDaysAgo && !myRsvp?.status) {
        list.push({
            type: 'new',
            event_id: event.id,
            title: event.title,
            text: 'Nieuw event!',
            date: createdAt
        })
    }
    return list
  }).sort((a, b) => b.date.getTime() - a.date.getTime())

  // Tellers splitsen
  const chatCount = notifications.filter(n => n.type === 'chat').length
  const newEventCount = notifications.filter(n => n.type === 'new').length

  return (
    <div className="relative" ref={dropdownRef}>
        <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex items-center gap-3 pl-4 py-1 pr-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group"
        >
            {/* NOTIFICATIE BOLLETJES (Naast elkaar) */}
            <div className="absolute -top-1 -right-1 flex gap-1 z-10">
                {newEventCount > 0 && (
                    <div className="bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse border border-slate-900">
                        {newEventCount}
                    </div>
                )}
                {chatCount > 0 && (
                    <div className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse border border-slate-900">
                        {chatCount}
                    </div>
                )}
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors hidden sm:block">
                {profile?.full_name?.split(' ')[0] || 'Profiel'}
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-white/10 group-hover:border-violet-500/50 transition-colors">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {profile?.full_name?.charAt(0) || '?'}
                    </div>
                )}
            </div>
        </button>

        {isOpen && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-white/5 bg-slate-950 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Meldingen</h3>
                    {(chatCount > 0 || newEventCount > 0) && (
                        <span className="text-[10px] text-slate-500">
                            {newEventCount > 0 && <span className="text-emerald-400 mr-2">{newEventCount} nieuw</span>}
                            {chatCount > 0 && <span className="text-red-400">{chatCount} chat</span>}
                        </span>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">
                            <Bell className="w-6 h-6 mx-auto mb-2 opacity-20" />
                            Geen nieuwe meldingen
                        </div>
                    ) : (
                        notifications.map((notif, i) => (
                            <Link 
                                key={i} 
                                href={`#event-${notif.event_id}`} 
                                onClick={() => setIsOpen(false)}
                                className="block p-4 hover:bg-white/5 border-b border-white/5 transition-colors"
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.type === 'chat' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                    <div>
                                        <div className="text-sm font-bold text-white mb-0.5">{notif.title}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                            {notif.type === 'chat' ? (
                                                <><MessageCircle size={10} className="text-red-400" /> {notif.text}</>
                                            ) : (
                                                <><Calendar size={10} className="text-emerald-400" /> {notif.text}</>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                <Link href="/profile" onClick={() => setIsOpen(false)} className="block p-3 text-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5">
                    Ga naar profiel →
                </Link>
            </div>
        )}
    </div>
  )
}