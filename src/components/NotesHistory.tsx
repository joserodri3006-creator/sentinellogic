'use client'

import { useState, useEffect } from 'react'

interface Note {
  id: string
  contact_id: string
  content: string
  type: 'manual' | 'system' | 'dialfire_sync' | 'activity'
  category: string
  created_by: string
  created_at: string
  updated_at: string
  is_archived: boolean
}

const NOTE_TYPE_ICONS = {
  manual: '✏️',
  system: '⚙️',
  dialfire_sync: '🔄',
  activity: '📋',
}

const NOTE_TYPE_LABELS = {
  manual: 'Manual',
  system: 'System',
  dialfire_sync: 'Dialfire Sync',
  activity: 'Activity',
}

const CATEGORY_COLORS = {
  general: 'bg-gray-100',
  dialfire: 'bg-blue-100',
  klicktipp: 'bg-green-100',
  internal: 'bg-purple-100',
  follow_up: 'bg-orange-100',
  call: 'bg-red-100',
  email: 'bg-yellow-100',
  meeting: 'bg-pink-100',
}

export function NotesHistory({ contactId }: { contactId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  useEffect(() => {
    loadNotes()
  }, [contactId, includeArchived])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/kontakte/${contactId}/notes?includeArchived=${includeArchived}`
      )
      const result = await res.json()
      if (result.success) {
        setNotes(result.data)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Notizen:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const res = await fetch(`/api/kontakte/${contactId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          category: selectedCategory,
          type: 'manual',
          created_by: 'user',
        }),
      })

      const result = await res.json()
      if (result.success) {
        setNewNote('')
        setSelectedCategory('general')
        loadNotes()
      }
    } catch (err) {
      console.error('Fehler beim Speichern der Notiz:', err)
    }
  }

  const handleArchiveNote = async (noteId: string) => {
    try {
      await fetch(`/api/kontakte/${contactId}/notes?noteId=${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true }),
      })
      loadNotes()
    } catch (err) {
      console.error('Fehler beim Archivieren:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Neue Notiz eingeben */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Neue Notiz
          </label>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Notiz eingeben..."
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">Allgemein</option>
            <option value="dialfire">Dialfire</option>
            <option value="klicktipp">KlickTipp</option>
            <option value="internal">Intern</option>
            <option value="follow_up">Folgetermin</option>
            <option value="call">Anruf</option>
            <option value="email">E-Mail</option>
            <option value="meeting">Termin</option>
          </select>

          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Speichern
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-600">Archivierte anzeigen</span>
        </label>
      </div>

      {/* Notizen-Tabelle */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Lädt...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine Notizen vorhanden
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-lg border border-gray-200 ${
                CATEGORY_COLORS[note.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {NOTE_TYPE_ICONS[note.type]}
                  </span>
                  <div>
                    <div className="font-medium text-sm">
                      {NOTE_TYPE_LABELS[note.type]}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(note.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white px-2 py-1 rounded border border-gray-300">
                    {note.category}
                  </span>
                  {note.type === 'manual' && (
                    <button
                      onClick={() => handleArchiveNote(note.id)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                      title="Archivieren"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {note.content}
              </div>

              {/* Footer */}
              <div className="mt-2 text-xs text-gray-600">
                {note.created_by && `von ${note.created_by}`}
                {note.updated_at !== note.created_at && (
                  <span className="ml-2">
                    (bearbeitet: {formatDate(note.updated_at)})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
