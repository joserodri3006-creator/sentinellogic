// API Route: Release Notes — Mark as Viewed
// POST /api/release-notes/mark-viewed
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { version } = body

    if (!version) {
      return Response.json(
        { success: false, error: 'Version erforderlich' },
        { status: 400 }
      )
    }

    // Hier würde normaler Weise der User aus der Session kommen
    // Für MVP: silently succeed (tracking kann später hinzugefügt werden)
    // Die Tabelle ist bereit für User-Tracking via RLS

    return Response.json({ success: true })
  } catch (err) {
    console.error('[POST /api/release-notes/mark-viewed] Fehler:', err)
    return Response.json({ success: false, error: 'Fehler beim Speichern' }, { status: 500 })
  }
}
