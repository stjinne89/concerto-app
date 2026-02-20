'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'
import { markAsRead } from '@/app/actions'
import GamifiedAvatar from '@/components/GamifiedAvatar'

type Message = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
    // We voegen de stats toe voor de gekleurde randjes!
    xp_points?: number
    events_created?: number
    messages_count?: number
  }
}

export default function EventChat({ eventId, currentUserId, hasUnread }: { eventId: string, currentUserId: string, hasUnread: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  
  const supabase = createClient()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current
        scrollContainerRef.current.scrollTop = scrollHeight - clientHeight
    }
  }

  const fetchMessages = async () => {
    setLoading(true)
    // LET OP: We gebruiken nu 'event_chats' (meervoud) en halen extra stats op
    const { data } = await supabase
      .from('event_chats')
      .select('*, profiles(full_name, avatar_url, xp_points, events_created, messages_count)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (data) {
        setMessages(data as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isOpen) return

    fetchMessages()

    if (hasUnread) {
        markAsRead(eventId)
    }

    const channel = supabase
      .channel(`chat:${eventId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'event_chats', // Meervoud!
        filter: `event_id=eq.${eventId}`
      }, async (payload) => {
         // Als er een nieuw bericht binnenkomt, halen we ook direct de stats op van die persoon
         const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, xp_points, events_created, messages_count')
            .eq('id', payload.new.user_id)
            .single()
         
         const newMsg = {
             ...payload.new,
             profiles: userData
         } as Message

         setMessages(prev => [...prev, newMsg])
         
         if (isOpen) markAsRead(eventId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, eventId])

  useEffect(() => {
    if (isOpen) {
        setTimeout(scrollToBottom, 100)
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    const text = newMessage
    setNewMessage('') 
    
    // Opslaan in de juiste tabel
    await supabase.from('event_chats').insert({
      event_id: eventId,
      user_id: currentUserId,
      content: text
    })
    
    await supabase
        .from('events')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', eventId)
        
    setSending(false)
  }

  if (!isOpen) {
    return (
      <button 
        type="button"
        onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            setIsOpen(true); 
        }}
        className={`mt-4 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            hasUnread 
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20 hover:bg-violet-500 animate-pulse' 
            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
        }`}
      >
        <MessageCircle size={16} />
        {hasUnread ? 'Nieuwe berichten' : 'Praat mee'}
      </button>
    )
  }

  return (
    <div className="mt-4 bg-slate-950 border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      
      <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <MessageCircle size={14} /> Chat
        </span>
        <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div 
        ref={scrollContainerRef} 
        className="h-64 overflow-y-auto p-4 space-y-4 bg-slate-900/50 scroll-smooth"
      >
        {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
                <Loader2 className="animate-spin" />
            </div>
        ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-600 italic">
                Nog geen berichten. Wees de eerste!
            </div>
        ) : (
            messages.map(msg => {
                const isMe = msg.user_id === currentUserId
                return (
                    <div key={msg.id} className={`flex gap-3 items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                         
                         {/* HIER IS DE NIEUWE AVATAR! */}
                         <div className="shrink-0 mb-1">
                            <GamifiedAvatar 
    profile={msg.profiles}
    size="sm"
/>
                         </div>

                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isMe 
                            ? 'bg-violet-600 text-white rounded-br-none' 
                            : 'bg-slate-800 text-slate-300 rounded-bl-none border border-white/5'
                        }`}>
                            <span className="text-[9px] font-bold opacity-50 block mb-0.5">
                                {msg.profiles?.full_name?.split(' ')[0] || 'Onbekend'}
                            </span>
                            <p>{msg.content}</p>
                            <span className="text-[9px] opacity-40 block mt-1 text-right">
                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                )
            })
        )}
      </div>

      <form onSubmit={handleSend} className="p-2 bg-slate-950 border-t border-white/5 flex gap-2">
        <input 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Typ een bericht..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors"
        >
            {sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
        </button>
      </form>
    </div>
  )
}