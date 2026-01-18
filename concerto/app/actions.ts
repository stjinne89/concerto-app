'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'

// --- HULPFUNCTIE: Adres naar GPS (Geocoding) ---
async function getCoordinates(venue: string) {
  try {
    // We gebruiken de gratis OpenStreetMap API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venue)}&limit=1`
    
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'ConcertoApp/1.0' // Netjes voorstellen is verplicht bij OSM
      }
    })
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  return { lat: null, lon: null }
}

// --- 1. EVENT AANMAKEN ---
export async function createEvent(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: members, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
  
  if (memberError || !members || members.length === 0) {
    throw new Error('Je bent geen lid van een groep!')
  }

  const firstGroupId = members[0].group_id
  const venue = formData.get('venue') as string

  // NIEUW: Haal GPS op
  const coords = await getCoordinates(venue)

  const eventData = {
    group_id: firstGroupId,
    created_by: user.id,
    title: formData.get('title') as string,
    event_type: formData.get('type') as string,
    start_at: formData.get('start_at') as string,
    venue_name: venue,
    description: formData.get('description') as string,
    ticket_link: formData.get('ticket_link') as string,
    ticketswap_link: formData.get('ticketswap_link') as string,
    resale_link: formData.get('resale_link') as string,
    lat: coords.lat, // Opslaan
    lon: coords.lon  // Opslaan
  }

  const { error: insertError } = await supabase.from('events').insert(eventData)

  if (insertError) {
    console.error("INSERT ERROR:", insertError)
    return { error: 'Kon event niet aanmaken' }
  }

  revalidatePath('/')
  redirect('/')
}

// --- 2. RSVP (AANWEZIGHEID) ---
export async function toggleRSVP(eventId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('rsvps')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      status: status
    })

  if (error) console.error('RSVP Error:', error)
  revalidatePath('/')
}

// --- 3. CHAT BERICHT STUREN ---
export async function sendMessage(eventId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('messages')
    .insert({
      event_id: eventId,
      user_id: user.id,
      content: content
    })

  if (error) console.error('Chat Error:', error)
}

// --- 4. UITLOGGEN ---
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// --- 5. LINK PREVIEW (SCRAPER) ---
export async function scrapeEventUrl(url: string) {
  const cleanUrl = url.split('?')[0];
  console.log(`--- Start Scraping: ${cleanUrl} ---`); 

  try {
    const response = await fetch(cleanUrl, { 
      cache: 'no-store',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      } 
    });
    
    if (!response.ok) return { success: false, error: `Status: ${response.status}` };

    const html = await response.text(); 
    const $ = cheerio.load(html);

    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let description = $('meta[property="og:description"]').attr('content') || '';
    let siteName = $('meta[property="og:site_name"]').attr('content') || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    let startDate = '';
    let jsonTitle = '';

    try {
      $('script[type="application/ld+json"]').each((i, el) => {
        const txt = $(el).text();
        if (txt.includes('startDate') || txt.includes('Event')) {
            const json = JSON.parse(txt);
            const findData = (obj: any): any => {
                if (!obj) return;
                if (obj.startDate && !startDate) startDate = obj.startDate;
                if ((obj['@type'] === 'Event' || obj['@type'] === 'MusicEvent') && obj.name && !jsonTitle) {
                    jsonTitle = obj.name;
                }
                for (const k in obj) {
                    if (typeof obj[k] === 'object') findData(obj[k]);
                }
            }
            findData(json);
        }
      });
    } catch(e) {}

    if (jsonTitle && jsonTitle.length > 2) {
        title = jsonTitle;
    } else {
        const h1 = $('h1').first().text().trim();
        if (h1 && (title.includes('Agenda') || title.includes('Home') || title.length < 5)) {
            if (!h1.toLowerCase().includes('agenda overzicht')) title = h1;
        }
    }

    if (!startDate) {
        $('script').each((i, el) => {
            const scriptContent = $(el).html() || '';
            const dateMatch = scriptContent.match(/["'](202[4-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9])/);
            if (dateMatch) { startDate = dateMatch[1]; return false; }
        });
    }

    if (!startDate) {
        const rawText = description + " " + $('body').text().replace(/\s+/g, ' '); 
        const dutchMonths = 'januari|jan|februari|feb|maart|mrt|april|apr|mei|juni|jun|juli|jul|augustus|aug|september|sep|oktober|okt|november|nov|december|dec';
        const textRegex = new RegExp(`\\b(\\d{1,2})\\s*(${dutchMonths})(?:\\s+(\\d{4}))?`, 'i');
        const match = rawText.match(textRegex);
        if (match) {
            const day = match[1].padStart(2, '0');
            const monthMap: { [key: string]: string } = {
                'januari': '01', 'jan': '01', 'februari': '02', 'feb': '02', 'maart': '03', 'mrt': '03',
                'april': '04', 'apr': '04', 'mei': '05', 'juni': '06', 'jun': '06', 'juli': '07', 'jul': '07',
                'augustus': '08', 'aug': '08', 'september': '09', 'sep': '09', 'oktober': '10', 'okt': '10',
                'november': '11', 'nov': '11', 'december': '12', 'dec': '12'
            };
            const month = monthMap[match[2].toLowerCase()];
            let year = new Date().getFullYear();
            if (match[3]) year = parseInt(match[3]);
            else {
                const testDate = new Date(year, parseInt(month) - 1, parseInt(day));
                if (testDate < new Date(new Date().getTime() - 86400000)) year += 1;
            }
            startDate = `${year}-${month}-${day}T20:00`;
        }
    }

    if (startDate && startDate.length > 16) startDate = startDate.slice(0, 16);
    if ((cleanUrl + title).toLowerCase().includes('afas')) siteName = 'AFAS Live';
    if ((cleanUrl + title).toLowerCase().includes('ziggo')) siteName = 'Ziggo Dome';
    if (title === 'Ziggo Dome' && !startDate && description.includes('geselecteerde events')) {
        return { success: false, error: 'Beveiligde pagina' };
    }

    return { 
      success: true, 
      data: {
        title: title || 'Nieuw Event',
        description: description,
        venue: siteName,
        image: image,
        start_at: startDate
      }
    };
  } catch (error) {
    console.error('Scrape error:', error);
    return { success: false, error: 'Fout bij inlezen' };
  }
}

// --- 6. EVENT UPDATEN (MET GPS) ---
export async function getEvent(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()
  return { data, error }
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient()
  const eventId = formData.get('event_id') as string
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const venue = formData.get('venue') as string
  
  // NIEUW: Haal GPS ook op bij updaten
  const coords = await getCoordinates(venue)

  const updateData = {
    title: formData.get('title') as string,
    event_type: formData.get('type') as string,
    start_at: formData.get('start_at') as string,
    venue_name: venue,
    description: formData.get('description') as string,
    ticket_link: formData.get('ticket_link') as string,
    ticketswap_link: formData.get('ticketswap_link') as string,
    resale_link: formData.get('resale_link') as string,
    lat: coords.lat, // Update GPS
    lon: coords.lon  // Update GPS
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) {
    console.error('Update Error:', error)
    return
  }

  revalidatePath('/')
  redirect('/')
}
// --- 7. VERWIJDEREN (BINNENKORT) ---