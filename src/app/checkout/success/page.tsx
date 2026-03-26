'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export default function CheckoutSuccessPage() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Odśwież listę kursów po zakupie (webhook może chwilę zająć)
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
    }, 2000)
    return () => clearTimeout(timer)
  }, [queryClient])

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(52,199,89,0.12) 0%, transparent 60%), #0d0f1c' }}>
      <div className="w-full max-w-md text-center glass-card p-12">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-medium mb-3">Zakup udany!</h1>
        <p className="text-white/50 mb-2">
          Dostęp do kursu został przyznany na Twoje konto.
        </p>
        <p className="text-white/30 text-sm mb-10">
          Potwierdzenie zostało wysłane na Twój email.
        </p>

        <div className="space-y-3">
          <Link href="/dashboard" className="btn-primary w-full text-center block">
            Zacznij kurs →
          </Link>
          <p className="text-white/25 text-xs">
            Kurs jest dostępny od razu w Twoim panelu.
          </p>
        </div>
      </div>
    </div>
  )
}
