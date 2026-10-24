import type { Song } from '../types';

const STORAGE_KEY = 'chordBuddy.songs';

function readAll(): Song[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Song[]) : [];
  } catch {
    return [];
  }
}

function writeAll(songs: Song[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

export function getAllSongs(): Song[] {
  return readAll().sort((a, b) => a.title.localeCompare(b.title));
}

export function getSongById(id: string): Song | undefined {
  return readAll().find((s) => s.id === id);
}

export function createSong(input: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Song {
  const now = new Date().toISOString();
  const song: Song = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  const songs = readAll();
  songs.push(song);
  writeAll(songs);
  return song;
}

export function updateSong(
  id: string,
  updates: Partial<Pick<Song, 'title' | 'key' | 'content' | 'notes'>>
): Song | undefined {
  const songs = readAll();
  const index = songs.findIndex((s) => s.id === id);
  if (index === -1) return undefined;

  const updated: Song = { ...songs[index], ...updates, updatedAt: new Date().toISOString() };
  songs[index] = updated;
  writeAll(songs);
  return updated;
}

export function deleteSong(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
