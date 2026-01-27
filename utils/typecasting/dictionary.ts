import { TypeCoordinates } from './calculator';

export type BadgeColor = 'gray' | 'red' | 'orange' | 'green' | 'purple' | 'gold';

export interface ArchetypeDefinition {
  name: string;
  description: string;
  badge_color: BadgeColor;
}

// Exacte matches voor specifieke combinaties
const SPECIAL_TYPES: Record<string, ArchetypeDefinition> = {
  // --- De Heilige Graal (Alles max) ---
  '4-4-4': {
    name: 'Headliner Held',
    description: 'De ultieme fan. Je bent er altijd, kent de setlist en houdt de sfeer erin. Een legende in wording.',
    badge_color: 'gold'
  },
  
  // --- As 1: Toewijding Extremen ---
  '0-2-2': {
    name: 'Ghost Ticket',
    description: 'Je meldt je aan, maar bent onzichtbaar. Besta je wel echt?',
    badge_color: 'gray'
  },
  '1-2-2': {
    name: 'Sam Fender',
    description: 'Je wilt wel, maar het leven (of de bank) komt ertussen. "Seventeen Going Under" is jouw anthem.',
    badge_color: 'red'
  },
  '4-2-2': {
    name: 'DieHard Fan',
    description: 'Eerste rij, hekjes-hanger. Weer of geen weer, jij staat er.',
    badge_color: 'purple'
  },
  '3-2-2': {
     name: 'Planner',
     description: 'Je agenda is heilig. Je weet precies waar en wanneer je moet zijn.',
     badge_color: 'green' 
  },

  // --- As 2: Vibe Extremen ---
  '2-4-2': {
    name: 'Chatty Groupie',
    description: 'Je vingers zijn sneller dan de gitarist. Jij houdt de chat levend met memes en hypes.',
    badge_color: 'green'
  },
  '2-0-2': {
    name: 'Backstage Sluiper',
    description: 'Je leest alles, ziet alles, maar zegt niks. De stille kracht op de achtergrond.',
    badge_color: 'gray'
  },
  '2-0-4': {
      name: 'Silent DJ',
      description: 'Je zegt weinig, maar je muzieksmaak spreekt boekdelen.',
      badge_color: 'purple'
  },

  // --- As 3: Kritiek Extremen ---
  '2-2-4': {
    name: 'Review Rockstar',
    description: 'Na het concert wacht iedereen op jouw oordeel. Je sterren zijn heilig.',
    badge_color: 'orange'
  },
  '2-2-0': {
    name: 'Hangmat Hippie',
    description: 'Hier voor de vibes, niet voor de analyse. Lekker chillen, biertje erbij, prima.',
    badge_color: 'green'
  },
  
  // --- Samengestelde Types ---
  '4-4-2': {
    name: 'Tourbus Nomade',
    description: 'Altijd onderweg naar het volgende event en altijd online in de chat.',
    badge_color: 'purple'
  },
  '4-0-4': {
      name: 'Pit Pirate',
      description: 'Je springt in de moshpit en klaagt niet. Intens en aanwezig.',
      badge_color: 'red'
  },
  '0-0-2': {
    name: 'De Onbekende',
    description: 'Nog niet genoeg data om je te plaatsen. Ga mee op pad!',
    badge_color: 'gray'
  }
};

export function getArchetype(coords: TypeCoordinates): ArchetypeDefinition {
  // 1. Check op exacte match (bijv "4-4-4")
  const key = `${coords.commitment}-${coords.social}-${coords.critic}`;
  
  if (SPECIAL_TYPES[key]) {
    return SPECIAL_TYPES[key];
  }

  // 2. Fallback Logica (Dominante As bepalen)
  // Als we geen exacte match hebben, kijken we wat het meest opvalt aan deze persoon.
  
  // Hoge Kritiek? -> Critic types
  if (coords.critic === 4) return SPECIAL_TYPES['2-2-4']; // Review Rockstar base
  
  // Veel chat? -> Social types
  if (coords.social === 4) return SPECIAL_TYPES['2-4-2']; // Chatty Groupie base
  if (coords.social === 0) return SPECIAL_TYPES['2-0-2']; // Backstage Sluiper base
  
  // Weinig commitment? -> Flaker types
  if (coords.commitment === 0) return SPECIAL_TYPES['0-2-2']; // Ghost Ticket base
  if (coords.commitment === 1) return SPECIAL_TYPES['1-2-2']; // Sam Fender base
  
  // Hoge commitment? -> Fan types
  if (coords.commitment === 4) return SPECIAL_TYPES['4-2-2']; // DieHard base

  // Default / Middenmoot
  return {
    name: 'Festival Ganger',
    description: 'Je houdt van muziek en gezelligheid. Een prima basis om door te groeien naar een legende!',
    badge_color: 'green'
  };
}