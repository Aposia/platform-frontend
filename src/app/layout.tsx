import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { QueryProvider } from '@/lib/query-provider'

export const metadata: Metadata = {
  title: 'MNIEJ ROBOTY — Platforma',
  description: 'Twoje kursy i materiały — zaloguj się aby uzyskać dostęp.',
  robots: 'noindex',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
