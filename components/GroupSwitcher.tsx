'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Plus, Users, Globe, Copy, Check, Hash, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { joinGroupWithCode } from '@/app/actions' // Importeer de nieuwe actie

type Group = {
  id: string
  name: string
  invite_code: string
}

export default function GroupSwitcher({ groups }: { groups: Group[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // State voor het "join" formuliertje
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentGroupId = searchParams.get('group')
  const currentGroup = groups.find(g => g.id === currentGroupId)

  const handleSwitch = (groupId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (groupId) {
      params.set('group', groupId)
    } else {
      params.delete('group')
    }
    router.push(`/?${params.toString()}`)
    setIsOpen(false)
    setShowJoinInput(false) // Reset input
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
    <div className="relative mb-6 z-40">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-900 border border-white/10 p-4 rounded-2xl hover:bg-slate-800 transition-all group shadow-lg"
      >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${currentGroup ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {currentGroup ? <Users size={24} /> : <Globe size={24} />}
            </div>
            <div className="text-left">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                    Je zit nu in
                </span>
                <span className="block text-lg font-bold text-white">
                    {currentGroup ? currentGroup.name : 'de Concerto Agenda'}
                </span>
            </div>
        </div>
        <ChevronDown className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
            <div className="fixed inset-0 z-30" onClick={() => { setIsOpen(false); setShowJoinInput(false); }}/>
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-40 animate-in slide-in-from-top-2 fade-in">
                
                {/* 1. De Community */}
                <button 
                    onClick={() => handleSwitch(null)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left border-b border-white/5"
                >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                        <Globe size={16} />
                    </div>
                    <span className="font-bold text-slate-300 text-sm">De Concerto Community</span>
                    {!currentGroupId && <Check size={16} className="ml-auto text-emerald-400" />}
                </button>

                {/* 2. Jouw Groepen */}
                {groups.map(group => (
                    <button 
                        key={group.id}
                        onClick={() => handleSwitch(group.id)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left border-b border-white/5"
                    >
                        <div className="w-8 h-8 rounded-lg bg-violet-900/30 flex items-center justify-center text-violet-400">
                            <Users size={16} />
                        </div>
                        <span className="font-bold text-white text-sm">{group.name}</span>
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
                        // C. Het invoerveld (verschijnt als je op knop B klikt)
                        <form 
        action={async (formData) => {
            setJoinLoading(true)
            const result = await joinGroupWithCode(formData)
            if (result?.error) {
                alert(result.error) // Simpele foutmelding voor nu
                setJoinLoading(false)
            }
            // Als het goed gaat, redirect hij vanzelf
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
        </>
      )}

      {/* INVITE LINK BALK (Alleen als je in een groep zit) */}
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