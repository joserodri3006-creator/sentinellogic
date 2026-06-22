// Webhook Endpoint: KlickTipp Sync via Supabase Edge Function
// POST /api/webhooks/klicktipp-sync
// Body: { email, first_name, last_name, phone?, tag, list_id? }

import { NextRequest } from 'next/server'

interface SyncRequest {
  email: string
  first_name: string
  last_name: string
  phone?: string
  tag: string
  list_id?: string
}

async function invokeEdgeFunction(functionName: string, payload: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[invokeEdgeFunction] Starting', { functionName, hasUrl: !!supabaseUrl, hasKey: !!supabaseKey })

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[invokeEdgeFunction] Missing env vars')
    return { success: false, error: 'Missing environment variables' }
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`

  try {
    console.log('[invokeEdgeFunction] Calling:', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(payload),
    })

    console.log('[invokeEdgeFunction] Response status:', res.status)
    const result = await res.json()
    console.log('[invokeEdgeFunction] Result:', result)
    return result
  } catch (err) {
    console.error(`[invokeEdgeFunction] ${functionName} error:`, err)
    return { success: false, error: String(err) }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[POST /api/webhooks/klicktipp-sync] Request:', {
      email: body.email,
      tag: body.tag,
    })

    // Validate required fields
    if (!body.email || !body.first_name || !body.last_name || !body.tag) {
      return Response.json(
        { success: false, error: 'Required fields: email, first_name, last_name, tag' },
        { status: 400 }
      )
    }

    // Call bright-function
    const syncResult = await invokeEdgeFunction('bright-function', {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
      tag: body.tag,
      list_id: body.list_id,
    })

    if (syncResult.success) {
      console.log(`[KlickTipp] Sync erfolgreich: ${body.email} -> ${syncResult.klicktipp_id}`)
      return Response.json({
        success: true,
        data: {
          klicktipp_id: syncResult.klicktipp_id,
          tag: syncResult.tag,
          email: body.email,
        },
      })
    } else {
      console.warn(`[KlickTipp] Sync fehlgeschlagen: ${syncResult.error}`)
      return Response.json(
        { success: false, error: syncResult.error },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[POST /api/webhooks/klicktipp-sync] Error:', err)
    return Response.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'KlickTipp Sync Webhook - POST only',
  })
}
