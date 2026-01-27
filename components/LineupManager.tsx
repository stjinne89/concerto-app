'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, Music, CalendarDays } from 'lucide-react'

// Type definitie voor een Act
type Performance = {
  id: string
  artist_name: string
  // start_time halen we weg uit de UI, mag in DB blijven bestaan
}

export default function LineupManager({ eventId, initialPerformances }: { eventId: string, initialPerformances: Performance[] }) {
  const [performances, setPerformances] = useState<Performance[]>(initialPerformances)
  const [artistName, setArtistName] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const addPerformance = async () => {
    if (!artistName.trim()) return
    setLoading(true)

    const newAct = {
        event_id: eventId,
        artist_name: artistName,
        // We sturen geen tijd meer mee
    }

    const { data, error } = await supabase
      .from('performances')
      .insert(newAct)
      .select()
      .single()

    if (data) {
      setPerformances([...performances, data])
      setArtistName('')
    } else {
        console.error(error)
    }
    setLoading(false)
  }

  const removePerformance = async (id: string) => {
      const original = [...performances]
      setPerformances(performances.filter(p => p.id !== id))

      const { error } = await supabase.from('performances').delete().eq('id', id)
      
      if (error) {
          setPerformances(original)
          alert("Kon act niet verwijderen.")
      }
  }

  return (
    <div className="mt-8 bg-white/5 border border-white/5 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Music className="text-violet-400" /> Line-up
      </h3>

      {/* --- INVOERVELDEN (Versimpeld) --- */}
      <div className="flex gap-2 mb-6">
        <input 
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="Artiest / Band naam toevoegen..."
          className="flex-grow bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && addPerformance()}
        />
        
        <button 
          onClick={addPerformance}
          disabled={loading || !artistName}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 rounded-xl transition-all font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center justify-center"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* --- LIJST WEERGAVE --- */}
      <div className="space-y-2">
        {performances.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5 group hover:border-violet-500/30 transition-colors">
             <div className="flex items-center gap-4">
                {/* Avatar Placeholder met Initialen */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-violet-300 font-black text-sm shadow-inner">
                    {p.artist_name.substring(0,2).toUpperCase()}
                </div>
                
                <span className="font-bold text-slate-200 block">{p.artist_name}</span>
             </div>

             <button 
                onClick={() => removePerformance(p.id)}
                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Verwijder act"
             >
                <Trash2 size={18} />
             </button>
          </div>
        ))}

        {performances.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl">
                <CalendarDays className="mx-auto text-slate-600 mb-2 opacity-50" />
                <p className="text-slate-500 text-sm italic">Nog geen acts toegevoegd.</p>
            </div>
        )}
      </div>
    </div>
  )
}