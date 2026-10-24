import type { SongKey } from './lib/chordTranspose';

export interface SongNote {
  id: string;
  lineNumber: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  key: SongKey;
  content: string;
  notes: SongNote[];
  createdAt: string;
  updatedAt: string;
}
