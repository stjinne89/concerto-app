'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Plus, Users, Check, Hash, ArrowRight, Loader2, Copy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image' // <--- Belangrijk!
import { joinGroupWithCode } from '@/app/actions'

type Group = {
  id: string
  name: string
  invite_code: string
  image_url?: string | null
}

export default function GroupSwitcher({ groups }: { groups: Group[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // State voor het "join" formuliertje
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const currentGroupId = searchParams.get('group')
  const currentGroup = groups.find(g => g.id === currentGroupId)

  // Sluit dropdown als je ernaast klikt
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false); setShowJoinInput(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleSwitch = (groupId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (groupId) {
      params.set('group', groupId)
    } else {
      params.delete('group')
    }
    router.push(`/?${params.toString()}`)
    setIsOpen(false)
    setShowJoinInput(false)
  }

  const copyInvite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentGroup) return
    const link = `${window.location.origin}/join/${currentGroup.invite_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="relative mb-6 z-40" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-900 border border-white/10 p-4 rounded-2xl hover:bg-slate-800 transition-all group shadow-lg"
      >
        <div className="flex items-center gap-4">
            {/* HOOFD ICOON / LOGO */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-white/10 relative ${currentGroup ? 'bg-slate-800' : 'bg-slate-950'}`}>
                {currentGroup ? (
                    currentGroup.image_url ? (
                        <Image src={currentGroup.image_url} alt={currentGroup.name} fill className="object-cover" />
                    ) : (
                        <Users size={24} className="text-violet-400" />
                    )
                ) : (
                    // HIER ZIT DE WIJZIGING: LOGO PLAATSEN
                    <Image src="/concerto_logo.png" alt="Concerto" fill className="object-cover" />
                )}
            </div>
            
            <div className="text-left flex-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                    Je zit nu in
                </span>
                <span className="block text-lg font-bold text-white truncate">
                    {currentGroup ? currentGroup.name : 'de Concerto Agenda'}
                </span>
            </div>
        </div>
        <ChevronDown className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-40 animate-in slide-in-from-top-2 fade-in">
            
            {/* 1. De Community (Algemeen) */}
            <button 
                onClick={() => handleSwitch(null)}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left border-b border-white/5"
            >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 relative border border-white/10">
                    {/* HIER OOK HET LOGO */}
                    <Image src="/concerto_logo.png" alt="Concerto" fill className="object-cover" />
                </div>
                <span className="font-bold text-slate-300 text-sm">De Concerto Agenda</span>
                {!currentGroupId && <Check size={16} className="ml-auto text-emerald-400" />}
            </button>

            {/* 2. Jouw Groepen */}
            {groups.map(group => (
                <button 
                    key={group.id}
                    onClick={() => handleSwitch(group.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left border-b border-white/5"
                >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative border border-white/5">
                        {group.image_url ? (
                            <Image src={group.image_url} alt={group.name} fill className="object-cover" />
                        ) : (
                            <Users size={16} className="text-violet-400" />
                        )}
                    </div>
                    <span className="font-bold text-white text-sm truncate">{group.name}</span>
                    {currentGroupId === group.id && <Check size={16} className="ml-auto text-emerald-400" />}
                </button>
            ))}

            {/* 3. Acties (Nieuw & Join) */}
            <div className="bg-violet-600/5 p-2 space-y-2">
                
                {/* A. Nieuwe Groep Aanmaken */}
                <Link 
                    href="/groups/new"
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-600 hover:text-white text-violet-400 transition-colors text-left"
                >
                    <Plus size={18} />
                    <span className="font-bold text-sm">Nieuwe Groep starten</span>
                </Link>

                {/* B. Lid worden met code */}
                {!showJoinInput ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowJoinInput(true); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-left"
                    >
                        <Hash size={18} />
                        <span className="font-bold text-sm">Heb je een invite code?</span>
                    </button>
                ) : (
                    // C. Het invoerveld (Jouw bestaande logica)
                    <form 
                        action={async (formData) => {
                            setJoinLoading(true)
                            const result = await joinGroupWithCode(formData)
                            if (result?.error) {
                                alert(result.error) 
                                setJoinLoading(false)
                            }
                        }} 
                        className="p-2"
                    >
                        <div className="flex gap-2">
                            <input 
                                name="code"
                                autoFocus
                                placeholder="Plak code hier..."
                                className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                            />
                            <button 
                                type="submit"
                                disabled={joinLoading}
                                className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-3 flex items-center justify-center disabled:opacity-50"
                            >
                                {joinLoading ? <Loader2 size={16} className="animate-spin"/> : <ArrowRight size={16} />}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}

      {/* INVITE LINK BALK */}
      {currentGroup && (
          <div className="mt-2 flex items-center justify-between px-2 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <span className="text-[10px] text-violet-300 font-bold uppercase tracking-wide ml-1">
                  Invite Code: <span className="text-white select-all">{currentGroup.invite_code}</span>
              </span>
              <button 
                onClick={copyInvite}
                className="flex items-center gap-1 text-[10px] bg-violet-600 text-white px-2 py-1 rounded hover:bg-violet-500 transition-colors font-bold"
              >
                 {copied ? <Check size={10} /> : <Copy size={10} />}
                 {copied ? 'Gekopieerd' : 'Link'}
              </button>
          </div>
      )}
    </div>
  )
}