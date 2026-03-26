'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CancelContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('product') || ''

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#0d0f1c' }}>
      <div className="w-full max-w-md text-center glass-card p-12">
        <div className="text-5xl mb-6">↩</div>
        <h1 className="text-2xl font-medium mb-3">Płatność anulowana</h1>
        <p className="text-white/40 text-sm mb-10">
          Nie pobrano żadnych opłat. Możesz wrócić i spróbować ponownie.
        </p>

        <div className="space-y-3">
          {slug && (
            <Link href={`/checkout/${slug}`} className="btn-primary w-full text-center block">
              Spróbuj ponownie
            </Link>
          )}
          <Link href="/dashboard"
            className="block text-white/30 hover:text-white/60 text-sm transition-colors">
            Wróć do dashboardu →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  )
}
