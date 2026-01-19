'use client'

import { useState } from 'react'

export default function AttendeeList({ rsvps }: { rsvps: any[] }) {
  const [isOpen, setIsOpen] = useState(false)

  // AANGEPAST: Filters matchen nu de database waarden 'going' en 'interested'
  const going = rsvps.filter(r => r.status === 'going')
  const interested = rsvps.filter(r => r.status === 'interested')
  
  if (going.length === 0 && interested.length === 0) {
    return <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">0 gaan</span>
  }

  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.preventDefault(); // Voorkom dat andere acties getriggerd worden
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 group/btn"
      >
        <div className="flex -space-x-2">
          {going.slice(0, 2).map((r, i) => (
            <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-900 bg-violet-500 flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
              {r.profiles?.full_name?.charAt(0) || '?'}
            </div>
          ))}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover/btn:text-violet-400 transition-colors">
          {going.length} gaan • {interested.length} geïnteresseerd {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* De Dropdown Lijst */}
      {isOpen && (
        <div className="absolute bottom-full mb-3 left-0 w-56 z-50 bg-slate-900/95 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="space-y-2.5">
            {rsvps.map((rsvp: any, i: number) => {
              // AANGEPAST: Check op 'interested' ipv 'maybe'
              if (rsvp.status !== 'going' && rsvp.status !== 'interested') return null
              
              const isGoing = rsvp.status === 'going'
              
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                    isGoing ? 'bg-emerald-400 shadow-emerald-400/40' : 'bg-amber-400 shadow-amber-400/40'
                  }`} />
                  <span className={`text-xs font-semibold ${isGoing ? 'text-slate-100' : 'text-slate-400'}`}>
                    {rsvp.profiles?.full_name || 'Anoniem'}
                  </span>
                  <span className="ml-auto text-[9px] font-black uppercase tracking-tighter text-slate-600">
                    {isGoing ? 'Gaat' : 'Interesse'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}