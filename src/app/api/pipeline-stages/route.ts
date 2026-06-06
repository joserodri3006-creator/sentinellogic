import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Alle Pipeline-Stages laden
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err: any) {
    console.error('[GET /api/pipeline-stages]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Fehler beim Laden der Pipeline-Stages' },
      { status: 500 }
    )
  }
}

// POST: Neue Pipeline-Stage anlegen
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { key, label, is_optional, maps_to_status, position } = body

    // Validierung
    if (!key || !label || !maps_to_status) {
      return NextResponse.json(
        { success: false, error: 'key, label und maps_to_status sind erforderlich' },
        { status: 400 }
      )
    }

    // Höchste Position finden (falls nicht angegeben)
    const positionValue = position ?? (await getMaxPosition(supabase)) + 1

    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert([
        {
          key,
          label,
          is_optional: is_optional ?? false,
          maps_to_status,
          position: positionValue,
          active: true
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/pipeline-stages]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Fehler beim Erstellen der Pipeline-Stage' },
      { status: 500 }
    )
  }
}

// Hilfsfunktion: Maximale Position ermitteln
async function getMaxPosition(supabase: any): Promise<number> {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return 0
  return data[0].position
}
