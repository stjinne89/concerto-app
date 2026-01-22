'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:bg-violet-500 hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      aria-label="Terug naar boven"
    >
      <ArrowUp size={20} strokeWidth={3} />
    </button>
  )
}