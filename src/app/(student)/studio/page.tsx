'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/ui/protected-route'
import {
  apiStudioBalance,
  apiStartWizard,
  apiWizardStatus,
  apiWizardResult,
} from '@/lib/api'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Photo {
  scene: string
  style: 'ugc' | 'pro'
  b64: string
  tip: string
}

interface WizardResult {
  wizard_id: string
  avatar_id: string
  portrait_b64: string
  photos: Photo[]
  archetype_tip: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ARCHETYPES = [
  {
    key: 'ekspertka',
    label: 'Ekspertka',
    emoji: '🎓',
    desc: 'Coach, konsultantka, specjalistka — autorytet w swojej dziedzinie',
    tip: 'Styl PRO buduje autorytet i profesjonalny wizerunek.',
  },
  {
    key: 'towarzyszka',
    label: 'Towarzyszka',
    emoji: '🤝',
    desc: 'UGC creator, community builder — bliska i autentyczna',
    tip: 'UGC buduje 4x więcej zaufania niż zdjęcia studyjne.',
  },
  {
    key: 'liderka',
    label: 'Liderka',
    emoji: '🚀',
    desc: 'CEO, founder, thought leader — wizja i sprawczość',
    tip: 'Mix PRO i UGC — profesjonalizm plus dostępność.',
  },
  {
    key: 'tworzczyni',
    label: 'Twórczyni',
    emoji: '🎨',
    desc: 'Artystka, twórczyni contentu, osobowość internetu',
    tip: 'Naturalne, kreatywne sceny — autentyczność to Twoja supermoc.',
  },
]

const STYLE_LABELS: Record<string, string> = {
  ugc: 'Naturalny (UGC)',
  pro: 'Profesjonalny',
}

const SCENE_LABELS: Record<string, string> = {
  kawiarnia: 'Kawiarnia',
  home_office: 'Home office',
  outdoor: 'Plener',
  event: 'Prezentacja',
  portrait: 'Portret studyjny',
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-strong)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: 'var(--orange)' }}
      />
    </div>
  )
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  const steps = ['Wygląd', 'Archetyp', 'Szczegóły', 'Generowanie']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i + 1 < current
                  ? 'text-white'
                  : i + 1 === current
                  ? 'text-white'
                  : 'text-[var(--muted)]'
              )}
              style={{
                background:
                  i + 1 <= current ? 'var(--orange)' : 'var(--border-strong)',
              }}
            >
              {i + 1 < current ? '✓' : i + 1}
            </div>
            <span
              className="text-[10px] font-medium hidden sm:block"
              style={{
                color: i + 1 === current ? 'var(--orange)' : 'var(--muted)',
              }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-px w-8 sm:w-16 mx-1 transition-all"
              style={{
                background: i + 1 < current ? 'var(--orange)' : 'var(--border-strong)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Credit badge ───────────────────────────────────────────────────────────────

function CreditBadge({ balance }: { balance: number | null }) {
  if (balance === null) return null
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
      style={{
        background: 'rgba(var(--orange-rgb),0.1)',
        color: 'var(--orange)',
        border: '1px solid rgba(var(--orange-rgb),0.2)',
      }}
    >
      <span>⚡</span>
      <span>{balance} kredytów</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function StudioPage() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [balance, setBalance] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [archetype, setArchetype] = useState('')
  const [avatarName, setAvatarName] = useState('')
  const [businessContext, setBusinessContext] = useState('')
  const [wizardId, setWizardId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('Inicjalizuję...')
  const [result, setResult] = useState<WizardResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null)
  const [styleFilter, setStyleFilter] = useState<'all' | 'ugc' | 'pro'>('all')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load balance
  useEffect(() => {
    apiStudioBalance()
      .then((d) => setBalance(d.balance))
      .catch(() => {})
  }, [])

  // Polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback(
    (id: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiWizardStatus(id)
          setProgress(status.progress)
          setProgressMsg(status.message)

          if (status.status === 'done') {
            stopPolling()
            const res = await apiWizardResult(id)
            setResult(res)
            setStep(5)
            apiStudioBalance()
              .then((d) => setBalance(d.balance))
              .catch(() => {})
          } else if (status.status === 'error') {
            stopPolling()
            setError(status.message || 'Wystąpił błąd podczas generowania.')
          }
        } catch {
          stopPolling()
          setError('Utracono połączenie z serwerem.')
        }
      }, 4000)
    },
    [stopPolling]
  )

  useEffect(() => () => stopPolling(), [stopPolling])

  // Handlers
  const handleStart = async () => {
    setError(null)
    setStep(4)
    setProgress(0)
    setProgressMsg('Uruchamiam wizard...')

    try {
      const res = await apiStartWizard({
        description,
        archetype,
        avatar_name: avatarName || 'Mój awatar',
        business_context: businessContext || undefined,
      })
      setWizardId(res.wizard_id)
      startPolling(res.wizard_id)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Nie udało się uruchomić generowania.'
      setError(msg)
      setStep(3)
    }
  }

  const handleReset = () => {
    stopPolling()
    setStep(1)
    setDescription('')
    setArchetype('')
    setAvatarName('')
    setBusinessContext('')
    setWizardId(null)
    setProgress(0)
    setResult(null)
    setError(null)
    setActivePhoto(null)
    apiStudioBalance()
      .then((d) => setBalance(d.balance))
      .catch(() => {})
  }

  const downloadPhoto = (photo: Photo, index: number) => {
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${photo.b64}`
    link.download = `avatar-${photo.scene}-${photo.style}-${index + 1}.png`
    link.click()
  }

  const downloadAll = () => {
    if (!result) return
    const photos = styleFilter === 'all' ? result.photos : result.photos.filter((p) => p.style === styleFilter)
    photos.forEach((p, i) => downloadPhoto(p, i))
    const portraitLink = document.createElement('a')
    portraitLink.href = `data:image/png;base64,${result.portrait_b64}`
    portraitLink.download = 'avatar-portret-bazowy.png'
    portraitLink.click()
  }

  const filteredPhotos = result
    ? styleFilter === 'all'
      ? result.photos
      : result.photos.filter((p) => p.style === styleFilter)
    : []

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: 'var(--font-instrument-serif, Georgia, serif)', fontStyle: 'italic', color: 'var(--text)' }}
              >
                AI Creator Studio
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Zaprojektuj swojego awatara. Zero narzędzi — sama kreatywność.
              </p>
            </div>
            <CreditBadge balance={balance} />
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="rounded-xl p-4 mb-6 text-sm"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Step 1 — Wygląd */}
          {step === 1 && (
            <div className="glass-card p-6 sm:p-8">
              <Steps current={1} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Jak wygląda Twój awatar?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Opisz wygląd fikcyjnej postaci AI — kolor włosów, oczy, styl, wiek, energia. Im więcej szczegółów, tym lepszy efekt.
              </p>
              <textarea
                className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all"
                style={{
                  background: 'var(--surface-2)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text)',
                  minHeight: 120,
                }}
                placeholder="np. Brunetka, długie proste włosy, zielone oczy, ok. 32 lata, naturalny makijaż, styl casual-elegancki, ciepła energia life coacha..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = 'var(--orange)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <div className="flex justify-end mt-4">
                <button
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                  style={{ background: 'var(--orange)', color: '#fff' }}
                  disabled={description.trim().length < 10}
                  onClick={() => setStep(2)}
                >
                  Dalej →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Archetyp */}
          {step === 2 && (
            <div className="glass-card p-6 sm:p-8">
              <Steps current={2} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Jaki jest styl biznesowy Twojego awatara?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Archetyp wpływa na dobór scen i styl zdjęć.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {ARCHETYPES.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setArchetype(a.key)}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      archetype === a.key
                        ? 'border-[var(--orange)]'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    )}
                    style={{
                      background: archetype === a.key ? 'rgba(var(--orange-rgb),0.06)' : 'var(--surface-2)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{a.emoji}</span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{a.label}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.desc}</p>
                    {archetype === a.key && (
                      <p className="text-xs mt-2 font-medium" style={{ color: 'var(--orange)' }}>
                        💡 {a.tip}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 justify-between">
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'var(--border)', color: 'var(--text)' }}
                  onClick={() => setStep(1)}
                >
                  ← Wstecz
                </button>
                <button
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                  style={{ background: 'var(--orange)', color: '#fff' }}
                  disabled={!archetype}
                  onClick={() => setStep(3)}
                >
                  Dalej →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Szczegóły */}
          {step === 3 && (
            <div className="glass-card p-6 sm:p-8">
              <Steps current={3} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Ostatnie szczegóły
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Opcjonalnie podaj imię awatara i kontekst biznesowy — to pomoże dopasować sceny.
              </p>

              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Imię awatara (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1.5px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    placeholder="np. Katarzyna"
                    value={avatarName}
                    onChange={(e) => setAvatarName(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--orange)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Kontekst biznesowy (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1.5px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    placeholder="np. coaching life, Instagram, polska publiczność"
                    value={businessContext}
                    onChange={(e) => setBusinessContext(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--orange)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              {/* Credit cost info */}
              <div
                className="rounded-xl p-4 mb-6 text-sm flex items-start gap-3"
                style={{ background: 'rgba(var(--orange-rgb),0.06)', border: '1px solid rgba(var(--orange-rgb),0.15)' }}
              >
                <span className="text-lg">⚡</span>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>
                    Koszt: 11 kredytów
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    1 portret bazowy + 10 zdjęć w 5 scenach (UGC + PRO). Masz teraz: <strong>{balance ?? '…'} kredytów</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-between">
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'var(--border)', color: 'var(--text)' }}
                  onClick={() => setStep(2)}
                >
                  ← Wstecz
                </button>
                <button
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                  style={{ background: 'var(--orange)', color: '#fff' }}
                  disabled={(balance ?? 0) < 11}
                  onClick={handleStart}
                >
                  {(balance ?? 0) < 11 ? 'Niewystarczające kredyty' : 'Generuj awatara →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Generowanie */}
          {step === 4 && (
            <div className="glass-card p-6 sm:p-8 text-center">
              <Steps current={4} />
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse"
                  style={{ background: 'rgba(var(--orange-rgb),0.1)' }}>
                  ✨
                </div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  Tworzę Twojego awatara…
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Generowanie zajmuje ok. 2–3 minuty. Możesz zamknąć tę stronę — wyniki będą tu dostępne.
                </p>
                <div className="max-w-sm mx-auto">
                  <ProgressBar value={progress} />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{progressMsg}</p>
                  <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--orange)' }}>{progress}%</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl aspect-[3/4] animate-pulse"
                    style={{
                      background: 'var(--border-strong)',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Wyniki */}
          {step === 5 && result && (
            <div>
              {/* Hero row: portret + info */}
              <div className="glass-card p-6 mb-6 flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img
                      src={`data:image/png;base64,${result.portrait_b64}`}
                      alt="Portret bazowy awatara"
                      className="w-32 h-44 object-cover rounded-2xl"
                      style={{ border: '3px solid var(--orange)' }}
                    />
                    <div
                      className="absolute -bottom-2 -right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--orange)', color: '#fff' }}
                    >
                      Portret
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                    Awatar gotowy! 🎉
                  </h2>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Wygenerowano portret bazowy i {result.photos.length} zdjęć w 5 różnych scenach.
                  </p>
                  {result.archetype_tip && (
                    <div
                      className="rounded-xl p-3 text-sm mb-4"
                      style={{ background: 'rgba(var(--orange-rgb),0.08)', color: 'var(--orange)', border: '1px solid rgba(var(--orange-rgb),0.15)' }}
                    >
                      💡 {result.archetype_tip}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={downloadAll}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'var(--orange)', color: '#fff' }}
                    >
                      ↓ Pobierz wszystkie
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: 'var(--border)', color: 'var(--text)' }}
                    >
                      + Nowy awatar
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2 mb-4">
                {(['all', 'ugc', 'pro'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStyleFilter(f)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: styleFilter === f ? 'var(--orange)' : 'var(--surface)',
                      color: styleFilter === f ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {f === 'all' ? 'Wszystkie' : f === 'ugc' ? 'Naturalny (UGC)' : 'Profesjonalny'}
                  </button>
                ))}
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredPhotos.map((photo, i) => (
                  <div
                    key={i}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer"
                    style={{ border: '1px solid var(--border)' }}
                    onClick={() => setActivePhoto(photo)}
                  >
                    <img
                      src={`data:image/png;base64,${photo.b64}`}
                      alt={`${SCENE_LABELS[photo.scene]} – ${STYLE_LABELS[photo.style]}`}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
                      <p className="text-white text-xs font-semibold">{SCENE_LABELS[photo.scene]}</p>
                      <p className="text-white/70 text-xs">{STYLE_LABELS[photo.style]}</p>
                    </div>
                    {/* Style badge */}
                    <div
                      className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: photo.style === 'ugc' ? 'rgba(22,163,74,0.85)' : 'rgba(var(--orange-rgb),0.85)',
                        color: '#fff',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {photo.style === 'ugc' ? 'UGC' : 'PRO'}
                    </div>
                    {/* Download button */}
                    <button
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white text-xs"
                      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                      onClick={(e) => { e.stopPropagation(); downloadPhoto(photo, i) }}
                      title="Pobierz"
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Lightbox */}
        {activePhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setActivePhoto(null)}
          >
            <div
              className="relative max-w-sm w-full rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={`data:image/png;base64,${activePhoto.b64}`}
                alt="Podgląd"
                className="w-full object-cover"
              />
              <div className="p-4" style={{ background: 'var(--surface)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      {SCENE_LABELS[activePhoto.scene]} — {STYLE_LABELS[activePhoto.style]}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      💡 {activePhoto.tip}
                    </p>
                  </div>
                  <button
                    className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: 'var(--orange)', color: '#fff' }}
                    onClick={() => downloadPhoto(activePhoto, 0)}
                  >
                    ↓ Pobierz
                  </button>
                </div>
                <button
                  className="w-full text-xs py-2 rounded-xl mt-1"
                  style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => setActivePhoto(null)}
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
