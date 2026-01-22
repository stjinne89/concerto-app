'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ... (Types blijven hetzelfde, of we laten ze weg voor brevity als ze hierboven stonden, 
// maar voor de volledigheid hier de volledige code met nieuwe styling)

type Message = {
  id: string
  message: string
  created_at: string
  user_id: string
  profiles: {
    full_name: string
    avatar_url: string
  }
}

export default function EventChat({ eventId, currentUserId, hasUnread }: { eventId: string, currentUserId: string, hasUnread: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchMessages()
      const channel = supabase
        .channel(`event_chat:${eventId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_chats', filter: `event_id=eq.${eventId}` }, 
        (payload) => {
            fetchMessageById(payload.new.id)
        })
        .subscribe()

       // Update last_read_at als we openen
       updateLastRead()

       return () => { supabase.removeChannel(channel) }
    }
  }, [isOpen])

  useEffect(() => {
      if (isOpen) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }
  }, [messages, isOpen])

  const updateLastRead = async () => {
      await supabase.from('rsvps').update({ last_read_at: new Date().toISOString() })
        .eq('event_id', eventId).eq('user_id', currentUserId)
      router.refresh()
  }

  const fetchMessageById = async (id: string) => {
    const { data } = await supabase.from('event_chats').select('*, profiles(full_name, avatar_url)').eq('id', id).single()
    if (data) setMessages(prev => [...prev, data])
  }

  const fetchMessages = async () => {
    const { data } = await supabase.from('event_chats').select('*, profiles(full_name, avatar_url)').eq('event_id', eventId).order('created_at', { ascending: true })
    if (data) setMessages(data)
    setLoading(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const msg = newMessage
    setNewMessage('') // Optimistic clear

    await supabase.from('event_chats').insert({
      event_id: eventId,
      user_id: currentUserId,
      message: msg
    })
    
    // Update timestamp van event voor notificaties
    await supabase.from('events').update({ last_message_at: new Date().toISOString() }).eq('id', eventId)
  }

  return (
    <div className="mt-4">
      {!isOpen ? (
        // AANGEPAST: Rustigere styling (Dark mode friendly)
        <button 
            onClick={() => setIsOpen(true)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold bg-slate-800 text-slate-300 border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all group relative"
        >
            <MessageCircle size={18} className={hasUnread ? "text-white" : "text-slate-500 group-hover:text-white"} />
            <span>Praat mee</span>
            
            {hasUnread && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
            )}
        </button>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chat</span>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
                {loading ? <div className="text-center text-xs text-slate-600 mt-10">Laden...</div> : 
                 messages.length === 0 ? <div className="text-center text-xs text-slate-600 mt-10">Nog geen berichten.</div> :
                 messages.map(msg => {
                     const isMe = msg.user_id === currentUserId
                     return (
                         <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                             <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10 mt-1">
                                 {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover"/> : null}
                             </div>
                             <div className={`max-w-[80%] rounded-xl p-2.5 text-sm ${isMe ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>
                                 <div className="font-bold text-[9px] opacity-50 mb-0.5">{msg.profiles?.full_name?.split(' ')[0]}</div>
                                 {msg.message}
                             </div>
                         </div>
                     )
                 })
                }
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-2 flex gap-2 bg-white/5 border-t border-white/10">
                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Typ een bericht..."
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors">
                    <Send size={16} />
                </button>
            </form>
        </div>
      )}
    </div>
  )
}