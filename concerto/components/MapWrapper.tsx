'use client'

import dynamic from 'next/dynamic'

// Hier importeren we de kaart dynamisch met ssr: false
// Dit mag wél in dit bestand, omdat er 'use client' boven staat.
const EventMap = dynamic(() => import('./EventMap'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl mb-6"></div>
})

export default function MapWrapper({ events }: { events: any[] }) {
  return <EventMap events={events} />
}