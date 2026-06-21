// API Route: Release Notes — Get All
// GET /api/release-notes
import { RELEASE_NOTES } from '@/data/release-notes'

export async function GET() {
  try {
    // Alle Releases zurückgeben (chronologisch sortiert)
    return Response.json({ success: true, data: RELEASE_NOTES })
  } catch (err) {
    console.error('[GET /api/release-notes] Fehler:', err)
    return Response.json({ success: false, error: 'Fehler beim Laden' }, { status: 500 })
  }
}
