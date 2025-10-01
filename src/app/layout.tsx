import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import { QueryProvider } from '@/components/QueryProvider'
import AuthGuard from '@/components/AuthGuard'
import NotificationProvider from '@/components/NotificationProvider'
import { SidebarProvider } from '@/components/SidebarProvider'
import ChatbotProvider from '../components/ChatbotProvider'

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
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" rel="stylesheet" />
        <link rel="icon" href="./favicon.ico.png" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <SupabaseProvider>
            <SidebarProvider>
              <ChatbotProvider>
                {children}
                <NotificationProvider />
              </ChatbotProvider>
            </SidebarProvider>
          </SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
