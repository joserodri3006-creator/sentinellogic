// Webhook Endpoint: Empfange Daten VON KlickTipp
// POST /api/webhooks/klicktipp-incoming
// KlickTipp sendet: email, first_name, last_name, phone, tags, etc.
// Wir speichern diese Daten in unsere Kontakte-Tabelle

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // KlickTipp sendet normalerweise Form Data, konvertiere zu JSON
    const contentType = request.headers.get('content-type') || ''
    let body: any = {}

    if (contentType.includes('application/json')) {
      body = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData)
    }

    console.log('[POST /api/webhooks/klicktipp-incoming] Received:', {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
    })

    // Validate required fields
    if (!body.email || !body.first_name || !body.last_name) {
      return Response.json(
        {
          success: false,
          error: 'Required fields: email, first_name, last_name',
          received: { email: body.email, first_name: body.first_name, last_name: body.last_name }
        },
        { status: 400 }
      )
    }

    // Normalize email
    const email = String(body.email).trim().toLowerCase()

    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle()

    if (existing) {
      console.log(`[KlickTipp] Contact already exists: ${email}`)
      return Response.json({
        success: true,
        message: 'Contact already exists',
        contact_id: existing.id,
      })
    }

    // Extract tags (KlickTipp sends as comma-separated or array)
    let klicktippTags: string[] = []
    if (body.tags) {
      if (typeof body.tags === 'string') {
        klicktippTags = body.tags.split(',').map((t: string) => t.trim())
      } else if (Array.isArray(body.tags)) {
        klicktippTags = body.tags
      }
    }

    // Create new contact
    const contactData = {
      first_name: String(body.first_name).trim(),
      last_name: String(body.last_name).trim(),
      email,
      phone_mobile: body.phone ? String(body.phone).trim() : null,
      company_name: body.company ? String(body.company).trim() : null,
      source: 'klicktipp',
      status: 'new',
      klicktipp_id: body.klicktipp_id ? String(body.klicktipp_id) : null,
      klicktipp_tags: klicktippTags,
      klicktipp_last_sync: new Date().toISOString(),
      notes: body.notes ? String(body.notes).trim() : null,
      // Initialize pipeline
      pipeline_stage: 'lead_in',
      pipeline_steps: [
        { key: 'lead_in', done: false, completed_at: null, due_date: null },
        { key: 'contacted', done: false, completed_at: null, due_date: null },
        { key: 'data_gathering', done: false, completed_at: null, due_date: null },
        { key: 'wait_policies', done: false, completed_at: null, due_date: null },
        { key: 'calc_offers', done: false, completed_at: null, due_date: null },
        { key: 'download_offers', done: false, completed_at: null, due_date: null },
        { key: 'contract_overview', done: false, completed_at: null, due_date: null },
        { key: 'send_offers', done: false, completed_at: null, due_date: null },
        { key: 'offer_meeting', done: false, completed_at: null, due_date: null },
        { key: 'sales_talk', done: false, completed_at: null, due_date: null },
        { key: 'contracts_store', done: false, completed_at: null, due_date: null },
        { key: 'aftercare', done: false, completed_at: null, due_date: null },
      ],
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single()

    if (error) {
      console.error('[KlickTipp] Database error:', error)
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log(`[KlickTipp] Contact created: ${email} (ID: ${data.id})`)

    return Response.json({
      success: true,
      message: 'Contact created successfully',
      contact_id: data.id,
      email: data.email,
      klicktipp_tags: klicktippTags,
    })
  } catch (err) {
    console.error('[POST /api/webhooks/klicktipp-incoming] Error:', err)
    return Response.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'KlickTipp Incoming Webhook - POST only',
    expected_fields: ['email', 'first_name', 'last_name', 'phone', 'company', 'tags', 'notes', 'klicktipp_id'],
  })
}
