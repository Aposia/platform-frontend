'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Restore saved theme
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Nieprawidłowy email lub hasło. Sprawdź dane lub zresetuj hasło.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300"
         style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 text-white font-bold text-xl"
               style={{ background: 'linear-gradient(135deg, var(--orange), #1B2A4A)' }}>
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            Mniej Roboty
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Zaloguj się do swojego konta</p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="twoj@email.pl"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Hasło</label>
                <Link href="/reset-password" className="text-xs font-medium transition-colors"
                      style={{ color: 'var(--muted)' }}>
                  Nie pamiętam hasła
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl"
                   style={{ color: 'var(--red)', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'Loguję...' : 'Zaloguj się →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--muted)' }}>
          Nie masz konta?{' '}
          <Link href="/register" className="font-semibold transition-colors" style={{ color: 'var(--orange)' }}>
            Zarejestruj się
          </Link>
        </p>

      </div>
    </div>
  )
}
