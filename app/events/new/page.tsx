'use client'

import { createEvent, scrapeEventUrl, getGroupName } from '@/app/actions'
import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link2, Loader2, Sparkles, Ticket, RefreshCw, Repeat, ArrowLeft, X, MessageCircle } from 'lucide-react'
import Link from 'next/link'

function NewEventForm() {
  const searchParams = useSearchParams()
  const groupId = searchParams.get('group')

  const [loading, setLoading] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [groupName, setGroupName] = useState<string | null>(null)
  
  useEffect(() => {
    if (groupId) {
        getGroupName(groupId).then(name => setGroupName(name))
    }
  }, [groupId])

  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    description: '',
    start_at: '',
    end_at: '',
    type: 'Concert',
    ticket_link: '',
    ticketswap_link: '',
    resale_link: '',
    chat_link: '',
    image_url: '' 
  })

  // --- SLIMME DATUM FUNCTIE ---
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value
    let newEnd = formData.end_at

    // Als er nog geen eindtijd is, OF de eindtijd staat vroeger dan de nieuwe starttijd:
    // Zet de eindtijd automatisch op Starttijd + 3 uur
    if (newStart && (!newEnd || newEnd < newStart)) {
        const date = new Date(newStart)
        date.setHours(date.getHours() + 3)
        
        // Trucje om lokale tijd te behouden in ISO formaat (YYYY-MM-DDTHH:mm)
        // Anders pakt toISOString() de UTC tijd (-1 of -2 uur)
        newEnd = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16)
    }

    setFormData(prev => ({ ...prev, start_at: newStart, end_at: newEnd }))
  }

  const handleAutoFill = async () => {
    if (!scrapeUrl) return
    setLoading(true)
    
    try {
      const result = await scrapeEventUrl(scrapeUrl)
      
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          title: result.data.title || prev.title,
          venue: result.data.venue || prev.venue,
          description: result.data.description || prev.description,
          start_at: result.data.start_at || prev.start_at,
          image_url: result.data.image_url || prev.image_url,
          ticket_link: scrapeUrl
        }))
      }
    } catch (error) {
      console.error("Scrape error", error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await createEvent({
        ...formData,
        group_id: groupId || null
    })
  }

  return (
      <div className="w-full max-w-md">
        <Link 
            href={groupId ? `/?group=${groupId}` : "/"} 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Terug
        </Link>

        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-6 mx-auto">
                <Sparkles size={32} />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2 text-center">Nieuw Event</h1>
            
            <p className="text-slate-500 mb-8 text-center text-sm">
                {groupId 
                    ? (
                        groupName 
                        ? <span>Toevoegen aan <strong className="text-violet-400">{groupName}</strong></span>
                        : <span>Toevoegen aan de groep...</span>
                      )
                    : "Toevoegen aan de Community"
                }
            </p>

            <div className="mb-8 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Link2 size={16} className="text-slate-500" />
                </div>
                <input 
                    type="url" 
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="Plak een link (Ticketmaster, Paradiso...)" 
                    className="w-full bg-slate-950 border border-violet-500/30 rounded-2xl pl-11 pr-12 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
                />
                <button 
                    onClick={handleAutoFill}
                    disabled={loading || !scrapeUrl}
                    type="button"
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-violet-600 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-violet-600"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </button>
            </div>

            {formData.image_url && (
                <div className="mb-8 relative h-48 w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg group animate-in fade-in slide-in-from-top-4">
                    <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                    />
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, image_url: ''})}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Wat?</label>
                    <input 
                        name="title" required placeholder="Naam van event / artiest" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all font-medium"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Start</label>
                        <input 
                            name="start_at" 
                            type="datetime-local" 
                            required 
                            value={formData.start_at}
                            onChange={handleStartChange} // <--- HIER ROEPEN WE DE NIEUWE FUNCTIE AAN
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Einde <span className="opacity-50">(Optioneel)</span></label>
                        <input 
                            name="end_at" 
                            type="datetime-local" 
                            value={formData.end_at}
                            min={formData.start_at} // Zorgt dat je niet in het verleden kan eindigen
                            onChange={e => setFormData({...formData, end_at: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Type</label>
                    <select 
                        name="type" 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all appearance-none"
                    >
                        <option value="Concert" className="bg-slate-900">Concert</option>
                        <option value="Festival" className="bg-slate-900">Festival</option>
                        <option value="Club / Nacht" className="bg-slate-900">Club / Nacht</option>
                        <option value="Theater" className="bg-slate-900">Theater</option>
                        <option value="Sport" className="bg-slate-900">Sport</option>
                        <option value="Overig" className="bg-slate-900">Overig</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Waar?</label>
                    <input 
                        name="venue" required placeholder="Locatie (bijv. Paradiso)" 
                        value={formData.venue}
                        onChange={e => setFormData({...formData, venue: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                    />
                </div>

                <div className="space-y-3 pt-2">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Ticket size={16} className="text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                        </div>
                        <input 
                            name="ticket_link" type="url" placeholder="Officiële Tickets" 
                            value={formData.ticket_link}
                            onChange={e => setFormData({...formData, ticket_link: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Repeat size={16} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input 
                            name="ticketswap_link" type="url" placeholder="TicketSwap Link" 
                            value={formData.ticketswap_link}
                            onChange={e => setFormData({...formData, ticketswap_link: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <RefreshCw size={16} className="text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                        </div>
                        <input 
                            name="resale_link" type="url" placeholder="Extra Resale" 
                            value={formData.resale_link}
                            onChange={e => setFormData({...formData, resale_link: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                        />
                    </div>

                     <div className="relative group">
                         <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <MessageCircle size={16} className="text-slate-500 group-focus-within:text-green-400 transition-colors" />
                        </div>
                        <input 
                            name="chat_link" type="url" placeholder="WhatsApp / Groep Link" 
                            value={formData.chat_link}
                            onChange={e => setFormData({...formData, chat_link: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest py-5 rounded-[2rem] transition-all shadow-lg shadow-violet-900/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Event Aanmaken'}
                    </button>
                    <Link href="/" className="text-center text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">
                        Annuleren
                    </Link>
                </div>
            </form>
        </div>
      </div>
  )
}

export default function NewEventPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center justify-center">
      <Suspense fallback={<div className="text-white">Laden...</div>}>
        <NewEventForm />
      </Suspense>
    </main>
  )
}