'use client'

import { useState } from 'react'
import { Map, MapPin } from 'lucide-react'
import MapWrapper from './MapWrapper'

export default function ToggleMap({ events }: { events: any[] }) {
  const [showMap, setShowMap] = useState(false)

  // Filter events die GPS hebben
  const hasLocations = events.some(e => e.lat && e.lon)

  // Als er geen enkel event met locatie is, tonen we de hele knop niet
  if (!hasLocations) return null

  return (
    <div className="mb-6">
      <button 
        onClick={() => setShowMap(!showMap)}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-medium py-2 px-4 rounded-xl shadow-sm hover:bg-gray-50 transition-all active:scale-95"
      >
        {showMap ? (
            <>
                <MapPin size={18} className="text-gray-400" />
                <span>Verberg kaart</span>
            </>
        ) : (
            <>
                <Map size={18} className="text-indigo-600" />
                <span>Toon {events.length} events op kaart</span>
            </>
        )}
      </button>

      {/* De kaart wordt pas geladen als je op de knop drukt */}
      {showMap && (
        <div className="mt-4 animate-in fade-in zoom-in duration-300">
           <MapWrapper events={events} />
        </div>
      )}
    </div>
  )
}