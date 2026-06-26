import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const url = new URL(request.url)
    const key = url.searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'key parameter required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('system_config')
      .select('config')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[GET /api/config]', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // If not found, return empty config
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          dialfire_campaigns: [],
          dialfire_tasks: [],
          klicktipp_tags: [],
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: data.config,
    })
  } catch (error) {
    console.error('[GET /api/config]', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { key, value } = body

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: 'key and value required' },
        { status: 400 }
      )
    }

    // Upsert config
    const { data, error } = await supabase
      .from('system_config')
      .upsert({
        key,
        config: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/config]', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data?.config,
    })
  } catch (error) {
    console.error('[PATCH /api/config]', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
