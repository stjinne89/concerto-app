'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// --- FIX: Standaard Leaflet iconen werken niet goed in React, dit repareert ze ---
const iconFix = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
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

  // Filter events die nog geen GPS hebben eruit
  const validEvents = events.filter(e => e.lat && e.lon)

  // Als er helemaal geen events met locatie zijn, tonen we geen kaart (of een lege kaart van NL)
  if (validEvents.length === 0) return null

  // Bepaal het centrum (pak het eerste event, of standaard Utrecht)
  const centerPosition: [number, number] = [validEvents[0].lat, validEvents[0].lon]

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <MapContainer 
        center={centerPosition} 
        zoom={7} 
        style={{ height: '300px', width: '100%', zIndex: 0 }}
        scrollWheelZoom={false} // Voorkomt dat je per ongeluk inzoomt als je scrolt
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validEvents.map((event) => (
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