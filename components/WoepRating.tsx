'use client'

import { useState } from 'react'

// Jouw tijdelijke Woep vorm (totdat je de echte SVG hebt)
const WOEP_PATH = "M12 2C8 2 2 8 2 13c0 5.5 4.5 10 10 10s10-4.5 10-10C22 8 16 2 12 2zM12 21c-4.4 0-8-3.6-8-8 0-4 4.8-8.8 8-15.8 3.2 7 8 11.8 8 15.8 0 4.4-3.6 8-8 8z"

type Props = {
    value: number // Score van 0 tot 10
    onChange?: (val: number) => void
    readOnly?: boolean
    size?: number
}

export default function WoepRating({ value, onChange, readOnly = false, size = 32 }: Props) {
    const [hoverValue, setHoverValue] = useState<number | null>(null)

    // Helper: Bepaal hoeveel % het icoontje gevuld moet zijn
    // Index 0 = punten 1 & 2
    // Index 1 = punten 3 & 4
    // etc.
    const getFillPercent = (index: number, currentVal: number) => {
        const iconValue = (index + 1) * 2 // Max waarde van dit icoon (bijv 2, 4, 6)
        
        if (currentVal >= iconValue) return 100 // Helemaal vol
        if (currentVal === iconValue - 1) return 50 // Half vol
        return 0 // Leeg
    }

    // Handelt de muisbeweging af om te zien of we links of rechts zitten
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        if (readOnly) return

        const { left, width } = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - left
        
        // Als we op de linkerhelft zitten: punt is (index * 2) + 1
        // Als we rechts zitten: punt is (index * 2) + 2
        const isLeftHalf = x < width / 2
        const points = (index * 2) + (isLeftHalf ? 1 : 2)
        
        setHoverValue(points)
    }

    const displayValue = hoverValue !== null ? hoverValue : value

    return (
        <div className="flex gap-1.5" onMouseLeave={() => !readOnly && setHoverValue(null)}>
            {[0, 1, 2, 3, 4].map((index) => {
                const fill = getFillPercent(index, displayValue)
                
                return (
                    <div 
                        key={index}
                        className={`relative ${readOnly ? '' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                        style={{ width: size, height: size }}
                        onClick={() => !readOnly && hoverValue && onChange?.(hoverValue)}
                        onMouseMove={(e) => handleMouseMove(e, index)}
                    >
                        <svg 
                            viewBox="0 0 24 24" 
                            className="w-full h-full drop-shadow-sm"
                        >
                            {/* Achtergrond (Grijs/Leeg) */}
                            <path d={WOEP_PATH} className="fill-slate-800 stroke-slate-600 stroke-1" />
                            
                            {/* Voorgrond (Gekleurd) */}
                            <defs>
                                <clipPath id={`clip-${index}-${fill}`}>
                                    <rect x="0" y="0" width={`${fill}%`} height="100%" />
                                </clipPath>
                                <linearGradient id="woepGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a78bfa" /> {/* Violet-400 */}
                                    <stop offset="100%" stopColor="#7c3aed" /> {/* Violet-600 */}
                                </linearGradient>
                            </defs>
                            
                            <path 
                                d={WOEP_PATH} 
                                fill="url(#woepGradient)" 
                                clipPath={`url(#clip-${index}-${fill})`}
                                className="transition-all duration-100" // Snellere animatie voor snappy gevoel
                            />
                        </svg>
                    </div>
                )
            })}
        </div>
    )
}