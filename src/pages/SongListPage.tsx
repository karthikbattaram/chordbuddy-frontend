import { useMemo, useState } from 'react';
import { getAllSongs } from '../lib/storage';
import { navigate } from '../router';
import type { SongKey } from '../lib/chordTranspose';

function formatKey(key: SongKey): string {
  return `${key.root} ${key.mode === 'maj' ? 'Major' : 'Minor'}`;
}

function SongListPage() {
  const [query, setQuery] = useState('');
  const songs = useMemo(() => getAllSongs(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) => s.title.toLowerCase().includes(q));
  }, [songs, query]);

  return (
    <div className="page song-list-page">
      <header className="page-header">
        <h1>Chord Buddy</h1>
      </header>

      <input
        className="search-input"
        type="search"
        placeholder="Search songs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search songs"
      />

      {filtered.length === 0 ? (
        <p className="empty-state">
          {songs.length === 0 ? 'No songs yet. Tap + to add your first one.' : 'No songs match your search.'}
        </p>
      ) : (
        <ul className="song-list">
          {filtered.map((song) => (
            <li key={song.id}>
              <button className="song-row" onClick={() => navigate(`/song/${song.id}`)}>
                <span className="song-title">{song.title}</span>
                <span className="song-key">{formatKey(song.key)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="fab" onClick={() => navigate('/add')} aria-label="Add song">
        +
      </button>
    </div>
  );
}

export default SongListPage;
