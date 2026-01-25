import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'



// 2. Initialiseer Supabase met ADMIN rechten (Service Role)
// Dit is nodig om de lijst van ALLE gebruikers op te halen (niet alleen jezelf)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    // 1. Initialiseer Resend met de key uit je .env
const resend = new Resend(process.env.RESEND_API_KEY)
  // 3. Beveiliging: Check of de 'secret' klopt
  // Dit voorkomt dat vreemden deze link zomaar kunnen aanroepen
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  // Zorg dat je CRON_SECRET ook in je .env.local zet (verzin zelf een wachtwoord)
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
      // 4. Haal events op voor de komende 7 dagen
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_at, venue_name, image_url, event_type')
        .gte('start_at', today.toISOString())
        .lt('start_at', nextWeek.toISOString())
        .order('start_at', { ascending: true })

      if (!events || events.length === 0) {
        return NextResponse.json({ message: 'Geen events deze week, geen mail verstuurd.' })
      }

      // 5. Haal ALLE gebruikers op via de Auth Admin API
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
      
      if (userError || !users || users.length === 0) {
          console.error('User fetch error:', userError)
          return NextResponse.json({ error: 'Geen gebruikers gevonden' })
      }

      // 6. Genereer de HTML (Concerto Stijl)
      const emailHtml = generateEmailHtml(events)

      // 7. Verstuur de mails (Loop door alle users)
      const results = []
      
      // Let op: Resend Free Tier heeft een limiet. Voor grote lijsten moet je batchen.
      // Voor nu sturen we ze één voor één.
      for (const user of users) {
          if (!user.email) continue

          try {
            const data = await resend.emails.send({
                from: 'Concerto <onboarding@resend.dev>', // Zodra je een domein hebt: 'agenda@jouwdomein.nl'
                to: [user.email], 
                subject: `📅 Concerto Weekoverzicht: ${events.length} events deze week!`,
                html: emailHtml,
            })
            results.push({ email: user.email, status: 'sent', id: data.data?.id })
          } catch (error) {
            console.error('Failed to send to', user.email, error)
            results.push({ email: user.email, status: 'error' })
          }
      }

      return NextResponse.json({ success: true, results })

  } catch (err) {
      console.error('Cron error:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// --- HULPFUNCTIE: HTML GENERATOR ---
function generateEmailHtml(events: any[]) {
    const listItems = events.map(event => {
        const date = new Date(event.start_at)
        const day = date.toLocaleDateString('nl-NL', { weekday: 'short' }).toUpperCase()
        const dayNum = date.getDate()
        const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        
        let color = '#8b5cf6' // Violet
        if (event.event_type === 'Festival') color = '#f59e0b' // Goud
        if (event.event_type?.includes('Club')) color = '#d946ef' // Roze

        // Image handling: Als er geen image is, tonen we niks (of een placeholder)
        const imagePart = event.image_url 
            ? `<img src="${event.image_url}" style="width: 100%; height: 150px; object-fit: cover; border-bottom: 1px solid #334155;" alt="${event.title}" />` 
            : ''

        return `
        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            ${imagePart}
            <div style="padding: 20px; display: flex; align-items: flex-start;">
                <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 10px; text-align: center; min-width: 50px; margin-right: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">${day}</div>
                    <div style="font-size: 20px; color: #ffffff; font-weight: 900; line-height: 1; margin-top: 2px;">${dayNum}</div>
                </div>
                <div>
                    <h3 style="margin: 0 0 6px 0; color: #ffffff; font-size: 18px; font-family: sans-serif; font-weight: 700;">${event.title}</h3>
                    <div style="color: #94a3b8; font-size: 13px; margin-bottom: 10px;">📍 ${event.venue_name} &bull; ⌚ ${time}</div>
                    <span style="display: inline-block; font-size: 10px; font-weight: bold; color: ${color}; background-color: ${color}15; padding: 4px 10px; border-radius: 99px; text-transform: uppercase; border: 1px solid ${color}30;">
                        ${event.event_type || 'Event'}
                    </span>
                </div>
            </div>
        </div>
        `
    }).join('')

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
    </head>
    <body style="background-color: #0f172a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 0; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #a78bfa; font-size: 32px; margin: 0; font-weight: 900; letter-spacing: -1px; text-shadow: 0 0 20px rgba(167, 139, 250, 0.3);">
                    Concerto
                </h1>
                <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; font-weight: bold;">Sunday Service</p>
            </div>

            <p style="color: #cbd5e1; text-align: center; margin-bottom: 30px; font-size: 16px; line-height: 1.5;">
                Goedemorgen! ☕<br/>
                Er staan <strong>${events.length} events</strong> op de planning voor deze week. <br/>Tijd om je agenda te checken!
            </p>

            ${listItems}

            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #334155; padding-top: 30px;">
                <a href="https://concerto-app.netlify.app" style="background-color: #7c3aed; color: white; text-decoration: none; padding: 14px 28px; border-radius: 99px; font-weight: bold; font-size: 14px; box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);">Open Agenda</a>
                <p style="color: #475569; font-size: 12px; margin-top: 24px;">
                    Je ontvangt dit omdat je lid bent van de Concerto Community.<br/>
                    <span style="opacity: 0.5;">Geniet van je zondag!</span>
                </p>
            </div>
        </div>
    </body>
    </html>
    `
}