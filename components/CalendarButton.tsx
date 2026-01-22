'use client'

import { Calendar } from 'lucide-react'
import { useState } from 'react'

type EventProps = {
  title: string
  startAt: string
  venue: string
  description?: string
}

export default function CalendarButton({ title, startAt, venue, description }: EventProps) {
  const [isOpen, setIsOpen] = useState(false)

  const startDate = new Date(startAt)
  const endDate = new Date(startDate.getTime() + (3 * 60 * 60 * 1000)) // We gokken even 3 uur duur

  // Google Calendar Link
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(venue)}&sf=true&output=xml`

  // iCal / Outlook / Apple Download
  const handleDownloadIcs = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${document.location.href}
DTSTART:${startDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}
DTEND:${endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}
SUMMARY:${title}
DESCRIPTION:${description || ''}
LOCATION:${venue}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `${title}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1 text-slate-400 hover:text-white"
      >
        <Calendar size={12} /> Agenda
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full left-0 mt-2 w-40 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col">
                <a 
                    href={googleUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-3 text-xs font-bold text-left hover:bg-white/5 text-slate-300 hover:text-white border-b border-white/5"
                >
                    Google Calendar
                </a>
                <button 
                    onClick={handleDownloadIcs}
                    className="px-4 py-3 text-xs font-bold text-left hover:bg-white/5 text-slate-300 hover:text-white"
                >
                    Apple / Outlook
                </button>
            </div>
        </>
      )}
    </div>
  )
}