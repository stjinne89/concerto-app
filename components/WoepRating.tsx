'use client'

import { useState } from 'react'

interface RatingProps {
  value: number
  onChange: (value: number) => void
  size?: number
  readOnly?: boolean
  className?: string
}

export default function WoepRating({ 
  value, 
  onChange, 
  size = 24, 
  readOnly = false,
  className = ""
}: RatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  // Cirkel berekeningen (r=9 -> omtrek ≈ 56.5)
  // We schalen de SVG, dus de radius blijft relatief 9 binnen de viewBox van 24
  const RADIUS = 9
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  return (
    <div className={`flex gap-1 items-center ${className}`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
        const isSelected = score <= value
        const isHovered = score <= hoverRating
        
        // Logica voor 'half' of 'heel' vullen
        const showFull = isSelected
        const showHalf = !isSelected && isHovered && !readOnly

        return (
          <button
            key={score}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange(score)}
            onMouseEnter={() => !readOnly && setHoverRating(score)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            className={`flex items-center justify-center focus:outline-none group relative transition-transform ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            style={{ width: size, height: size }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className={`w-full h-full -rotate-90 transition-all duration-300 ${
                  showFull 
                      ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' 
                      : showHalf 
                          ? 'text-violet-300' 
                          : 'text-slate-700'
              }`}
            >
              {/* Achtergrond ring */}
              <circle 
                cx="12" cy="12" r={RADIUS} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="opacity-20"
              />

              {/* Vullende ring */}
              <circle 
                cx="12" cy="12" r={RADIUS} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={
                    showFull ? 0 : 
                    showHalf ? CIRCUMFERENCE * 0.4 : // Half vullen bij hover
                    CIRCUMFERENCE // Leeg
                }
                className="transition-all duration-300 ease-out"
              />
              
              {/* Stipje in midden (alleen als geselecteerd) */}
              <circle 
                  cx="12" cy="12" r="2" 
                  fill="currentColor" 
                  className={`transition-all duration-300 ${showFull ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              />
            </svg>
            
            {/* Tooltip tijdens hoveren (niet in readonly modus) */}
            {!readOnly && hoverRating === score && (
               <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-2 z-10 pointer-events-none">
                   {score}
               </span>
            )}
          </button>
        )
      })}
    </div>
  )
}