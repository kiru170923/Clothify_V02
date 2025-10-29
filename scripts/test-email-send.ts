/**
 * Test Script: Send QR Announcement Email
 * Usage: npx tsx scripts/test-email-send.ts
 */

import { sendQRFeatureAnnouncement } from '../src/lib/email'

async function main() {
  console.log('📧 Testing QR Feature Announcement Email...\n')

  // Test with your own email
  const testEmail = process.env.TEST_EMAIL || 'your-email@gmail.com'
  
  if (testEmail === 'your-email@gmail.com') {
    console.error('❌ Please set TEST_EMAIL environment variable')
    console.error('Example: TEST_EMAIL=your@email.com npx tsx scripts/test-email-send.ts')
    process.exit(1)
  }

  console.log(`Sending test email to: ${testEmail}\n`)

  const success = await sendQRFeatureAnnouncement({
    to: testEmail,
    userName: 'Test User',
    userEmail: testEmail
  })

  if (success) {
    console.log('\n✅ Email sent successfully!')
    console.log('📥 Check your inbox (and spam folder)')
  } else {
    console.log('\n❌ Failed to send email')
    console.log('Check:')
    console.log('1. RESEND_API_KEY is set in .env.local')
    console.log('2. Email address is valid')
    console.log('3. Resend account is active')
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

