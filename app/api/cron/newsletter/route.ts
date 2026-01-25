import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// 1. Initialiseer Supabase (Admin)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // 2. Initialiseer Resend (veilig binnen de functie)
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const preview = searchParams.get('preview')
  const testEmail = searchParams.get('test_email')
  
  // 3. Check Secret
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

      // --- STAP 5: GEBRUIKERS & NAMEN OPHALEN ---
      
      // A. Haal Auth Users (voor email)
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
      if (userError || !users) return NextResponse.json({ error: 'Geen users gevonden' })

      // B. Haal Profielen (voor Voornaam & Voorkeuren)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, newsletter_subscribed')
      
      // Helper om profiel te vinden bij user ID
      const getProfile = (uid: string) => profiles?.find(p => p.id === uid)

      // --- OPTIE A: PREVIEW IN BROWSER ---
      if (preview === 'true') {
          // We doen alsof we "Preview User" heten
          const html = generateEmailHtml(events, '#', 'Preview User')
          // BELANGRIJK: charset=utf-8 toevoegen tegen de rare tekens!
          return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }

      // --- OPTIE B: TEST MAIL ---
      if (testEmail) {
          const html = generateEmailHtml(events, '#', 'Testpersoon')
          await resend.emails.send({
            from: 'Concerto <onboarding@resend.dev>',
            to: [testEmail], 
            subject: `[TEST] Concerto Weekoverzicht`,
            html: html,
          })
          return NextResponse.json({ success: true, message: `Test verstuurd naar ${testEmail}` })
      }

      // --- DE ECHTE LOOP ---
      const results = []
      
      for (const user of users) {
          if (!user.email) continue

          const profile = getProfile(user.id)
          
          // Check uitschrijving
          if (profile?.newsletter_subscribed === false) {
              continue
          }

          // Haal voornaam op (eerste deel van full_name) of fallback
          const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Concerto-lid'

          const unsubscribeUrl = `https://concerto-app.netlify.app/unsubscribe?id=${user.id}`
          
          // Genereer mail MET naam
          const emailHtml = generateEmailHtml(events, unsubscribeUrl, firstName)

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

// --- HULPFUNCTIE: HTML GENERATOR (Met Naam & Nieuw Design) ---
function generateEmailHtml(events: any[], unsubscribeUrl: string, userName: string) {
    
    const logoUrl = "https://concerto-app.netlify.app/concerto_logo.png" // Zorg dat deze bestaat!

    const listItems = events.map(event => {
        const date = new Date(event.start_at)
        const day = date.toLocaleDateString('nl-NL', { weekday: 'short' }).toUpperCase()
        const dayNum = date.getDate()
        const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        
        let color = '#8b5cf6' 
        if (event.event_type === 'Festival') color = '#f59e0b' 
        if (event.event_type?.includes('Club')) color = '#d946ef' 

        const imagePart = event.image_url 
            ? `<div style="height: 160px; width: 100%; background-image: url('${event.image_url}'); background-size: cover; background-position: center;"></div>` 
            : ''

        return `
        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 20px; margin-bottom: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
            ${imagePart}
            <div style="padding: 24px; display: flex; align-items: flex-start;">
                <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px 0; text-align: center; min-width: 60px; margin-right: 20px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${day}</div>
                    <div style="font-size: 24px; color: #ffffff; font-weight: 900; line-height: 1; margin-top: 4px;">${dayNum}</div>
                </div>
                <div>
                    <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 18px; font-family: 'Helvetica Neue', sans-serif; font-weight: 700; letter-spacing: -0.5px;">${event.title}</h3>
                    <div style="color: #cbd5e1; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center;">
                        <span>📍 ${event.venue_name}</span>
                        <span style="margin: 0 8px; opacity: 0.3;">|</span>
                        <span>⌚ ${time}</span>
                    </div>
                    <span style="display: inline-block; font-size: 10px; font-weight: bold; color: ${color}; background-color: ${color}15; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; border: 1px solid ${color}40; letter-spacing: 1px;">
                        ${event.event_type || 'Event'}
                    </span>
                </div>
            </div>
        </div>
        `
    }).join('')

    return `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
        <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
        <title>Concerto Sunday Service</title>
    </head>
    <body style="background-color: #0f172a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 0; margin: 0; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="
                background-color: rgba(30, 41, 59, 0.5); 
                border: 1px solid rgba(255, 255, 255, 0.1); 
                border-radius: 24px; 
                padding: 40px 20px; 
                margin-bottom: 40px; 
                text-align: center;
                box-shadow: 0 0 40px rgba(124, 58, 237, 0.15); /* Paarse gloed */
            ">
                <img src="${logoUrl}" alt="Concerto Logo" style="width: 120px; height: auto; margin: 0 auto; display: block; border-radius: 12px;" />
                <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 4px; margin-top: 20px; font-weight: 800; color: #a78bfa;">Concerto Sunday Service</div>
            </div>

            <p style="color: #cbd5e1; text-align: center; margin-bottom: 30px; font-size: 18px; line-height: 1.6;">
                Hoi <strong>${userName}</strong>! 👋<br/>
                <span style="color: #94a3b8; font-size: 16px;">Er staan deze week <strong>${events.length} events</strong> in de Concerto Agenda.</span>
            </p>

            ${listItems}

            <div style="text-align: center; margin-top: 50px; border-top: 1px solid #334155; padding-top: 30px;">
                <a href="https://concerto-app.netlify.app" style="
                    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                    color: white; 
                    text-decoration: none; 
                    padding: 16px 32px; 
                    border-radius: 99px; 
                    font-weight: bold; 
                    font-size: 14px; 
                    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
                    border: 1px solid rgba(255,255,255,0.2);
                    display: inline-block;
                ">
                    Open Concerto App
                </a>
                
                <p style="color: #475569; font-size: 12px; margin-top: 30px; line-height: 1.6;">
                    Je ontvangt dit omdat je lid bent van Concerto.<br/>
                    <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Uitschrijven</a>
                </p>

                <div style="margin-top: 30px; opacity: 0.2; filter: grayscale(100%);">
                     <img src="${logoUrl}" alt="Concerto" style="width: 24px; height: auto;" />
                </div>
            </div>
        </div>
    </body>
    </html>
    `
}