// utils/mapUtils.ts

interface MapEvent {
  id: string;
  lat: number;
  lon: number;
  [key: string]: any;
}

export function applyJitterToEvents(events: MapEvent[]) {
  // VEILIGERE METHODE: Gebruik .map voor een ondiepe kopie ipv JSON parse/stringify
  // Dit voorkomt de "Maximum call stack size exceeded" error.
  const adjustedEvents = events.map(event => ({ ...event })); 
  
  const positions: Record<string, number> = {};

  return adjustedEvents.map((event) => {
    // Zorg dat we met getallen werken
    const lat = Number(event.lat);
    const lon = Number(event.lon);

    // Key afronden op 4 decimalen (ong. 11 meter precisie)
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    if (positions[key] === undefined) {
      positions[key] = 0;
    } else {
      positions[key]++;
      
      const count = positions[key];
      const angle = count * (Math.PI / 2); 
      const offset = 0.00015 * Math.ceil(count / 4); 

      // Pas de gekopieerde event aan
      event.lat = lat + (Math.sin(angle) * offset);
      event.lon = lon + (Math.cos(angle) * offset * 1.5); 
    }
    
    return event;
  });
}