'use client'

import { useState } from 'react'
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Nieprawidłowy email lub hasło')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,107,53,0.15) 0%, transparent 60%), #0d0f1c' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium tracking-tight">MNIEJ ROBOTY</h1>
          <p className="text-white/40 text-sm mt-1">Zaloguj się do swojego konta</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-glass"
                placeholder="twoj@email.pl"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Hasło</label>
                <Link href="/reset-password" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                  Nie pamiętam hasła
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-glass"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-red-alert text-sm bg-red-alert/10 border border-red-alert/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'Loguję...' : 'Zaloguj się →'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Nie masz konta?{' '}
          <Link href="/register" className="text-orange hover:text-orange/80 transition-colors">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}
