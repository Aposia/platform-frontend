'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const slug = searchParams.get('product') || ''

  const [show, setShow] = useState(false)

  useEffect(() => {
    // Odśwież listę kursów po zakupie (webhook może chwilę zająć)
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
    }, 2000)
    // Animacja wejścia
    const t2 = setTimeout(() => setShow(true), 80)
    return () => { clearTimeout(timer); clearTimeout(t2) }
  }, [queryClient])

  // Upsell — jeśli kupiono OTO / mniejszy produkt, pokaż ACS
  const showUpsell = slug && !['ai-creator-studio'].includes(slug)

  return (
    <div className="min-h-screen transition-colors duration-300"
         style={{ background: 'var(--bg)' }}>

      {/* Topbar */}
      <header style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
              className="sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--orange)' }}>
            MNIEJ ROBOTY
          </div>
          <Link href="/dashboard" className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-12">

        {/* Hero */}
        <div className={`text-center mb-10 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-bold mb-2"
              style={{ fontSize: 'clamp(22px,3vw,30px)', color: 'var(--text)', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            Zakup udany!
          </h1>
          <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>
            Dostęp do kursu jest już na Twoim koncie.
          </p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Potwierdzenie zostało wysłane na Twój email.
          </p>
        </div>

        {/* CTA główne */}
        <div className={`glass-card p-6 mb-6 transition-all duration-500 delay-100 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="font-semibold mb-1" style={{ color: 'var(--text)', fontSize: 15 }}>
            Zacznij teraz — motywacja jest najwyższa
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Pierwsze 24h po zakupie to złoty czas. Jedna lekcja wystarczy żeby zacząć.
          </p>
          <Link href="/dashboard" className="btn-primary block text-center">
            Otwórz kurs →
          </Link>
        </div>

        {/* Upsell — tylko dla osób które nie kupiły ACS */}
        {showUpsell && (
          <div className={`glass-card p-6 relative overflow-hidden transition-all duration-500 delay-200 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
               style={{ borderColor: 'rgba(var(--orange-rgb),0.3)' }}>
            {/* accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5"
                 style={{ background: 'linear-gradient(90deg, var(--orange), var(--violet))' }} />

            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--orange)' }}>
              🎯 Specjalnie dla Ciebie — tylko teraz
            </div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text)', fontSize: 16 }}>
              AI Creator Studio 2.0
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Pełny system: awatar, Reelsy, posty, brand presence — bez kamery, bez nagrywania.
              Najlepszy kolejny krok po tym co właśnie kupiłaś.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold" style={{ color: 'var(--orange)' }}>299 PLN</span>
              <span className="text-sm line-through" style={{ color: 'var(--muted)' }}>399 PLN</span>
              <span className="badge badge-orange">−25%</span>
            </div>
            <div className="flex gap-3">
              <Link href="/checkout/ai-creator-studio" className="btn-primary flex-1 text-center text-sm py-2.5">
                Odbierz ofertę →
              </Link>
              <Link href="/dashboard"
                    className="text-sm px-4 py-2.5 rounded-xl font-medium"
                    style={{ color: 'var(--muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                Nie teraz
              </Link>
            </div>
          </div>
        )}

        {/* Jeśli kupiono ACS — wróć do kursu */}
        {!showUpsell && (
          <div className={`text-center transition-all duration-500 delay-200 ${show ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Kurs jest dostępny od razu w panelu. Dostęp dożywotni — wróć kiedy chcesz.
            </p>
          </div>
        )}

      </main>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
