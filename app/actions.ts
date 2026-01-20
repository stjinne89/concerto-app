'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'

// --- HULPFUNCTIE 1: Tijdzone Correctie (1-2 uur verschil fix) ---
function fixTimezoneOffset(dateString: string) {
  if (!dateString) return null
  const inputAsUtc = new Date(dateString)
  const amsterdamDate = new Date(inputAsUtc.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))
  const offset = amsterdamDate.getTime() - inputAsUtc.getTime()
  return new Date(inputAsUtc.getTime() - offset).toISOString()
}

// --- HULPFUNCTIE 2: Adres naar GPS (Geocoding) ---
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
    // Voorkom crash als user geen member is, maar log error
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
  revalidatePath('/')
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
  
  try {
    const response = await fetch(cleanUrl, { 
      cache: 'no-store',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
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

    if (!startDate) {
        const rawText = description + " " + $('body').text();
        const dutchMonths = 'januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december';
        const regex = new RegExp(`(\\d{1,2})\\s*(${dutchMonths})`, 'i');
        const match = rawText.match(regex);
        if (match) {
             startDate = new Date().getFullYear() + '-' + match[2] + '-' + match[1]; 
        }
    }

    if ((cleanUrl + title).toLowerCase().includes('afas')) siteName = 'AFAS Live';
    if ((cleanUrl + title).toLowerCase().includes('ziggo')) siteName = 'Ziggo Dome';

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

// --- 6. EVENT UPDATEN ---
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

// --- 7. EVENT VERWIJDEREN (Verbeterd) ---
export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // We voegen { count: 'exact' } toe om te tellen hoeveel we verwijderen
  const { error, count } = await supabase
    .from('events')
    .delete({ count: 'exact' }) 
    .eq('id', eventId)
    .eq('created_by', user.id) 

  if (error) {
    console.error('Delete Error:', error)
    throw new Error('Database fout bij verwijderen')
  }

  // Als count 0 is, betekent het dat de regel niet verwijderd mocht worden (door RLS) of niet bestond
  if (count === 0) {
    console.error('Geen event verwijderd. Mogelijk geen rechten.')
    throw new Error('Kon event niet verwijderen: Je bent waarschijnlijk niet de eigenaar.')
  }

  revalidatePath('/')
  redirect('/')
}