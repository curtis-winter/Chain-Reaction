import { VALID_LINKS, GAME_PAIRS } from "./wordBank";

export async function validateLink(word1: string, word2: string): Promise<{ isValid: boolean; reason?: string }> {
  const w1 = word1.toUpperCase();
  const w2 = word2.toUpperCase();
  
  const combinedWithSpace = `${w1} ${w2}`;
  const combinedNoSpace = `${w1}${w2}`;

  if (VALID_LINKS.has(combinedWithSpace) || VALID_LINKS.has(combinedNoSpace)) {
    return { isValid: true, reason: "Valid link found in database." };
  }

  // Basic check for common suffixes if not in DB (optional, but helps)
  // For a truly offline app, we rely on the DB.
  
  return { 
    isValid: false, 
    reason: `"${w1}" and "${w2}" do not form a recognized link in our database.` 
  };
}

export function getDailyPair() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % GAME_PAIRS.length;
  return GAME_PAIRS[index];
}

export function getRandomPair() {
  const index = Math.floor(Math.random() * GAME_PAIRS.length);
  return GAME_PAIRS[index];
}

// Pre-process VALID_LINKS into an adjacency list for faster lookup
const ADJACENCY_LIST: Record<string, Set<string>> = {};

function buildAdjacencyList() {
  if (Object.keys(ADJACENCY_LIST).length > 0) return;
  
  // First pass: Space-separated links
  for (const link of Array.from(VALID_LINKS)) {
    const parts = link.split(' ');
    if (parts.length === 2) {
      const [w1, w2] = parts;
      if (!ADJACENCY_LIST[w1]) ADJACENCY_LIST[w1] = new Set();
      ADJACENCY_LIST[w1].add(w2);
    }
  }

  // Second pass: Compound words (no spaces)
  // We look for ways to split the compound word into two known words from our adjacency list
  const knownWords = new Set(Object.keys(ADJACENCY_LIST));
  for (const link of Array.from(VALID_LINKS)) {
    if (!link.includes(' ')) {
      // Try all possible split points
      for (let i = 1; i < link.length; i++) {
        const w1 = link.slice(0, i);
        const w2 = link.slice(i);
        // If we recognize at least one part, or if it's a known compound link, add it
        // In this game, if "FIREHOUSE" is in VALID_LINKS, "FIRE" -> "HOUSE" is valid.
        if (knownWords.has(w1) || knownWords.has(w2)) {
          if (!ADJACENCY_LIST[w1]) ADJACENCY_LIST[w1] = new Set();
          ADJACENCY_LIST[w1].add(w2);
        }
      }
    }
  }
}

// A more robust way to find neighbors
function getNeighbors(word: string): string[] {
  buildAdjacencyList();
  const w = word.toUpperCase();
  return Array.from(ADJACENCY_LIST[w] || []);
}

export function findShortestPath(startWord: string, targetWord: string): string[] | null {
  const start = startWord.toUpperCase();
  const target = targetWord.toUpperCase();
  
  if (start === target) return [start];

  const queue: [string, string[]][] = [[start, [start]]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const [word, path] = queue.shift()!;

    const neighbors = getNeighbors(word);
    for (const next of neighbors) {
      if (next === target) {
        return [...path, next];
      }
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([next, [...path, next]]);
      }
    }
    
    // Limit search depth to prevent long hangs
    if (path.length > 8) continue;
  }

  return null;
}

export function getDifficulty(path: string[] | null): 'Easy' | 'Medium' | 'Hard' {
  if (!path) return 'Hard';
  const links = path.length - 1;
  if (links <= 3) return 'Easy';
  if (links <= 5) return 'Medium';
  return 'Hard';
}

export function findNextWord(currentWord: string, targetWord: string): string | null {
  const path = findShortestPath(currentWord, targetWord);
  if (path && path.length > 1) {
    return path[1];
  }
  return null;
}
