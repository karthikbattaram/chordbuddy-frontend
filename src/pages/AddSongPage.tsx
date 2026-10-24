import { useState } from 'react';
import { createSong } from '../lib/storage';
import { findInvalidChordTokens } from '../lib/parser';
import { navigate } from '../router';
import { NOTE_OPTIONS } from '../lib/noteOptions';
import type { Mode } from '../lib/chordTranspose';

function AddSongPage() {
  const [title, setTitle] = useState('');
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState<Mode>('maj');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Chords & lyrics are required.');
      return;
    }

    const invalid = findInvalidChordTokens(content);
    if (invalid.length > 0) {
      setError(
        `Unrecognized chord${invalid.length > 1 ? 's' : ''} on a chord line: ${invalid.join(', ')}. ` +
          'Chord lines should be the 1st, 3rd, 5th… lines — double check your line order.'
      );
      return;
    }

    const song = createSong({ title: title.trim(), key: { root, mode }, content, notes: [] });
    navigate(`/song/${song.id}`);
  }

  return (
    <div className="page add-song-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/')} aria-label="Back">
          ←
        </button>
        <h1>Add Song</h1>
      </header>

      <label className="field">
        <span className="field-label">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Amazing Grace"
        />
      </label>

      <div className="field key-field">
        <span className="field-label">Key</span>
        <div className="key-selectors">
          <select value={root} onChange={(e) => setRoot(e.target.value)} aria-label="Key root note">
            {NOTE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} aria-label="Key mode">
            <option value="maj">Major</option>
            <option value="min">Minor</option>
          </select>
        </div>
      </div>

      <label className="field">
        <span className="field-label">Chords &amp; Lyrics</span>
        <p className="callout">
          Line 1, 3, 5… = <strong>chords</strong>. Line 2, 4, 6… = <strong>lyrics</strong>.
        </p>
        <textarea
          className="song-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'C          Amin        D\nAmazing grace, how sweet the sound'}
          rows={14}
        />
      </label>

      {error && <p className="error-message">{error}</p>}

      <button className="primary-button" onClick={handleSave}>
        Save Song
      </button>
    </div>
  );
}

export default AddSongPage;
