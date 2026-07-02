import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getGoogleAuthUrl } from '@/lib/google-oauth'
import { randomBytes } from 'crypto'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 })
    }

    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex')

    // Store state in a temporary table (expires in 10 minutes)
    await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: user.id,
        access_token: '', // Placeholder, will be filled on callback
        scope: state, // Temporarily store state here
      })

    console.log('[Google Auth] Starting OAuth flow for user:', user.id)

    const authUrl = getGoogleAuthUrl(state)

    return NextResponse.json({
      success: true,
      authUrl: authUrl,
    })
  } catch (err) {
    console.error('[Google Auth] Start error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Auth start failed',
    }, { status: 500 })
  }
}
