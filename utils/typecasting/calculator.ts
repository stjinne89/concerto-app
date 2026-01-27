export type AxisScore = 0 | 1 | 2 | 3 | 4;

export interface UserAnalytics {
  rsvp_going_count: number;
  rsvp_maybe_count: number;
  flake_count: number;
  chat_messages_count: number;
  ratings_given_count: number;
}

export interface TypeCoordinates {
  commitment: AxisScore; 
  social: AxisScore;    
  critic: AxisScore;    
}

/**
 * Berekent de 3D-coördinaten op basis van ruwe database cijfers.
 */
export function calculateCoordinates(stats: UserAnalytics | null): TypeCoordinates {
  // 1. SAFETY NET: Als er geen data is (nieuwe user of nog geen analytics row), 
  // gebruik een standaard object met nullen.
  const safeStats: UserAnalytics = stats || {
    rsvp_going_count: 0,
    rsvp_maybe_count: 0,
    flake_count: 0,
    chat_messages_count: 0,
    ratings_given_count: 0
  };

  return {
    commitment: calculateCommitmentScore(safeStats),
    social: calculateSocialScore(safeStats),
    critic: calculateCriticScore(safeStats),
  };
}

// AS 1: Toewijding
function calculateCommitmentScore(stats: UserAnalytics): AxisScore {
  const { rsvp_going_count, rsvp_maybe_count, flake_count } = stats;
  const totalRsvps = rsvp_going_count + rsvp_maybe_count;

  if (flake_count >= 3) return 0; // "DropOut"
  if (flake_count === 2) return 1; // "FOMO neiging"

  // Geen data = Neutraal (De Onbekende)
  if (totalRsvps === 0) return 2;

  const attendanceRatio = rsvp_going_count / totalRsvps;

  if (attendanceRatio >= 0.9 && rsvp_going_count >= 3) return 4; // "DieHard"
  if (attendanceRatio >= 0.7) return 3;
  if (attendanceRatio >= 0.4) return 2;
  if (attendanceRatio >= 0.2) return 1;
  return 0;
}

// AS 2: Vibe
function calculateSocialScore(stats: UserAnalytics): AxisScore {
  const { chat_messages_count } = stats;

  if (chat_messages_count > 100) return 4; // "Social Butterfly"
  if (chat_messages_count > 50) return 3;
  if (chat_messages_count > 10) return 2;
  if (chat_messages_count > 0) return 1;
  return 0; 
}

// AS 3: Kritiek
function calculateCriticScore(stats: UserAnalytics): AxisScore {
  const { ratings_given_count, rsvp_going_count } = stats;

  if (rsvp_going_count === 0) return 2; // Nog nergens geweest

  const reviewRatio = ratings_given_count / rsvp_going_count;

  if (ratings_given_count > 10 || reviewRatio > 0.8) return 4; // "Review Rockstar"
  if (reviewRatio > 0.5) return 3;
  if (reviewRatio > 0.2) return 2;
  if (ratings_given_count > 0) return 1; 
  return 0; 
}