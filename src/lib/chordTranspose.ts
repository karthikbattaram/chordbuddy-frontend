// Core chord transposition engine — diatonic chord chart transposer.
// Pragmatic enharmonic spelling (sharp vs flat) chosen per key, matching
// standard chord-chart conventions (not strict classical theory / double-sharps).

export type Mode = 'maj' | 'min';

export interface SongKey {
  root: string; // e.g. 'C', 'C#', 'Bb'
  mode: Mode;
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Pitch class lookup accepts both sharp and flat spellings as input.
const NOTE_TO_PITCH: Record<string, number> = {
  C: 0, 'B#': 0,
  'C#': 1, Db: 1,
  D: 2,
  'D#': 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, 'E#': 5,
  'F#': 6, Gb: 6,
  G: 7,
  'G#': 8, Ab: 8,
  A: 9,
  'A#': 10, Bb: 10,
  B: 11, Cb: 11,
};

// Keys that conventionally use flats in chord charts.
const FLAT_MAJOR_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']);
const FLAT_MINOR_KEYS = new Set(['D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab']);

export function rootToPitchClass(root: string): number {
  const normalized = root.charAt(0).toUpperCase() + root.slice(1);
  const pitchClass = NOTE_TO_PITCH[normalized];
  if (pitchClass === undefined) throw new Error(`Unrecognized root note: ${root}`);
  return pitchClass;
}

interface ParsedChord {
  pitchClass: number;
  suffix: string;
}

function parseChordToken(chordStr: string): ParsedChord {
  const match = chordStr.match(/^([A-Ga-g])(#|b)?(.*)$/);
  if (!match) throw new Error(`Invalid chord: ${chordStr}`);
  const [, letter, accidental = '', suffix] = match;
  const root = letter.toUpperCase() + accidental;
  return { pitchClass: rootToPitchClass(root), suffix };
}

export function isValidChordToken(token: string): boolean {
  try {
    parseChordToken(token);
    return true;
  } catch {
    return false;
  }
}

function spellPitchClass(pitchClass: number, mode: Mode, keyRoot: string): string {
  const useFlats = mode === 'maj' ? FLAT_MAJOR_KEYS.has(keyRoot) : FLAT_MINOR_KEYS.has(keyRoot);
  const table = useFlats ? FLAT_NAMES : SHARP_NAMES;
  return table[((pitchClass % 12) + 12) % 12];
}

/**
 * Transpose a single chord symbol from sourceKey to destKey.
 * Both keys must share the same mode (maj->maj or min->min) — mixing modes
 * would require recomputing scale-degree quality, which this tool doesn't do.
 */
export function transposeChord(chordStr: string, sourceKey: SongKey, destKey: SongKey): string {
  if (sourceKey.mode !== destKey.mode) {
    throw new Error(
      `Source key (${sourceKey.mode}) and destination key (${destKey.mode}) must share the same mode`
    );
  }

  const { pitchClass, suffix } = parseChordToken(chordStr);
  const sourcePitchClass = rootToPitchClass(sourceKey.root);
  const destPitchClass = rootToPitchClass(destKey.root);
  const offset = ((destPitchClass - sourcePitchClass) % 12 + 12) % 12;
  const newPitchClass = (pitchClass + offset) % 12;
  const newRoot = spellPitchClass(newPitchClass, destKey.mode, destKey.root);

  return newRoot + suffix;
}
