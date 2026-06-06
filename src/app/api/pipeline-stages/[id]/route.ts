import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH: Pipeline-Stage aktualisieren
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = context.params
    const body = await request.json()

    // Nur erlaubte Felder updaten
    const updates: Record<string, any> = {}
    const allowedFields = ['label', 'is_optional', 'maps_to_status', 'position', 'active', 'key']

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine gültigen Felder zum Aktualisieren' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('pipeline_stages')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pipeline-Stage nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: data[0] }, { status: 200 })
  } catch (err: any) {
    console.error('[PATCH /api/pipeline-stages/[id]]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Fehler beim Aktualisieren der Pipeline-Stage' },
      { status: 500 }
    )
  }
}

// DELETE: Pipeline-Stage löschen
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = context.params

    // Sicherheitsprüfung: Nicht löschen wenn noch Leads diese Stage verwenden
    const { data: leadsWithStage, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('pipeline_stage', id)
      .limit(1)

    if (leadsError) throw leadsError
    if (leadsWithStage && leadsWithStage.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Kann nicht löschen: Leads verwenden diese Stage noch' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Pipeline-Stage gelöscht' }, { status: 200 })
  } catch (err: any) {
    console.error('[DELETE /api/pipeline-stages/[id]]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Fehler beim Löschen der Pipeline-Stage' },
      { status: 500 }
    )
  }
}
