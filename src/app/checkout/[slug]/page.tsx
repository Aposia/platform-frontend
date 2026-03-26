'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { apiGetProducts, apiCreateStripeSession } from '@/lib/api'

interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  price_pln: number
}

// Modal auth inline — pokazuje się gdy niezalogowany klika "Kup"
function AuthModal({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void
  onClose: () => void
}) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, fullName)
      } else {
        await login(email, password)
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Coś poszło nie tak. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm glass-card p-8 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xl">
          ×
        </button>

        <h3 className="text-lg font-medium mb-1">
          {mode === 'register' ? 'Utwórz konto aby kontynuować' : 'Zaloguj się aby kontynuować'}
        </h3>
        <p className="text-white/40 text-sm mb-6">
          Potrzebujemy Twojego konta żeby przypisać zakup.
        </p>

        <div className="flex gap-2 mb-6 p-1 bg-white/[0.05] rounded-xl">
          {(['register', 'login'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 text-sm py-2 rounded-lg transition-all ${
                mode === m ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}>
              {m === 'register' ? 'Nowe konto' : 'Mam konto'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="input-glass" placeholder="Imię" required />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="input-glass" placeholder="Email" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="input-glass" placeholder="Hasło (min. 8 znaków)" required minLength={8} />

          {error && (
            <p className="text-red-alert text-sm bg-red-alert/10 border border-red-alert/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'Chwilka...' : mode === 'register' ? 'Utwórz konto i kup →' : 'Zaloguj i kup →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const params = useParams()
  const slug = params.slug as string
  const { user } = useAuth()
  const router = useRouter()

  const [showAuth, setShowAuth] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: apiGetProducts,
  })

  const product = products?.find((p: Product) => p.slug === slug)

  async function startCheckout() {
    setError('')
    setCheckoutLoading(true)
    try {
      const { checkout_url } = await apiCreateStripeSession(slug)
      window.location.href = checkout_url
    } catch {
      setError('Nie udało się otworzyć strony płatności. Spróbuj ponownie.')
      setCheckoutLoading(false)
    }
  }

  function handleBuyClick() {
    if (!user) {
      setShowAuth(true)
    } else {
      startCheckout()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,107,53,0.12) 0%, transparent 60%), #0d0f1c' }}>
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => { setShowAuth(false); startCheckout() }}
        />
      )}

      <div className="w-full max-w-md">
        <Link href="/dashboard" className="text-white/30 hover:text-white/60 text-sm mb-8 inline-block transition-colors">
          ← Wróć
        </Link>

        {!product ? (
          <div className="glass-card p-8 text-center">
            <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm">Ładuję produkt...</p>
          </div>
        ) : (
          <div className="glass-card p-8">
            {/* Product info */}
            <div className="mb-8">
              <span className="text-xs text-orange font-medium uppercase tracking-widest">Zakup</span>
              <h1 className="text-2xl font-medium mt-2 mb-2">{product.name}</h1>
              {product.description && (
                <p className="text-white/40 text-sm leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between py-4 border-t border-b border-white/[0.08] mb-6">
              <span className="text-white/50 text-sm">Cena</span>
              <span className="text-2xl font-medium">{product.price_pln} PLN</span>
            </div>

            {/* What you get */}
            <div className="space-y-2 mb-8">
              {['Dostęp natychmiast po zakupie', 'Dostęp dożywotni do kursu', 'Wszystkie aktualizacje materiałów'].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/60">
                  <span className="text-green text-xs">✓</span>
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div className="text-red-alert text-sm bg-red-alert/10 border border-red-alert/20 rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleBuyClick}
              disabled={checkoutLoading}
              className="btn-primary w-full text-center text-base py-4"
            >
              {checkoutLoading
                ? 'Przekierowuję do płatności...'
                : `Kup za ${product.price_pln} PLN →`}
            </button>

            <p className="text-center text-white/25 text-xs mt-4">
              🔒 Bezpieczna płatność · Karta lub BLIK
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
