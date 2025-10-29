/**
 * Email Service using Resend
 * Free tier: 100 emails/day, 3000 emails/month
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface EmailOptions {
  to: string
  userName: string
  userEmail: string
}

/**
 * Send QR Feature Announcement Email
 */
export async function sendQRFeatureAnnouncement(options: EmailOptions): Promise<boolean> {
  const { to, userName, userEmail } = options

  try {
    // Check if Resend API key exists
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not found in environment variables')
      return false
    }

    // Load email templates
    const htmlTemplate = readFileSync(
      join(process.cwd(), 'src/lib/email-templates/qr-feature-announcement.html'),
      'utf-8'
    )
    const textTemplate = readFileSync(
      join(process.cwd(), 'src/lib/email-templates/qr-feature-announcement.txt'),
      'utf-8'
    )

    // Replace placeholders
    const html = htmlTemplate
      .replace(/\{\{USER_NAME\}\}/g, userName)
      .replace(/\{\{USER_EMAIL\}\}/g, userEmail)
    
    const text = textTemplate
      .replace(/\{\{USER_NAME\}\}/g, userName)
      .replace(/\{\{USER_EMAIL\}\}/g, userEmail)

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Clothify <noreply@clothify.top>',
        to: [to],
        subject: '✨ Tính năng mới: QR Code Thử Đồ Ảo - Clothify',
        html,
        text
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Resend API error:', data)
      return false
    }

    console.log('✅ Email sent successfully:', data.id)
    return true

  } catch (error) {
    console.error('❌ Error sending email:', error)
    return false
  }
}

/**
 * Send bulk emails with rate limiting
 */
export async function sendBulkQRFeatureAnnouncement(
  users: Array<{ email: string; name: string }>
): Promise<{ success: number; failed: number; results: Array<{ email: string; success: boolean }> }> {
  
  const results: Array<{ email: string; success: boolean }> = []
  let successCount = 0
  let failedCount = 0

  console.log(`📧 Starting bulk email send to ${users.length} users...`)

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    
    console.log(`[${i + 1}/${users.length}] Sending to ${user.email}...`)

    const success = await sendQRFeatureAnnouncement({
      to: user.email,
      userName: user.name || 'Bạn',
      userEmail: user.email
    })

    results.push({ email: user.email, success })
    
    if (success) {
      successCount++
    } else {
      failedCount++
    }

    // Rate limiting: Wait 1 second between emails to avoid hitting API limits
    if (i < users.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`\n📊 Bulk email summary:`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failedCount}`)

  return { success: successCount, failed: failedCount, results }
}

