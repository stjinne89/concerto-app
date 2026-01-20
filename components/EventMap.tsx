'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
// Zorg dat het bestand utils/mapUtils.ts bestaat (zie hierboven)
import { applyJitterToEvents } from '@/utils/mapUtils';

// --- FIX: Standaard Leaflet iconen werken niet goed in React, dit repareert ze ---
const iconFix = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

type EventMapProps = {
  events: any[]
}

export default function EventMap({ events }: EventMapProps) {
  useEffect(() => {
    iconFix()
  }, [])

  // 1. Filter events die geen GPS hebben eruit
  const validEvents = events.filter(e => e.lat && e.lon)

  // Als er helemaal geen events met locatie zijn, tonen we niets
  if (validEvents.length === 0) return null

  // 2. PAS DE JITTER TOE: Dit zorgt dat overlappingen uit elkaar worden geschoven
  const visibleEvents = applyJitterToEvents(validEvents);

  // Bepaal het centrum (pak het eerste event uit de originele lijst)
  const centerPosition: [number, number] = [validEvents[0].lat, validEvents[0].lon]

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <MapContainer 
        center={centerPosition} 
        zoom={7} 
        style={{ height: '300px', width: '100%', zIndex: 0 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* 3. GEBRUIK HIER 'visibleEvents' IN PLAATS VAN 'validEvents' */}
        {visibleEvents.map((event: any) => (
          <Marker key={event.id} position={[event.lat, event.lon]}>
            <Popup>
              <div className="text-sm">
                <strong className="block text-indigo-600 mb-1">{event.title}</strong>
                <span className="text-gray-600">{event.venue_name}</span><br/>
                <span className="text-xs text-gray-400">
                  {new Date(event.start_at).toLocaleDateString('nl-NL', {day: 'numeric', month: 'short'})}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}