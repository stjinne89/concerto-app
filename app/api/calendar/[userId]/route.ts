import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const userId = (await params).userId

  // Check of de keys er wel zijn (voor debugging)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!')
    return new NextResponse('Server Configuration Error', { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: events, error } = await supabase
    .from('events')
    .select(`*, rsvps!inner (user_id, status)`)
    .eq('rsvps.user_id', userId)
    .eq('rsvps.status', 'going')
    .order('start_at', { ascending: true })

  if (error || !events) {
    return new NextResponse('Error fetching events', { status: 500 })
  }

  // Helper: Maak tekst veilig voor ICS
  const escapeText = (text: string) => {
    if (!text) return ''
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  // Helper: Vouw lange regels (RFC 5545 eis: max 75 bytes per regel)
  const foldLine = (line: string) => {
    const MAX_LENGTH = 75
    if (line.length <= MAX_LENGTH) return line
    
    // Splits de regel
    let result = ''
    let currentLine = line
    
    while (currentLine.length > MAX_LENGTH) {
      // Neem het eerste stuk
      result += currentLine.substring(0, MAX_LENGTH) + '\r\n ' // Let op de spatie aan het begin van de volgende regel
      currentLine = currentLine.substring(MAX_LENGTH)
    }
    result += currentLine
    return result
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().replace(/-|:|\.\d\d\d/g, "")
  }

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Concerto//Events//NL',
    'X-WR-CALNAME:Mijn Concerto Agenda',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  events.forEach(event => {
    const start = formatDate(event.start_at)
    const endDate = new Date(new Date(event.start_at).getTime() + 3 * 60 * 60 * 1000) 
    const end = formatDate(endDate.toISOString())
    const now = formatDate(new Date().toISOString())

    // We bouwen de regels eerst op, en vouwen ze daarna
    const eventBlock = [
      `BEGIN:VEVENT`,
      `UID:${event.id}@concerto.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeText(`🎵 ${event.title}`)}`,
      `DESCRIPTION:${escapeText(`Tickets & Info: ${event.ticket_link || 'Zie app'}`)}`,
      `LOCATION:${escapeText(event.venue_name)}`,
      `STATUS:CONFIRMED`,
      `END:VEVENT`
    ]

    icsLines.push(...eventBlock)
  })

  icsLines.push('END:VCALENDAR')

  // Pas line-folding toe op ALLE regels
  const finalContent = icsLines.map(foldLine).join('\r\n')

  return new NextResponse(finalContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}