'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { apiUpdateMe } from '@/lib/api'
import { ProtectedRoute } from '@/components/ui/protected-route'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  const [name, setName] = useState(user?.full_name || '')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const [nameSaving, setNameSaving] = useState(false)
  const [nameOk, setNameOk] = useState(false)
  const [nameErr, setNameErr] = useState('')

  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdOk, setPwdOk] = useState(false)
  const [pwdErr, setPwdErr] = useState('')

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setNameErr('')
    setNameOk(false)
    setNameSaving(true)
    try {
      await apiUpdateMe({ full_name: name.trim() })
      setNameOk(true)
      setTimeout(() => setNameOk(false), 3000)
    } catch {
      setNameErr('Nie udało się zapisać.')
    } finally {
      setNameSaving(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdErr('')
    setPwdOk(false)
    if (newPwd !== confirmPwd) {
      setPwdErr('Hasła nie są identyczne.')
      return
    }
    if (newPwd.length < 8) {
      setPwdErr('Hasło musi mieć min. 8 znaków.')
      return
    }
    setPwdSaving(true)
    try {
      await apiUpdateMe({ current_password: currentPwd, new_password: newPwd })
      setPwdOk(true)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setTimeout(() => setPwdOk(false), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setPwdErr(msg || 'Nieprawidłowe aktualne hasło.')
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

        {/* Topbar */}
        <header className="sticky top-0 z-50"
                style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <Link href="/dashboard" className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--orange)' }}>
              ← Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: 'linear-gradient(135deg, var(--orange), #1B2A4A)' }}>
                {(user?.full_name?.[0] || user?.email?.[0] || 'K').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-8">

          <h1 className="font-bold mb-7"
              style={{ fontSize: 'clamp(20px,2.5vw,26px)', color: 'var(--text)', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            Mój profil
          </h1>

          {/* Info */}
          <div className="glass-card p-5 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, var(--orange), #1B2A4A)' }}>
              {(user?.full_name?.[0] || user?.email?.[0] || 'K').toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                {user?.full_name || '—'}
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{user?.email}</div>
            </div>
          </div>

          {/* Zmiana imienia */}
          <div className="glass-card p-5 mb-5">
            <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Imię i nazwisko</h2>
            <form onSubmit={saveName} className="flex flex-col gap-3">
              <div>
                <label className="label text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Imię</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-glass w-full"
                  placeholder="Twoje imię"
                />
              </div>
              {nameErr && <p className="text-xs" style={{ color: 'var(--red, #dc2626)' }}>{nameErr}</p>}
              {nameOk && <p className="text-xs" style={{ color: 'var(--green, #16a34a)' }}>✓ Zapisano</p>}
              <button type="submit" disabled={nameSaving} className="btn-primary self-start px-5 py-2 text-sm">
                {nameSaving ? 'Zapisuję...' : 'Zapisz'}
              </button>
            </form>
          </div>

          {/* Zmiana hasła */}
          <div className="glass-card p-5 mb-5">
            <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Zmień hasło</h2>
            <form onSubmit={savePassword} className="flex flex-col gap-3">
              <div>
                <label className="label text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Aktualne hasło</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  className="input-glass w-full"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="label text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Nowe hasło</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  className="input-glass w-full"
                  placeholder="Min. 8 znaków"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="label text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Powtórz nowe hasło</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  className="input-glass w-full"
                  placeholder="••••••••"
                  required
                />
              </div>
              {pwdErr && <p className="text-xs" style={{ color: 'var(--red, #dc2626)' }}>{pwdErr}</p>}
              {pwdOk && <p className="text-xs" style={{ color: 'var(--green, #16a34a)' }}>✓ Hasło zmienione</p>}
              <button type="submit" disabled={pwdSaving} className="btn-primary self-start px-5 py-2 text-sm">
                {pwdSaving ? 'Zmieniam...' : 'Zmień hasło'}
              </button>
            </form>
          </div>

          {/* Wyloguj */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Sesja</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Wylogowanie kończy bieżącą sesję na tym urządzeniu.</p>
            <button onClick={logout}
                    className="text-sm font-medium px-5 py-2 rounded-xl border"
                    style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'transparent' }}>
              Wyloguj
            </button>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  )
}
