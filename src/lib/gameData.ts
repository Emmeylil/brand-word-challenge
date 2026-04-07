export interface GameRound {
  id?: string;
  word: string;
  hint: string;
  revealedIndices: number[];
  timeLimit: number;
}

export const campaigns: GameRound[] = [
  { word: "PLAY", hint: "Hint: it has to do with games", revealedIndices: [0, 3], timeLimit: 45 },
  { word: "BRAND", hint: "Hint: every company needs one", revealedIndices: [0], timeLimit: 40 },
  { word: "ENGAGE", hint: "Hint: what you want from your audience", revealedIndices: [0, 5], timeLimit: 40 },
  { word: "SHARE", hint: "Hint: spread the word", revealedIndices: [0], timeLimit: 35 },
  { word: "REWARD", hint: "Hint: everyone loves a prize", revealedIndices: [0, 5], timeLimit: 35 },
  { word: "VIRAL", hint: "Hint: the dream of every marketer", revealedIndices: [4], timeLimit: 30 },
  { word: "CAMPAIGN", hint: "Hint: a strategic marketing effort", revealedIndices: [0, 7], timeLimit: 30 },
  { word: "LOYALTY", hint: "Hint: keep them coming back", revealedIndices: [0], timeLimit: 25 },
];

export const badges = [
  { name: "Word Rookie", emoji: "🌟", threshold: 1 },
  { name: "Quick Thinker", emoji: "⚡", threshold: 3 },
  { name: "Word Master", emoji: "🏆", threshold: 5 },
  { name: "Campaign Hero", emoji: "👑", threshold: 8 },
];

export function getBadge(roundsWon: number) {
  return [...badges].reverse().find(b => roundsWon >= b.threshold) ?? null;
}
