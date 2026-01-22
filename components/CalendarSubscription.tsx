'use client'

import { Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CalendarSubscription({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false)
  const [feedUrl, setFeedUrl] = useState('')

  // We gebruiken useEffect om de URL pas op te halen als de browser geladen is.
  // Dit voorkomt de "window is not defined" error op de server.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFeedUrl(`${window.location.origin}/api/calendar/${userId}`)
    }
  }, [userId])

  const copyToClipboard = () => {
    if (!feedUrl) return
    navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl mb-8">
      <h3 className="text-white font-bold text-lg mb-1">📅 Agenda Abonnement</h3>
      <p className="text-slate-400 text-xs mb-4">
        Voeg deze link toe aan Google/Apple Calendar. Events waar je op <span className="text-emerald-400 font-bold">"Gaat"</span> staat verschijnen dan vanzelf.
      </p>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={feedUrl} 
          readOnly 
          placeholder="Laden..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs text-slate-500 focus:outline-none"
        />
        <button 
          onClick={copyToClipboard}
          disabled={!feedUrl}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Gekopieerd!' : 'Kopieer'}
        </button>
      </div>
    </div>
  )
}