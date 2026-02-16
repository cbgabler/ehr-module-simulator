function NotesSection({
  notes,
  noteContent,
  onNoteContentChange,
  onAddNote,
  onDeleteNote,
  noteSubmitting,
  noteError,
  noteDeletingId,
  disabled,
}) {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="notes-section">
      <div className="notes-header">
        <h3>Data Assessment</h3>
      </div>

      {noteError && <div className="notes-error">{noteError}</div>}

      <form className="notes-form" onSubmit={onAddNote}>
        <textarea
          className="notes-input"
          placeholder="Add a note about your observations..."
          value={noteContent}
          onChange={(e) => onNoteContentChange(e.target.value)}
          disabled={disabled || noteSubmitting}
        />
        <button
          type="submit"
          className="notes-submit"
          disabled={disabled || noteSubmitting || !noteContent.trim()}
        >
          {noteSubmitting ? "Saving..." : "Save Note"}
        </button>
      </form>

      {notes && notes.length > 0 ? (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="note-item">
              <div className="note-content">
                <div className="note-text">{note.content}</div>
                <div className="note-timestamp">
                  {formatTimestamp(note.createdAt)}
                </div>
              </div>
              <button
                type="button"
                className="note-delete"
                onClick={() => onDeleteNote(note.id)}
                disabled={noteDeletingId === note.id}
                title="Delete note"
              >
                {noteDeletingId === note.id ? "..." : "×"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-notes">No notes yet. Add observations as you progress through the simulation.</p>
      )}
    </div>
  );
}

export default NotesSection;
