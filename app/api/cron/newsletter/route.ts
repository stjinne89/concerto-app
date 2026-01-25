import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// 1. Initialiseer Supabase met ADMIN rechten (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // 1. Initialiseer Resend
  const resend = new Resend(process.env.RESEND_API_KEY)

  // 2. Haal parameters op
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const preview = searchParams.get('preview') // Nieuw: ?preview=true
  const testEmail = searchParams.get('test_email') // Nieuw: ?test_email=jouw@mail.nl
  
  // 3. Beveiliging
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
      // 4. Haal events op (Komende 7 dagen)
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
        return NextResponse.json({ message: 'Geen events deze week.' })
      }

      // --- OPTIE A: BROWSER PREVIEW (Zien zonder te sturen) ---
      if (preview === 'true') {
          // Genereer HTML met een dummy unsubscribe link
          const html = generateEmailHtml(events, '#')
          // Stuur HTML terug zodat de browser het rendert als een webpagina
          return new Response(html, { headers: { 'Content-Type': 'text/html' } })
      }

      // --- OPTIE B: TEST MAIL (Sturen naar 1 persoon) ---
      if (testEmail) {
          const html = generateEmailHtml(events, 'https://concerto-app.netlify.app/unsubscribe?test=true')
          const data = await resend.emails.send({
            from: 'Concerto <onboarding@resend.dev>',
            to: [testEmail], 
            subject: `[TEST] Concerto Weekoverzicht`,
            html: html,
          })
          return NextResponse.json({ success: true, message: `Testmail verstuurd naar ${testEmail}` })
      }

      // --- DE ECHTE LOOP (Normale werking) ---
      
      // 5. Haal ALLE gebruikers op
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
      if (userError || !users) return NextResponse.json({ error: 'Geen users' })

      // 6. Haal unsubscribe voorkeuren op
      const { data: profiles } = await supabase.from('profiles').select('id, newsletter_subscribed')
      const unsubscribedIds = profiles?.filter(p => !p.newsletter_subscribed).map(p => p.id) || []

      const results = []
      
      for (const user of users) {
          if (!user.email) continue
          if (unsubscribedIds.includes(user.id)) continue

          const unsubscribeUrl = `https://concerto-app.netlify.app/unsubscribe?id=${user.id}`
          const emailHtml = generateEmailHtml(events, unsubscribeUrl)

          try {
            const data = await resend.emails.send({
                from: 'Concerto <onboarding@resend.dev>',
                to: [user.email], 
                subject: `📅 Concerto Weekoverzicht: ${events.length} events deze week!`,
                html: emailHtml,
            })
            results.push({ email: user.email, status: 'sent', id: data.data?.id })
          } catch (error) {
            console.error('Failed to send', error)
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
function generateEmailHtml(events: any[], unsubscribeUrl: string) {
    // 1. De link naar jouw logo (Zorg dat de bestandsnaam klopt!)
    // Als je bestand .jpg of .svg is, pas dat hieronder aan.
    const logoUrl = "https://concerto-app.netlify.app/concerto_logo.png"

    const listItems = events.map(event => {
        const date = new Date(event.start_at)
        const day = date.toLocaleDateString('nl-NL', { weekday: 'short' }).toUpperCase()
        const dayNum = date.getDate()
        const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        
        let color = '#8b5cf6' // Violet
        if (event.event_type === 'Festival') color = '#f59e0b' // Goud
        if (event.event_type?.includes('Club')) color = '#d946ef' // Roze

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
                <img src="${logoUrl}" alt="Concerto Logo" style="width: 150px; height: auto; margin: 0 auto; display: block;" />
                
                <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin-top: 16px; font-weight: bold;">Sunday Service</p>
            </div>

            <p style="color: #cbd5e1; text-align: center; margin-bottom: 30px; font-size: 16px; line-height: 1.5;">
                Hoi Concerto-lid! ☕<br/>
                Er staan <strong>${events.length} events</strong> op de Concerto Agenda voor deze week. <br/>Kijk waar jij bij kan zijn!
            </p>

            ${listItems}

            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #334155; padding-top: 30px;">
                <a href="https://concerto-app.netlify.app" style="background-color: #7c3aed; color: white; text-decoration: none; padding: 14px 28px; border-radius: 99px; font-weight: bold; font-size: 14px; box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);">Open Agenda</a>
                
                <p style="color: #475569; font-size: 12px; margin-top: 24px; line-height: 1.6;">
                    Je ontvangt dit omdat je lid bent van de Concerto Community.<br/>
                    <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Uitschrijven</a>
                </p>

                <div style="margin-top: 30px; opacity: 0.3;">
                     <img src="${logoUrl}" alt="Concerto" style="width: 30px; height: auto;" />
                </div>
            </div>
        </div>
    </body>
    </html>
    `
}