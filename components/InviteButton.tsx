'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function InviteButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const url = window.location.origin
    navigator.clipboard.writeText(url)
    
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button 
      onClick={handleCopy}
      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-xl flex items-center gap-3 transition-all font-bold text-sm w-full justify-center group"
    >
      {copied ? <Check size={18} className="text-green-300" /> : <Copy size={18} />}
      {copied ? 'Link Gekopieerd!' : 'Kopieer Invite Link'}
    </button>
  )
}