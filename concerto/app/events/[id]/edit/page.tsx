'use client'

import { updateEvent, getEvent, scrapeEventUrl } from '@/app/actions'
import { useState, useEffect, use } from 'react'
import { Link2, Loader2, Sparkles, Ticket, RefreshCw, Repeat } from 'lucide-react'

// Dit is nodig om de ID uit de URL te lezen in Next.js
export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  // We ontpakken de params (Next.js 15 manier)
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

  // 1. DATA OPHALEN BIJ STARTEN
  useEffect(() => {
    const loadData = async () => {
      const { data, error } = await getEvent(id)
      if (data) {
        // Datum formatteren voor het input veld (yyyy-MM-ddThh:mm)
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

  // 2. SCRAPER (Handig als je data wilt verversen met een betere link)
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

  if (isFetching) return <div className="p-10 text-center">Laden...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold mb-6">Bewerk Activiteit</h1>
        
        {/* Scraper Balk */}
        <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
          <label className="block text-xs font-semibold text-indigo-800 uppercase mb-2 flex items-center gap-1">
            <Sparkles size={14} /> 
            Overschrijven met AI
          </label>
          <div className="flex gap-2">
            <input 
              type="url" 
              placeholder="Nieuwe link om te scrapen..." 
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              className="flex-1 text-sm rounded-md border border-indigo-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
            <button 
              type="button"
              onClick={handleAutoFill}
              disabled={loading}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Link2 size={18} />}
            </button>
          </div>
        </div>

        <form action={updateEvent} className="space-y-4">
          
          {/* BELANGRIJK: Het ID moet mee naar de server! */}
          <input type="hidden" name="event_id" value={id} />

          {/* TITEL & TYPE */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Titel</label>
                <input name="title" required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select name="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none">
                <option value="concert">Concert</option>
                <option value="festival">Festival</option>
                <option value="listening_session">Luistersessie</option>
                <option value="other">Anders</option>
                </select>
            </div>
          </div>

          {/* DATUM & VENUE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Datum</label>
                <input name="start_at" required type="datetime-local" value={formData.start_at} onChange={e => setFormData({...formData, start_at: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Locatie</label>
                <input name="venue" required type="text" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          {/* OMSCHRIJVING */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Info</label>
            <textarea name="description" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          {/* TICKET LINKS */}
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Ticket Links</h3>
            <div className="space-y-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Ticket size={16} className="text-gray-400" /></div>
                    <input name="ticket_link" type="url" placeholder="Officiele Verkoop Link" value={formData.ticket_link} onChange={e => setFormData({...formData, ticket_link: e.target.value})} className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Repeat size={16} className="text-gray-400" /></div>
                    <input name="ticketswap_link" type="url" placeholder="TicketSwap Link" value={formData.ticketswap_link} onChange={e => setFormData({...formData, ticketswap_link: e.target.value})} className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><RefreshCw size={16} className="text-gray-400" /></div>
                    <input name="resale_link" type="url" placeholder="Extra Resale" value={formData.resale_link} onChange={e => setFormData({...formData, resale_link: e.target.value})} className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <a href="/" className="flex-1 text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Annuleren</a>
            <button type="submit" className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Opslaan</button>
          </div>

        </form>
      </div>
    </div>
  )
}