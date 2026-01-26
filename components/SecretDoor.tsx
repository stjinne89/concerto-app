'use client'

import Link from 'next/link'
import { Lock, Unlock, Star } from 'lucide-react'

// Let op: we verwachten nu 'ratingsCount' als prop!
export default function SecretDoor({ ratingsCount }: { ratingsCount: number }) {
  const UNLOCK_THRESHOLD = 10 // Minimaal 10 ratings
  const isUnlocked = ratingsCount >= UNLOCK_THRESHOLD
  
  // Bereken percentage (max 100%)
  const progress = Math.min((ratingsCount / UNLOCK_THRESHOLD) * 100, 100)

  if (isUnlocked) {
    return (
      <Link href="/vault" className="block w-full group">
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 to-violet-600/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            
            <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Unlock size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">The Vault</h3>
                    <p className="text-xs text-amber-500/80">Toegang verleend. Bekijk je stats.</p>
                </div>
            </div>
            
            <div className="relative z-10 text-amber-400 font-black text-xl">→</div>
        </div>
      </Link>
    )
  }

  // De "Locked" staat
  return (
    <div className="relative overflow-hidden bg-slate-900/50 border border-slate-800 p-4 rounded-2xl opacity-75 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
        <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Lock size={20} />
            </div>
            <div>
                <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Vergrendeld</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                   <Star size={10} /> Nog {UNLOCK_THRESHOLD - ratingsCount} ratings nodig...
                </p>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                style={{ width: `${progress}%` }} 
            />
        </div>
    </div>
  )
}