'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const { register } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Hasło musi mieć co najmniej 8 znaków'); return }
    setLoading(true)
    try {
      await register(email, password, fullName)
      router.push(redirect)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Błąd rejestracji. Spróbuj ponownie.')
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
          <p className="text-white/40 text-sm mt-1">Utwórz konto i uzyskaj dostęp do kursów</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="label">Imię</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input-glass"
                placeholder="Kasia"
                required
                autoComplete="given-name"
              />
            </div>

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
              <label className="label">Hasło</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-glass"
                placeholder="Min. 8 znaków"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="text-red-alert text-sm bg-red-alert/10 border border-red-alert/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'Tworzę konto...' : 'Utwórz konto →'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Masz już konto?{' '}
          <Link href="/login" className="text-orange hover:text-orange/80 transition-colors">
            Zaloguj się
          </Link>
        </p>

        <p className="text-center text-white/20 text-xs mt-4 px-4">
          Rejestrując się, akceptujesz warunki korzystania z usługi.
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
