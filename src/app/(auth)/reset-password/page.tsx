'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiRequestPasswordReset, apiConfirmPasswordReset } from '@/lib/api'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'done' | 'error'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiRequestPasswordReset(email)
      setStatus('sent')
    } catch {
      setError('Nie udało się wysłać emaila. Sprawdź adres.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    try {
      await apiConfirmPasswordReset(token, password)
      setStatus('done')
    } catch {
      setError('Link wygasł lub jest nieprawidłowy.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,107,53,0.15) 0%, transparent 60%), #0d0f1c' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium tracking-tight">MNIEJ ROBOTY</h1>
          <p className="text-white/40 text-sm mt-1">
            {token ? 'Ustaw nowe hasło' : 'Resetuj hasło'}
          </p>
        </div>

        <div className="glass-card p-8">
          {status === 'sent' && (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <p className="text-white/70 text-sm">Link do resetu wysłany na <strong>{email}</strong>. Sprawdź skrzynkę.</p>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-white/70 text-sm mb-4">Hasło zostało zmienione.</p>
              <Link href="/login" className="btn-primary inline-block">Zaloguj się →</Link>
            </div>
          )}

          {status === 'idle' && !token && (
            <form onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-glass" placeholder="twoj@email.pl" required />
              </div>
              {error && <p className="text-red-alert text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full text-center">
                {loading ? 'Wysyłam...' : 'Wyślij link →'}
              </button>
            </form>
          )}

          {status === 'idle' && token && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="label">Nowe hasło</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-glass" placeholder="Min. 8 znaków" minLength={8} required />
              </div>
              {error && <p className="text-red-alert text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full text-center">
                {loading ? 'Zmieniam...' : 'Ustaw hasło →'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          <Link href="/login" className="text-orange hover:text-orange/80 transition-colors">
            ← Powrót do logowania
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
