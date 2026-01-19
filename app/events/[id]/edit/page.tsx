'use client'

import { updateEvent, getEvent, scrapeEventUrl } from '@/app/actions'
import { useState, useEffect, use } from 'react'
import { Link2, Loader2, Sparkles, Ticket, RefreshCw, Repeat, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  // Params uitpakken (Next.js 15 style)
  const { id } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [isFetching, setIsFetching] = useState(true)
  
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    description: '',
    start_at: '',
    type: 'concert',
    ticket_link: '',
    ticketswap_link: '',
    resale_link: ''
  })

  // 1. DATA OPHALEN
  useEffect(() => {
    const loadData = async () => {
      const { data, error } = await getEvent(id)
      if (data) {
        // Datum formatteren voor de input (yyyy-MM-ddThh:mm)
        const dateStr = data.start_at ? new Date(data.start_at).toISOString().slice(0, 16) : ''
        
        setFormData({
            title: data.title || '',
            venue: data.venue_name || '',
            description: data.description || '',
            start_at: dateStr,
            type: data.event_type || 'concert',
            ticket_link: data.ticket_link || '',
            ticketswap_link: data.ticketswap_link || '',
            resale_link: data.resale_link || ''
        })
      }
      setIsFetching(false)
    }
    loadData()
  }, [id])

  // 2. SCRAPER LOGICA
  const handleAutoFill = async () => {
    if (!scrapeUrl) return
    setLoading(true)
    const result = await scrapeEventUrl(scrapeUrl)
    if (result.success && result.data) {
      setFormData(prev => ({
        ...prev,
        title: result.data.title,
        venue: result.data.venue,
        description: result.data.description,
        start_at: result.data.start_at || prev.start_at,
        ticket_link: scrapeUrl 
      }))
    }
    setLoading(false)
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Laden...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 pb-24 selection:bg-violet-500/30">
      <div className="max-w-lg mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft size={14} /> Terug
          </Link>
          <h1 className="text-xl font-black tracking-tighter text-white">Bewerk Event</h1>
          <div className="w-12"></div>
        </header>
        
        {/* Scraper Balk - Nu in Dark Style */}
        <div className="bg-violet-500/10 border border-violet-500/20 p-5 rounded-[1.5rem] mb-8">
          <label className="block text-[10px] font-black text-violet-300 uppercase mb-3 flex items-center gap-2 tracking-widest">
            <Sparkles size={12} /> 
            Overschrijven met AI
          </label>
          <div className="flex gap-2">
            <input 
              type="url" 
              placeholder="Plak hier een link..." 
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              className="flex-1 bg-slate-950/50 border border-violet-500/30 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 placeholder:text-violet-500/30 transition-all"
            />
            <button 
              type="button"
              onClick={handleAutoFill}
              disabled={loading}
              className="bg-violet-600 text-white px-4 rounded-xl hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Link2 size={20} />}
            </button>
          </div>
        </div>

        <form action={updateEvent} className="space-y-6">
          
          <input type="hidden" name="event_id" value={id} />

          {/* Formulier Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">

            {/* TITEL & TYPE */}
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Titel</label>
                    <input 
                        name="title" required type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Type</label>
                    <select 
                        name="type" 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="concert" className="bg-slate-900">Concert</option>
                        <option value="festival" className="bg-slate-900">Festival</option>
                        <option value="listening_session" className="bg-slate-900">Luistersessie</option>
                        <option value="club_night" className="bg-slate-900">Club Night</option>
                        <option value="other" className="bg-slate-900">Anders</option>
                    </select>
                </div>
            </div>

            {/* DATUM & VENUE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Datum</label>
                    <input 
                        name="start_at" required type="datetime-local" 
                        value={formData.start_at} 
                        onChange={e => setFormData({...formData, start_at: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all [color-scheme:dark]"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Locatie</label>
                    <input 
                        name="venue" required type="text" 
                        value={formData.venue} 
                        onChange={e => setFormData({...formData, venue: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                </div>
            </div>

            {/* OMSCHRIJVING */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Info</label>
                <textarea 
                    name="description" rows={3} 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                />
            </div>

            {/* TICKET LINKS - Dark Mode style */}
            <div className="pt-6 border-t border-white/5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Ticket Links</h3>
                
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Ticket size={16} className="text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                    </div>
                    <input 
                        name="ticket_link" type="url" placeholder="Officiele Verkoop Link" 
                        value={formData.ticket_link} 
                        onChange={e => setFormData({...formData, ticket_link: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <RefreshCw size={16} className="text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                    </div>
                    <input 
                        name="resale_link" type="url" placeholder="Extra Resale" 
                        value={formData.resale_link} 
                        onChange={e => setFormData({...formData, resale_link: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                    />
                </div>
            </div>

          </div>

          {/* Actie Knoppen */}
          <div className="pt-4 flex flex-col gap-4">
            <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest py-5 rounded-[2rem] transition-all shadow-lg shadow-violet-900/20 active:scale-[0.98]"
            >
                Wijzigingen Opslaan
            </button>
            <Link href="/" className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors py-2">
                Annuleren
            </Link>
          </div>

        </form>
      </div>
    </main>
  )
}