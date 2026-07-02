import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/google-oauth'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect('/login?error=not_authenticated')
    }

    // Get authorization code and state
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect('/dashboard?error=missing_code_or_state')
    }

    console.log('[Google Auth] Callback received for user:', user.id)

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Store tokens in database
    const { error: insertError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('[Google Auth] Failed to store tokens:', insertError)
      return NextResponse.redirect('/dashboard?error=token_storage_failed')
    }

    console.log('[Google Auth] ✅ Tokens stored for user:', user.id)

    // Redirect to dashboard
    return NextResponse.redirect('/dashboard?success=google_auth_connected')
  } catch (err) {
    console.error('[Google Auth] Callback error:', err)
    const errorMsg = err instanceof Error ? err.message : 'OAuth callback failed'
    return NextResponse.redirect(`/dashboard?error=${encodeURIComponent(errorMsg)}`)
  }
}
