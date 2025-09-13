import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import AuthDebugger from '@/components/AuthDebugger'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Clothify - Thử đồ thông minh với AI',
  description: 'Trải nghiệm công nghệ thử đồ AI tiên tiến. Tạo ảnh thử đồ chuyên nghiệp chỉ trong vài giây.',
  keywords: 'thử đồ AI, virtual try-on, thời trang, AI fashion, Clothify',
  openGraph: {
    title: 'Clothify - Thử đồ thông minh với AI',
    description: 'Trải nghiệm công nghệ thử đồ AI tiên tiến',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
          <AuthDebugger />
        </SupabaseProvider>
      </body>
    </html>
  )
}
