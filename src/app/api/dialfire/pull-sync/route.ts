// API Route: Dialfire Pull-Sync (Test/Trigger)
// POST /api/dialfire/pull-sync
// Payload: { contact_id: string, dialfire_id: string, campaign_id: string }

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Helper: Invoke Edge Function
async function invokeEdgeFunction(functionName: string, payload: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars')
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Edge Function error ${res.status}: ${text}`)
  }

  return await res.json()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { contact_id, dialfire_id, campaign_id } = body

    if (!contact_id || !dialfire_id || !campaign_id) {
      return Response.json(
        { error: 'Missing required fields: contact_id, dialfire_id, campaign_id' },
        { status: 400 }
      )
    }

    // Verify contact exists
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, dialfire_id')
      .eq('id', contact_id)
      .single()

    if (fetchError || !contact) {
      return Response.json(
        { error: `Contact not found: ${fetchError?.message || 'unknown'}` },
        { status: 404 }
      )
    }

    console.log(`[API] Triggering Dialfire pull-sync for contact ${contact_id}`)

    // Invoke Edge Function
    const result = await invokeEdgeFunction('dialfire-pull-sync', {
      contact_id,
      dialfire_id,
      campaign_id,
    })

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.result?.error_message || 'Sync failed',
          result,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: `Synced ${contact.first_name} ${contact.last_name}`,
      result: result.result,
    })
  } catch (err) {
    console.error('[API] Error:', err)
    return Response.json(
      { error: String(err), success: false },
      { status: 500 }
    )
  }
}
