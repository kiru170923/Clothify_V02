import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { sendBulkQRFeatureAnnouncement } from '../../../../lib/email'

/**
 * Admin API: Send QR Feature Announcement to All Users
 * POST /api/admin/send-qr-announcement
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url)
    const testMode = searchParams.get('test') === 'true'
    const limit = testMode ? 5 : undefined

    // 3. Fetch all users with emails
    const { data: authUsers, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()

    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Filter out users without email or with test emails
    const validUsers = authUsers.users
      .filter(u => {
        if (!u.email) return false
        
        // Skip test/fake emails
        if (u.email.includes('test') || 
            u.email.includes('fake') || 
            u.email.includes('example.com')) {
          return false
        }
        
        return true
      })
      .map(u => ({
        email: u.email!,
        name: u.user_metadata?.name || u.user_metadata?.full_name || u.email!.split('@')[0]
      }))

    // Limit for test mode
    const usersToEmail = limit ? validUsers.slice(0, limit) : validUsers

    if (usersToEmail.length === 0) {
      return NextResponse.json({ 
        error: 'No valid users found to send emails to',
        totalUsers: authUsers.users.length,
        validUsers: validUsers.length
      }, { status: 400 })
    }

    console.log(`📧 Preparing to send to ${usersToEmail.length} users${testMode ? ' (TEST MODE)' : ''}`)

    // 4. Send bulk emails
    const result = await sendBulkQRFeatureAnnouncement(usersToEmail)

    // 5. Log activity
    await supabaseAdmin
      .from('admin_activity')
      .insert({
        admin_id: user.id,
        action: 'send_qr_announcement_email',
        details: {
          totalUsers: usersToEmail.length,
          successCount: result.success,
          failedCount: result.failed,
          testMode
        }
      })
      .then(() => undefined, () => undefined) // Ignore errors

    return NextResponse.json({
      success: true,
      message: `Emails sent successfully${testMode ? ' (TEST MODE)' : ''}`,
      stats: {
        totalUsers: usersToEmail.length,
        successCount: result.success,
        failedCount: result.failed,
        testMode
      },
      results: result.results
    })

  } catch (error) {
    console.error('Error in send QR announcement API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

