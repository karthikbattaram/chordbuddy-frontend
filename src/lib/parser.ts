import { transposeChord, isValidChordToken, type SongKey } from './chordTranspose';

export function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}

// Chord lines are 0, 2, 4… (0-indexed) — i.e. the 1st, 3rd, 5th… line as a human counts them.
function isChordLineIndex(i: number): boolean {
  return i % 2 === 0;
}

export function extractUniqueChordTokens(text: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];

  splitLines(text).forEach((line, i) => {
    if (!isChordLineIndex(i)) return;
    for (const token of line.trim().split(/\s+/)) {
      if (token && !seen.has(token)) {
        seen.add(token);
        tokens.push(token);
      }
    }
  });

  return tokens;
}

export function findInvalidChordTokens(text: string): string[] {
  return extractUniqueChordTokens(text).filter((token) => !isValidChordToken(token));
}

/**
 * Transpose every chord line in a chord/lyric sheet, preserving whitespace
 * (and therefore rough chord-to-syllable alignment) and leaving lyric lines untouched.
 */
export function transposeSongText(text: string, sourceKey: SongKey, destKey: SongKey): string {
  return splitLines(text)
    .map((line, i) => {
      if (!isChordLineIndex(i)) return line;
      return line.replace(/\S+/g, (token) => {
        try {
          return transposeChord(token, sourceKey, destKey);
        } catch {
          return token;
        }
      });
    })
    .join('\n');
}

export interface ChordLyricPair {
  chordLine: string;
  lyricLine?: string;
}

export function toLinePairs(text: string): ChordLyricPair[] {
  const lines = splitLines(text);
  const pairs: ChordLyricPair[] = [];

  for (let i = 0; i < lines.length; i += 2) {
    pairs.push({ chordLine: lines[i] ?? '', lyricLine: lines[i + 1] });
  }

  return pairs;
}
