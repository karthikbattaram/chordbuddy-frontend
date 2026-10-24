import { useMemo, useState } from 'react';
import { getSongById, updateSong } from '../lib/storage';
import { splitLines, toLinePairs, transposeSongText } from '../lib/parser';
import { navigate } from '../router';
import { NOTE_OPTIONS } from '../lib/noteOptions';
import type { SongNote } from '../types';

interface Props {
  songId: string;
}

// Note line numbers are 1-indexed over the raw song text; a pair groups
// raw lines (2i+1, 2i+2), so this maps a line number back to its pair index.
function pairIndexForLine(lineNumber: number): number {
  return Math.floor((lineNumber - 1) / 2);
}

function formatLinePreview(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '(blank line)';
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

// A note draft being added/edited in the modal. id is null while creating a new note.
interface NoteDraft {
  id: string | null;
  lineNumber: string;
  text: string;
}

function SongViewPage({ songId }: Props) {
  const song = useMemo(() => getSongById(songId), [songId]);

  const [destRoot, setDestRoot] = useState(song?.key.root ?? 'C');
  const [isTransposing, setIsTransposing] = useState(false);
  const [displayContent, setDisplayContent] = useState(song?.content ?? '');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [notes, setNotes] = useState<SongNote[]>(song?.notes ?? []);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  if (!song) {
    return (
      <div className="page">
        <p className="empty-state">Song not found.</p>
        <button className="primary-button" onClick={() => navigate('/')}>
          Back to songs
        </button>
      </div>
    );
  }

  const currentSong = song;
  const mode = currentSong.key.mode;

  function handleTransposeChange(newRoot: string) {
    setDestRoot(newRoot);
    setSavedMessage(null);

    if (newRoot === currentSong.key.root) {
      setDisplayContent(currentSong.content);
      return;
    }

    setIsTransposing(true);
    // Small artificial delay so the "Transcribing…" state is visible — the
    // computation itself is effectively instant.
    window.setTimeout(() => {
      const transposed = transposeSongText(currentSong.content, currentSong.key, {
        root: newRoot,
        mode,
      });
      setDisplayContent(transposed);
      setIsTransposing(false);
    }, 400);
  }

  function handleSave() {
    updateSong(currentSong.id, { key: { root: destRoot, mode }, content: displayContent });
    setSavedMessage(`Saved in ${destRoot} ${mode === 'maj' ? 'Major' : 'Minor'}.`);
  }

  function closeNotesModal() {
    setShowNotesModal(false);
    setNoteDraft(null);
    setNoteError(null);
  }

  function startAddNote() {
    setNoteDraft({ id: null, lineNumber: '', text: '' });
    setNoteError(null);
  }

  function startEditNote(target: SongNote) {
    setNoteDraft({ id: target.id, lineNumber: String(target.lineNumber), text: target.text });
    setNoteError(null);
  }

  function handleSaveNoteDraft() {
    if (!noteDraft) return;

    const lineNumber = Number(noteDraft.lineNumber);

    if (!noteDraft.lineNumber || !Number.isInteger(lineNumber)) {
      setNoteError('Please select a line.');
      return;
    }
    if (!noteDraft.text.trim()) {
      setNoteError('Note text is required.');
      return;
    }

    const updatedNotes = noteDraft.id
      ? notes.map((n) => (n.id === noteDraft.id ? { ...n, lineNumber, text: noteDraft.text.trim() } : n))
      : [...notes, { id: crypto.randomUUID(), lineNumber, text: noteDraft.text.trim() }];

    setNotes(updatedNotes);
    updateSong(currentSong.id, { notes: updatedNotes });
    setNoteDraft(null);
    setNoteError(null);
  }

  function handleDeleteNote(id: string) {
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    updateSong(currentSong.id, { notes: updatedNotes });
  }

  const sourceLines = splitLines(currentSong.content);
  const pairs = toLinePairs(displayContent);

  const notesByPairIndex = new Map<number, SongNote[]>();
  for (const n of notes) {
    const idx = pairIndexForLine(n.lineNumber);
    notesByPairIndex.set(idx, [...(notesByPairIndex.get(idx) ?? []), n]);
  }

  const sortedNotes = [...notes].sort((a, b) => a.lineNumber - b.lineNumber);

  return (
    <div className="page song-view-page">
      <header className="page-header sticky">
        <button className="back-button" onClick={() => navigate('/')} aria-label="Back">
          ←
        </button>
        <h1 className="song-title-header">{song.title}</h1>
      </header>

      <div className="transpose-bar sticky">
        <label className="transpose-label">
          Key
          <select
            value={destRoot}
            onChange={(e) => handleTransposeChange(e.target.value)}
            aria-label="Transpose to key"
          >
            {NOTE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <span className="mode-pill">{mode === 'maj' ? 'Major' : 'Minor'}</span>
        <button className="save-button" onClick={handleSave} disabled={isTransposing}>
          Save
        </button>
      </div>

      {savedMessage && <p className="saved-toast">{savedMessage}</p>}

      <button className="edit-notes-button" onClick={() => setShowNotesModal(true)}>
        Edit Notes{notes.length > 0 ? ` (${notes.length})` : ''}
      </button>

      {isTransposing ? (
        <div className="loader">
          <div className="spinner" />
          <p>Transcribing…</p>
        </div>
      ) : (
        <div className="chord-sheet">
          {pairs.map((pair, i) => (
            <div className="line-pair" key={i}>
              <div className="line-row">
                <span className="line-number">{2 * i + 1}</span>
                <pre className="chord-line">{pair.chordLine || ' '}</pre>
              </div>
              {pair.lyricLine !== undefined && (
                <div className="line-row">
                  <span className="line-number">{2 * i + 2}</span>
                  <pre className="lyric-line">{pair.lyricLine || ' '}</pre>
                </div>
              )}
              {(notesByPairIndex.get(i) ?? []).map((n) => (
                <p className="inline-note" key={n.id}>
                  <span className="note-line-badge">Line {n.lineNumber}</span> {n.text}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {showNotesModal && (
        <div className="modal-backdrop" onClick={closeNotesModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Notes</h2>
              <button className="back-button" onClick={closeNotesModal} aria-label="Close">
                ×
              </button>
            </div>

            {noteDraft ? (
              <div className="note-editor">
                <label className="field">
                  <span className="field-label">Line</span>
                  <select
                    value={noteDraft.lineNumber}
                    onChange={(e) => setNoteDraft({ ...noteDraft, lineNumber: e.target.value })}
                  >
                    <option value="" disabled>
                      Select a line…
                    </option>
                    {sourceLines.map((line, i) => (
                      <option key={i} value={i + 1}>
                        {`${i + 1}. ${formatLinePreview(line)}`}
                      </option>
                    ))}
                  </select>
                  {noteDraft.lineNumber && (
                    <p className="line-preview">
                      Annotating: “{formatLinePreview(sourceLines[Number(noteDraft.lineNumber) - 1] ?? '')}”
                    </p>
                  )}
                </label>
                <label className="field">
                  <span className="field-label">Note</span>
                  <textarea
                    className="note-textarea"
                    value={noteDraft.text}
                    onChange={(e) => setNoteDraft({ ...noteDraft, text: e.target.value })}
                    placeholder="e.g. slow down here"
                    rows={3}
                  />
                </label>
                {noteError && <p className="error-message">{noteError}</p>}
                <div className="note-editor-actions">
                  <button className="secondary-button" onClick={() => setNoteDraft(null)}>
                    Cancel
                  </button>
                  <button className="primary-button" onClick={handleSaveNoteDraft}>
                    Save Note
                  </button>
                </div>
              </div>
            ) : (
              <>
                {sortedNotes.length === 0 ? (
                  <p className="empty-state">No notes yet.</p>
                ) : (
                  <ul className="notes-list">
                    {sortedNotes.map((n) => (
                      <li className="note-card" key={n.id}>
                        <span className="note-card-text">
                          <span className="note-line-badge">Line {n.lineNumber}</span> {n.text}
                        </span>
                        <div className="note-card-actions">
                          <button className="text-button" onClick={() => startEditNote(n)}>
                            Edit
                          </button>
                          <button className="text-button danger" onClick={() => handleDeleteNote(n.id)}>
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button className="add-note-button" onClick={startAddNote}>
                  + Add Note
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SongViewPage;
