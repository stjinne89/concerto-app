'use client'

import { createClient } from '@/utils/supabase/client'
// Zorg dat markChatAsRead in je actions.ts staat!
import { sendMessage, markChatAsRead } from '@/app/actions'
import { useEffect, useState, useRef } from 'react'
import { Send, MessageCircle } from 'lucide-react'

type Message = {
  id: string
  content: string
  user_id: string
  created_at: string
  profiles: { full_name: string | null, email: string } | null
}

// 1. Hier voegen we 'hasUnread' toe aan de props
export default function EventChat({ eventId, currentUserId, hasUnread }: { eventId: string, currentUserId: string, hasUnread: boolean }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 2. Als de chat opent én er zijn ongelezen berichten -> Markeer als gelezen
  useEffect(() => {
    if (isOpen && hasUnread) {
        // We roepen de server action aan. 
        // Door revalidatePath in de action zal de pagina verversen en 'hasUnread' false worden.
        markChatAsRead(eventId).catch(console.error)
    }
  }, [isOpen, hasUnread, eventId])

  useEffect(() => {
    if (!isOpen) return
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(full_name, email)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as any)
    }
    fetchMessages()
    
    const channel = supabase
      .channel(`chat-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `event_id=eq.${eventId}` }, 
      (payload) => {
        // Alleen nieuwe berichten toevoegen als ze niet van jezelf zijn (optimistic update vangt eigen berichten al af)
        if (payload.new.user_id !== currentUserId) {
            const fetchNewMsg = async () => {
                const { data } = await supabase.from('messages').select('*, profiles(full_name, email)').eq('id', payload.new.id).single()
                if (data) setMessages((prev) => [...prev, data as any])
            }
            fetchNewMsg()
        }
      })
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [eventId, isOpen, supabase, currentUserId])

  // Scroll naar beneden bij nieuw bericht
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input
    setInput('') 
    
    // Optimistic UI update
    const optimisticMsg: Message = {
        id: Math.random().toString(), content: text, user_id: currentUserId, created_at: new Date().toISOString(),
        profiles: { full_name: 'Ik', email: 'ik' } 
    }
    setMessages((prev) => [...prev, optimisticMsg])
    
    await sendMessage(eventId, text)
  }

  const getDisplayName = (profile: Message['profiles']) => {
      if (!profile) return 'Onbekend'
      if (profile.full_name) return profile.full_name
      return profile.email.split('@')[0]
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-violet-600 font-bold py-2 w-full bg-slate-50 rounded-xl transition-colors group"
        >
          <div className="relative">
            <MessageCircle size={18} />
            
            {/* 3. HET RODE BOLLETJE (Alleen als hasUnread true is) */}
            {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 animate-pulse"></span>
            )}
          </div>
          
          Praat mee 
          {messages.length > 0 && !hasUnread && (
            <span className="text-xs bg-slate-200 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700 px-1.5 py-0.5 rounded-full transition-colors">
                {messages.length}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="bg-slate-50 rounded-2xl p-3 mt-2 ring-1 ring-slate-100">
           <div className="flex justify-between items-center mb-2 px-1">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Community Chat</h4>
             <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-medium py-1 px-2">Sluiten</button>
           </div>
          
          <div ref={scrollRef} className="h-56 overflow-y-auto space-y-3 mb-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {messages.length === 0 && <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Nog stilletjes hier... zeg hoi!</div>}
            
            {messages.map((msg) => {
              const isMe = msg.user_id === currentUserId
              const displayName = isMe ? 'Jij' : getDisplayName(msg.profiles)
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 mb-1 px-2 font-semibold">
                    {displayName}
                  </span>
                  
                  <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed ${
                    isMe 
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none font-medium'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Typ een bericht..."
              className="flex-1 text-sm bg-transparent rounded-full px-3 py-2 focus:outline-none text-slate-700 placeholder:text-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-violet-600 text-white p-2 rounded-full hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:hover:bg-violet-600"
            >
              <Send size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}