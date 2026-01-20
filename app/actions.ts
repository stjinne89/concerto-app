'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'

// --- HULPFUNCTIES ---

function fixTimezoneOffset(dateString: string) {
  if (!dateString) return null
  const inputAsUtc = new Date(dateString)
  const amsterdamDate = new Date(inputAsUtc.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))
  const offset = amsterdamDate.getTime() - inputAsUtc.getTime()
  return new Date(inputAsUtc.getTime() - offset).toISOString()
}

async function getCoordinates(venue: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venue)}&limit=1`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ConcertoApp/1.0' }
    })
    const data = await response.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  return { lat: null, lon: null }
}

// --- AUTHENTICATIE (LOGIN & SIGNUP) ---

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=Kan niet inloggen')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  if (!fullName) {
    return redirect('/login?error=Naam is verplicht')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // Dit zorgt dat de naam mee gaat naar de DB
      },
    },
  })

  if (error) {
    console.error('Signup error:', error)
    return redirect('/login?error=Registratie mislukt')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// --- EVENTS ---

export async function createEvent(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: members, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
  
  if (memberError || !members || members.length === 0) {
    console.error('User is geen member van een groep')
    throw new Error('Je bent geen lid van een groep!')
  }

  const firstGroupId = members[0].group_id
  
  const venue = formData.get('venue') as string
  const coords = await getCoordinates(venue)
  
  const rawDate = formData.get('start_at') as string
  const fixedDate = fixTimezoneOffset(rawDate) 

  const eventData = {
    group_id: firstGroupId,
    created_by: user.id,
    title: formData.get('title') as string,
    event_type: formData.get('type') as string,
    start_at: fixedDate, 
    venue_name: venue,
    description: formData.get('description') as string,
    ticket_link: formData.get('ticket_link') as string,
    ticketswap_link: formData.get('ticketswap_link') as string,
    resale_link: formData.get('resale_link') as string,
    lat: coords.lat,
    lon: coords.lon
  }

  const { error: insertError } = await supabase.from('events').insert(eventData)

  if (insertError) {
    console.error("INSERT ERROR:", insertError)
    throw new Error('Kon event niet aanmaken')
  }

  revalidatePath('/')
  redirect('/')
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient()
  const eventId = formData.get('event_id') as string
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const venue = formData.get('venue') as string
  const coords = await getCoordinates(venue)
  
  const rawDate = formData.get('start_at') as string
  const fixedDate = fixTimezoneOffset(rawDate) 

  const updateData = {
    title: formData.get('title') as string,
    event_type: formData.get('type') as string,
    start_at: fixedDate, 
    venue_name: venue,
    description: formData.get('description') as string,
    ticket_link: formData.get('ticket_link') as string,
    ticketswap_link: formData.get('ticketswap_link') as string,
    resale_link: formData.get('resale_link') as string,
    lat: coords.lat,
    lon: coords.lon
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) console.error('Update Error:', error)
  revalidatePath('/')
  redirect('/')
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { error, count } = await supabase
    .from('events')
    .delete({ count: 'exact' }) 
    .eq('id', eventId)
    .eq('created_by', user.id) 

  if (error) {
    console.error('Delete Error:', error)
    throw new Error('Database fout bij verwijderen')
  }

  if (count === 0) {
    console.error('Geen event verwijderd. Mogelijk geen rechten.')
    throw new Error('Kon event niet verwijderen: Je bent waarschijnlijk niet de eigenaar.')
  }

  revalidatePath('/')
  redirect('/')
}

export async function getEvent(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()
  return { data, error }
}

// --- OVERIGE ACTIES (RSVP, CHAT, SCRAPER) ---

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
  revalidatePath('/')
}

// Voeg deze interface toe net boven de scrapeEventUrl functie (of bovenaan je bestand)
// zodat we type-safe werken met de gescrapte data.
interface ScrapedEventData {
  title: string;
  description: string;
  venue: string;
  image: string;
  start_at: string | null; // null als we niets vinden
}

export async function scrapeEventUrl(url: string) {
  const cleanUrl = url.split('?')[0];

  // 1. TivoliVredenburg Fail-Fast Check
  // Hun beveiliging is te zwaar voor server-side fetch zonder proxy.
  // We besparen tijd door meteen te zeggen: "Lukt niet, doe maar handmatig".
  if (cleanUrl.includes('tivolivredenburg.nl')) {
      return { 
          success: false, 
          error: 'TivoliVredenburg is beveiligd tegen scrapers. Vul de gegevens handmatig in.' 
      };
  }

  try {
    console.log('--- SCRAPER (Browser Mode) ---');
    console.log('Target:', cleanUrl);

    // 2. Fetch als "Gewone User" (Chrome Windows)
    // Dit werkte het beste bij jouw eerste poging voor Paradiso.
    const response = await fetch(cleanUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/'
      }
    });

    if (!response.ok) {
      return { success: false, error: `Status: ${response.status} - Kon pagina niet laden.` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let foundData: Partial<ScrapedEventData> = {};
    let foundJsonLd = false;

    // --- STAP A: JSON-LD Proberen (Structured Data) ---
    $('script[type="application/ld+json"]').each((_, element) => {
      if (foundJsonLd) return;
      try {
        const rawJson = $(element).html(); // .html() pakt de inhoud binnen <script>
        if (!rawJson) return;
        
        const json = JSON.parse(rawJson);

        const findEventObject = (data: any): any => {
          if (Array.isArray(data)) {
            for (const item of data) {
              const result = findEventObject(item);
              if (result) return result;
            }
          } else if (typeof data === 'object' && data !== null) {
            const type = data['@type'];
            if (typeof type === 'string' && type.includes('Event')) return data;
            if (data['@graph']) return findEventObject(data['@graph']);
          }
          return null;
        };

        const eventJson = findEventObject(json);
        if (eventJson) {
          foundJsonLd = true;
          foundData.title = eventJson.name;
          foundData.description = eventJson.description;
          foundData.start_at = eventJson.startDate;
          
          if (eventJson.image) {
             if (typeof eventJson.image === 'string') foundData.image = eventJson.image;
             else if (eventJson.image.url) foundData.image = eventJson.image.url;
          }

          if (eventJson.location && (eventJson.location.name || eventJson.location.address)) {
             const name = eventJson.location.name || '';
             const addr = eventJson.location.address;
             let city = '';
             if (typeof addr === 'string') city = addr;
             else if (typeof addr === 'object') city = addr.addressLocality || '';
             foundData.venue = city ? `${name}, ${city}` : name;
          }
        }
      } catch (e) { /* Negeer JSON fouten */ }
    });

    // --- STAP B: Meta Tags (De 'Oude' methode die goed werkte voor tekst) ---
    
    if (!foundData.title) {
        foundData.title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    }
    
    if (!foundData.description) {
        foundData.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    }

    if (!foundData.image) {
        foundData.image = $('meta[property="og:image"]').attr('content') || '';
    }

    // --- STAP C: Datum Regex Fallback (De verbeterde versie) ---
    if (!foundData.start_at) {
        // We zoeken in de beschrijving EN in de body (maar beperkt tot 5000 tekens voor snelheid)
        const rawText = (foundData.description || '') + " " + $('body').text().substring(0, 5000);
        
        // Regex voor: 15 januari, 15 jan, 15 jan., 15-01
        const dutchMonths = 'januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|apr|jun|jul|aug|sep|okt|nov|dec';
        const regex = new RegExp(`(\\d{1,2})\\s*(${dutchMonths})`, 'i');
        const match = rawText.match(regex);
        
        if (match) {
             const currentYear = new Date().getFullYear();
             const day = match[1].padStart(2, '0');
             const monthStr = match[2].toLowerCase().replace('.', ''); 

             const monthMap: {[key: string]: string} = {
                 januari: '01', jan: '01', februari: '02', feb: '02',
                 maart: '03', mrt: '03', april: '04', apr: '04',
                 mei: '05', juni: '06', jun: '06',
                 juli: '07', jul: '07', augustus: '08', aug: '08',
                 september: '09', sep: '09', oktober: '10', okt: '10',
                 november: '11', nov: '11', december: '12', dec: '12'
             };
             
             const monthIndex = monthMap[monthStr];
             if (monthIndex) foundData.start_at = `${currentYear}-${monthIndex}-${day}`;
        }
    }

    // --- STAP D: Venue Fallback ---
    if (!foundData.venue) {
        foundData.venue = $('meta[property="og:site_name"]').attr('content') || '';
    }

    // Locatie normalisatie
    const venueCheck = ((cleanUrl + (foundData.title || '')).toLowerCase());
    if (venueCheck.includes('afas')) foundData.venue = 'AFAS Live, Amsterdam';
    if (venueCheck.includes('ziggo')) foundData.venue = 'Ziggo Dome, Amsterdam';
    if (venueCheck.includes('paradiso')) foundData.venue = 'Paradiso, Amsterdam';
    if (venueCheck.includes('melkweg')) foundData.venue = 'Melkweg, Amsterdam';

    return { 
      success: true, 
      data: {
        title: foundData.title || 'Nieuw Event',
        description: foundData.description || '',
        venue: foundData.venue || '',
        image: foundData.image || '',
        start_at: foundData.start_at || ''
      }
    };

  } catch (error) {
    console.error('Scrape error:', error);
    return { success: false, error: 'Technisch probleem bij inlezen' };
  }
}export async function markChatAsRead(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Update de timestamp voor deze user naar NU
  await supabase
    .from('rsvps')
    .update({ last_read_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', user.id)
  
  revalidatePath('/')
}export async function updateAvatar(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Check user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const file = formData.get('avatar') as File
  if (!file) return

  // 2. Upload naar Storage
  // We gebruiken de user-id als bestandsnaam zodat je altijd maar 1 bestand per user hebt (overschrijft de oude)
  // Voeg een timestamp toe om caching issues te voorkomen bij updates
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error('Kon afbeelding niet uploaden')
  }

  // 3. Haal de publieke URL op
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName)

  // 4. Sla de URL op in het profiel
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  revalidatePath('/')
  redirect('/profile') // We sturen ze terug naar de profielpagina
}