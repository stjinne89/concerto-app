'use client'

import { useState } from 'react'
import { Camera, Music, Save, PenLine, ExternalLink } from 'lucide-react'
import { updateGroupProfile } from '@/app/actions'
import Image from 'next/image'

type Group = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  invite_code: string
  created_by: string
  spotify_playlist_url: string | null // <--- Nieuw veld
}

// Hulpfunctie om normale link om te zetten naar Embed link
const getSpotifyEmbedUrl = (url: string | null) => {
    if (!url) return null;
    try {
        const u = new URL(url);
        // Haal de ID uit de URL (werkt voor /playlist/ID en /album/ID)
        const pathParts = u.pathname.split('/');
        const type = pathParts[pathParts.length - 2]; // bijv 'playlist'
        const id = pathParts[pathParts.length - 1];   // de code
        
        if (type === 'playlist' || type === 'album') {
            return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
        }
    } catch (e) {
        return null;
    }
    return null;
}

export default function GroupHero({ group, currentUserId }: { group: Group, currentUserId: string }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const isOwner = currentUserId === group.created_by
  const embedUrl = getSpotifyEmbedUrl(group.spotify_playlist_url)

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-top-4">
      
      {/* --- GROEP KAART --- */}
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative group-card">
        
        {/* Achtergrond Banner (Wazig) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            {group.image_url ? (
                <Image 
                  src={group.image_url} 
                  alt="bg" 
                  fill 
                  sizes="100vw"
                  unoptimized
                  className="object-cover blur-xl scale-110" 
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900" />
            )}
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start z-10">
            
            {/* AVATAR */}
            <div className="shrink-0 relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-800 border-4 border-slate-950 shadow-xl overflow-hidden flex items-center justify-center relative">
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
                            {isOwner && (
                                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-500 hover:text-white bg-slate-950/50 rounded-lg backdrop-blur-sm transition-colors">
                                    <PenLine size={16} />
                                </button>
                            )}
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
                        
                        {/* Omschrijving Veld */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Omschrijving</label>
                            <input name="description" defaultValue={group.description || ''} placeholder="Waar staat deze groep voor?" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-violet-500" />
                        </div>

                        {/* Spotify Link Veld */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block flex justify-between">
                                <span>Spotify Playlist Link</span>
                                <a href="https://open.spotify.com" target="_blank" className="text-violet-400 hover:text-white flex items-center gap-1">Maak aan <ExternalLink size={10}/></a>
                            </label>
                            <input name="spotify_url" defaultValue={group.spotify_playlist_url || ''} placeholder="https://open.spotify.com/playlist/..." className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-green-500" />
                            <p className="text-[10px] text-slate-500 mt-1">
                                Tip: Maak een playlist op Spotify, zet hem op 'Samenwerken' en plak hier de link.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-white">
                                <Camera size={16} />
                                <span className="uppercase">Nieuwe foto</span>
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

        {/* --- MUZIEK PLAYLIST EMBED --- */}
        <div className="bg-slate-950/80 backdrop-blur-md border-t border-white/5 p-4 md:px-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                <Music size={14} className="text-green-500" /> Group Playlist
            </h3>

            {embedUrl ? (
                <div className="rounded-xl overflow-hidden shadow-lg border border-white/5">
                    <iframe 
                        src={embedUrl} 
                        width="100%" 
                        height="152" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                        className="bg-slate-900"
                    ></iframe>
                </div>
            ) : (
                <div className="text-center py-6 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                    <p className="text-sm text-slate-400 mb-2">Nog geen playlist gekoppeld.</p>
                    {isOwner && (
                        <button onClick={() => setIsEditing(true)} className="text-xs text-green-400 font-bold uppercase tracking-wider hover:text-green-300">
                            + Voeg Spotify Link toe
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}