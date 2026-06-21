// API Route: Release Notes — Get Stats
// GET /api/release-notes/stats
import { NextRequest } from 'next/server'
import { RELEASE_NOTES } from '@/data/release-notes'

export async function GET(request: NextRequest) {
  try {
    // Aktuelle MVP-Implementierung: keine User-Auth nötig
    // In Zukunft: User aus Session abrufen und personalisierte Stats zeigen

    const latestVersion = RELEASE_NOTES[0]?.version || '0.0.0'
    const totalVersions = RELEASE_NOTES.length

    return Response.json({
      success: true,
      data: {
        latest_version: latestVersion,
        total_versions: totalVersions,
        versions: RELEASE_NOTES.map(r => ({
          version: r.version,
          date: r.date,
          title: r.title,
          summary: r.summary,
          feature_count: r.features.length,
        })),
        // MVP: Annahme dass User noch nichts gesehen hat
        user_has_read: [],
        unread_count: totalVersions,
      },
    })
  } catch (err) {
    console.error('[GET /api/release-notes/stats] Fehler:', err)
    return Response.json({ success: false, error: 'Fehler beim Laden' }, { status: 500 })
  }
}
