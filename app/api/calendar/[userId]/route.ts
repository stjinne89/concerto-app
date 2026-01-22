import { createClient } from '@supabase/supabase-js' // Let op: andere import!
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const userId = (await params).userId

  // 1. Maak een ADMIN client aan (bypassed RLS beveiliging)
  // Dit is nodig omdat Google/Outlook geen gebruiker zijn en niet kunnen inloggen.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 2. Haal events op
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      rsvps!inner (
        user_id,
        status
      )
    `)
    .eq('rsvps.user_id', userId)
    .eq('rsvps.status', 'going')
    .order('start_at', { ascending: true })

  if (error || !events) {
    console.error('Calendar Error:', error)
    return new NextResponse('Error fetching events', { status: 500 })
  }

  // 3. Helper functie om tekst veilig te maken voor ICS (voorkomt format errors)
  const cleanText = (text: string) => {
    if (!text) return ''
    return text
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/;/g, '\\;')   // Escape puntkomma's
      .replace(/,/g, '\\,')   // Escape komma's
      .replace(/\n/g, '\\n')  // Escape nieuwe regels
  }

  // 4. Datum formatter (YYYYMMDDTHHMMSSZ)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().replace(/-|:|\.\d\d\d/g, "")
  }

  // 5. Bouw de ICS feed
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Concerto//Events//NL',
    'X-WR-CALNAME:Mijn Concerto Agenda',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH' // Belangrijk voor Outlook
  ]

  events.forEach(event => {
    const start = formatDate(event.start_at)
    const endDate = new Date(new Date(event.start_at).getTime() + 3 * 60 * 60 * 1000) 
    const end = formatDate(endDate.toISOString())
    const now = formatDate(new Date().toISOString())

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@concerto.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${cleanText(`🎵 ${event.title}`)}`,
      `DESCRIPTION:${cleanText(`Tickets & Info: ${event.ticket_link || 'Zie app'}`)}`,
      `LOCATION:${cleanText(event.venue_name)}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT'
    )
  })

  icsContent.push('END:VCALENDAR')

  // 6. Stuur terug met de juiste headers
  // We halen 'attachment' weg zodat Outlook hem als FEED ziet, niet als download
  return new NextResponse(icsContent.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}