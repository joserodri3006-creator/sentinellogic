'use client'

import { useState, useMemo } from 'react'

interface DialfireResponseTableProps {
  flatView: Record<string, any> | null
}

export function DialfireResponseTable({ flatView }: DialfireResponseTableProps) {
  const [search, setSearch] = useState('')
  const [showSystemFields, setShowSystemFields] = useState(false)

  if (!flatView) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Keine Dialfire-Response vorhanden. Führe einen Sync durch um Daten zu sehen.
      </div>
    )
  }

  // Kategorisiere Felder
  const categorizeField = (key: string): 'contact' | 'insurance' | 'system' => {
    if (key.startsWith('$')) return 'system'
    if (['Versicherungsgesellschaft', 'Zahlweise', 'Beitrag_Vorsorge', 'Sparte', 'Kontoinhaber', 'IBAN', 'Notizen2', 'Inhaltssumme'].includes(key)) {
      return 'insurance'
    }
    return 'contact'
  }

  // Filtere und sortiere Felder
  const filteredFields = useMemo(() => {
    const entries = Object.entries(flatView)
      .filter(([key]) => {
        // System-Felder filtern
        if (key.startsWith('$') && !showSystemFields) return false
        // Such-Filter
        if (search && !key.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))

    // Gruppiere nach Kategorie
    return entries.reduce(
      (acc, [key, value]) => {
        const category = categorizeField(key)
        if (!acc[category]) acc[category] = []
        acc[category].push([key, value])
        return acc
      },
      {} as Record<string, [string, any][]>
    )
  }, [flatView, search, showSystemFields])

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      contact: '👤 Kontaktdaten',
      insurance: '🏢 Versicherungsdaten',
      system: '⚙️ System-Felder',
    }
    return labels[cat] || cat
  }

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      contact: 'bg-blue-50 border-blue-200',
      insurance: 'bg-amber-50 border-amber-200',
      system: 'bg-gray-50 border-gray-200',
    }
    return colors[cat] || 'bg-gray-50 border-gray-200'
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const totalFields = Object.values(filteredFields).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-4">
      {/* Suchfeld & Controls */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-64">
          <label htmlFor="field-search" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nach Feldname suchen
          </label>
          <input
            id="field-search"
            type="text"
            placeholder="z.B. email, IBAN, Firma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            checked={showSystemFields}
            onChange={(e) => setShowSystemFields(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
          />
          System-Felder anzeigen
        </label>
      </div>

      {/* Ergebnis-Zähler */}
      {search && (
        <p className="text-xs text-gray-500">
          {totalFields} {totalFields === 1 ? 'Feld' : 'Felder'} gefunden
        </p>
      )}

      {/* Tabellen pro Kategorie */}
      <div className="space-y-6">
        {Object.entries(filteredFields).map(([category, fields]) => (
          <div key={category} className="overflow-hidden rounded-lg border border-gray-200">
            {/* Kategorie-Header */}
            <div className={`px-4 py-3 border-b border-gray-200 ${getCategoryColor(category)}`}>
              <h3 className="text-sm font-semibold text-gray-900">
                {getCategoryLabel(category)} <span className="text-gray-500 font-normal">({fields.length})</span>
              </h3>
            </div>

            {/* Zeilen */}
            <div className="bg-white divide-y divide-gray-150">
              {fields.map(([key, value], idx) => (
                <div key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 p-4">
                    {/* Feldname */}
                    <div className="font-medium text-gray-900 text-sm break-words">{key}</div>

                    {/* Wert */}
                    <div className="font-mono text-sm text-gray-700 break-words overflow-auto max-h-32">
                      <code className="bg-gray-100 px-2.5 py-1.5 rounded inline-block max-w-full">
                        {formatValue(value)}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {totalFields === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">
            <svg
              className="w-10 h-10 mx-auto mb-2 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Keine Felder gefunden.
          </div>
        )}
      </div>

      {/* Info-Hinweis */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        💡 <strong>Tipp:</strong> Diese Tabelle zeigt die komplette Dialfire API-Response. Alle Felder die hier angezeigt
        werden, können synchronisiert werden.
      </div>
    </div>
  )
}
