'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'

// --- HULPFUNCTIES ---

function fixTimezoneOffset(dateString: string) {
  if (!dateString) return null
  const inputAsUtc = new Date(dateString)
  if (isNaN(inputAsUtc.getTime())) return null
  
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
  return null
}

export async function getGroupName(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single()
  
  return data?.name || null
}

// --- 1. AUTHENTICATIE ---

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Kon niet inloggen. Controleer je gegevens.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email: email
    })
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// --- 2. EVENTS: CREATE (Aanmaken) ---

export async function createEvent(data: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Probeer coördinaten te vinden
  let lat = null
  let lon = null
  
  if (data.venue) {
    const coords = await getCoordinates(data.venue)
    if (coords) {
        lat = coords.lat
        lon = coords.lon
    }
  }

  const { error } = await supabase
    .from('events')
    .insert({
      title: data.title,
      venue_name: data.venue,
      start_at: data.start_at,
      event_type: data.type,
      ticket_link: data.ticket_link,
      ticketswap_link: data.ticketswap_link,
      resale_link: data.resale_link,
      description: data.description,
      created_by: user.id,
      latitude: lat,
      longitude: lon,
      group_id: data.group_id // Koppel aan groep (of null voor publiek)
    })

  if (error) {
    console.error('Create Event Error:', error)
    return { success: false, error }
  }

  revalidatePath('/')
  
  if (data.group_id) {
      redirect(`/?group=${data.group_id}`)
  } else {
      redirect('/')
  }
}

// --- 3. EVENTS: READ (Ophalen voor edit) ---

export async function getEvent(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  
  return data
}

// --- 4. EVENTS: UPDATE (Bewerken) ---

export async function updateEvent(eventId: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Coördinaten updaten indien nodig
  let lat = null
  let lon = null
  if (data.venue) {
      const coords = await getCoordinates(data.venue)
      if (coords) {
          lat = coords.lat
          lon = coords.lon
      }
  }

  // We gebruiken hier een update object
  const updateData: any = {
      title: data.title,
      venue_name: data.venue,
      start_at: data.start_at,
      event_type: data.type,
      ticket_link: data.ticket_link,
      ticketswap_link: data.ticketswap_link,
      resale_link: data.resale_link,
      description: data.description,
  }

  // Alleen lat/lon updaten als we nieuwe hebben gevonden, anders laten we de oude staan
  // (Of we kunnen zeggen: als venue verandert, overschrijf coords. Voor nu simpel houden)
  if (lat && lon) {
      updateData.latitude = lat
      updateData.longitude = lon
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .eq('created_by', user.id) // Veiligheidscheck: ben jij de maker?

  if (error) {
    console.error('Update Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  // We sturen niet direct terug met redirect, maar laten de client dat doen of we doen het hier
  // In dit geval returnen we success, zodat de client kan redirecten
  return { success: true }
}

// --- 5. EVENTS: DELETE (Verwijderen) ---

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('created_by', user.id) // Veiligheidscheck

  if (error) {
    console.error('Delete Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

// --- 6. GROEP JOINEN MET CODE ---

export async function joinGroupWithCode(formData: FormData) {
  const code = formData.get('code') as string
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!code) return { success: false, error: 'Geen code ingevuld' }

  // Gebruik de veilige RPC functie
  const { data: groupId, error } = await supabase
    .rpc('join_group_by_code', { input_code: code })

  if (error) {
    console.error('Join Error:', error)
    return { success: false, error: 'Er ging iets mis bij het zoeken.' }
  }

  if (!groupId) {
    return { success: false, error: 'Ongeldige code' }
  }

  revalidatePath('/')
  redirect(`/?group=${groupId}`)
}

// --- 7. OVERIGE (Scraping, etc.) ---

export async function scrapeEventUrl(url: string) {
  if (!url) return { success: false }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    let title = $('meta[property="og:title"]').attr('content') || $('title').text()
    let description = $('meta[property="og:description"]').attr('content')
    let venue = ''
    let start_at = ''

    title = title?.split('|')[0].trim() || ''

    return {
      success: true,
      data: {
        title,
        venue,
        description,
        start_at
      }
    }

  } catch (error) {
    console.error('Scraping failed:', error)
    return { success: false }
  }
}

export async function markAsRead(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('rsvps')
    .update({ last_read_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', user.id)
  
  revalidatePath('/')
}

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const file = formData.get('avatar') as File
  if (!file) return

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

  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName)

  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  revalidatePath('/profile')
}
// --- GROEP PROFIEL & MUZIEK ---

export async function updateGroupProfile(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const description = formData.get('description') as string
  const imageFile = formData.get('image') as File
  
  const updates: any = { description }

  // Afbeelding uploaden als die er is
  if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${groupId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('group-images')
        .upload(fileName, imageFile, { upsert: true })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('group-images')
          .getPublicUrl(fileName)
        updates.image_url = publicUrl
      }
  }

  await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)

  revalidatePath('/')
}

export async function addMusic(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const groupId = formData.get('group_id') as string
    const url = formData.get('url') as string
    
    // Simpele check of het een spotify link is
    if (!url.includes('spotify.com')) return

    await supabase.from('group_music').insert({
        group_id: groupId,
        user_id: user.id,
        url: url
    })

    revalidatePath('/')
}

export async function getGroupMusic(groupId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('group_music')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10)
    
    return data || []
}