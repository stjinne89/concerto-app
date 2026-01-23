'use client'

import { useState } from 'react'
import { Camera, Music, Save, PenLine, Link as LinkIcon, Play } from 'lucide-react'
import { updateGroupProfile, addMusic } from '@/app/actions'
import Image from 'next/image'

type Group = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  invite_code: string
}

type Track = {
  id: string
  url: string
  created_at: string
}

export default function GroupHero({ group, musicTracks }: { group: Group, musicTracks: Track[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showMusicInput, setShowMusicInput] = useState(false)

  // Hulpje om Spotify link om te zetten naar een embed
  const getEmbedUrl = (url: string) => {
      try {
        const u = new URL(url)
        if (u.pathname.includes('/track/') || u.pathname.includes('/playlist/') || u.pathname.includes('/album/')) {
            return `https://open.spotify.com/embed${u.pathname}`
        }
      } catch (e) {}
      return null
  }

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-top-4">
      
      {/* --- GROEP KAART --- */}
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative group">
        
        {/* Achtergrond Banner (Wazig) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            {group.image_url ? (
                <Image 
                  src={group.image_url} 
                  alt="bg" 
                  fill 
                  sizes="100vw"
                  className="object-cover blur-xl scale-110" 
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900" />
            )}
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start z-10">
            
            {/* AVATAR */}
            <div className="shrink-0 relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-800 border-4 border-slate-950 shadow-xl overflow-hidden flex items-center justify-center">
                    {group.image_url ? (
                        <Image 
                          src={group.image_url} 
                          alt={group.name} 
                          fill 
                          sizes="(max-width: 768px) 96px, 128px"
                          className="object-cover" 
                        />
                    ) : (
                        <span className="text-4xl">🎸</span>
                    )}
                </div>
            </div>

            {/* TEKST & INFO */}
            <div className="flex-1 w-full">
                {!isEditing ? (
                    <>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-black text-white tracking-tight mb-2">{group.name}</h1>
                            <button onClick={() => setIsEditing(true)} className="p-2 text-slate-500 hover:text-white bg-slate-950/50 rounded-lg backdrop-blur-sm transition-colors">
                                <PenLine size={16} />
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl mb-4">
                            {group.description || "Nog geen omschrijving. Klik op het potloodje om er een toe te voegen!"}
                        </p>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider">
                            Code: <span className="text-white ml-2 select-all">{group.invite_code}</span>
                        </div>
                    </>
                ) : (
                    /* BEWERK MODUS */
                    <form action={async (formData) => { await updateGroupProfile(group.id, formData); setIsEditing(false); }} className="space-y-4 bg-slate-950/50 p-4 rounded-xl backdrop-blur-md border border-white/5">
                        <input name="description" defaultValue={group.description || ''} placeholder="Waar staat deze groep voor?" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-violet-500" />
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-white">
                                <Camera size={16} />
                                <span className="uppercase">Kies nieuwe foto</span>
                                <input name="image" type="file" accept="image/*" className="hidden" />
                            </label>
                            <button type="submit" className="ml-auto bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                                <Save size={14} /> Opslaan
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>

        {/* --- MUZIEK SECTIE (Onderaan de kaart) --- */}
        <div className="bg-slate-950/80 backdrop-blur-md border-t border-white/5 p-4 md:px-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Music size={14} className="text-green-500" /> Gedeelde Muziek
                </h3>
                <button onClick={() => setShowMusicInput(!showMusicInput)} className="text-xs text-violet-400 hover:text-white font-bold transition-colors">
                    {showMusicInput ? 'Annuleren' : '+ Toevoegen'}
                </button>
            </div>

            {showMusicInput && (
                <form action={async (formData) => { await addMusic(formData); setShowMusicInput(false); }} className="mb-4 flex gap-2">
                    <input type="hidden" name="group_id" value={group.id} />
                    <input name="url" placeholder="Plak een Spotify link..." className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
                    <button type="submit" className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-3 py-2 transition-colors">
                        <Play size={16} fill="currentColor" />
                    </button>
                </form>
            )}

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {musicTracks.length === 0 && <span className="text-xs text-slate-600 italic">Nog geen nummers gedeeld.</span>}
                
                {musicTracks.map(track => {
                    const embedUrl = getEmbedUrl(track.url)
                    return (
                        <div key={track.id} className="snap-start shrink-0 w-64 md:w-80 bg-slate-900 rounded-xl overflow-hidden border border-white/5 shadow-lg">
                           {embedUrl ? (
                               <iframe style={{borderRadius: 12}} src={embedUrl} width="100%" height="80" frameBorder="0" allow="encrypted-media"></iframe>
                           ) : (
                               <a href={track.url} target="_blank" className="block p-4 text-xs text-green-400 truncate hover:underline flex items-center gap-2">
                                   <LinkIcon size={12} /> {track.url}
                               </a>
                           )}
                        </div>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  )
}