'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { apiMyCourses } from '@/lib/api'
import { ProtectedRoute } from '@/components/ui/protected-route'
import { cn } from '@/lib/utils'

interface CourseAccess {
  product_id: string
  slug: string
  name: string
  description: string | null
  type: string
  has_course: boolean
  course_id: string | null
  granted_at: string
  progress: {
    total_lessons: number
    completed_lessons: number
    percent: number
  }
}

// Endowed progress — nowe kursy startują od 12% wizualnie
function visualProgress(real: number): number {
  if (real === 100) return 100
  if (real === 0) return 12
  return Math.max(real, 12)
}

function getGreeting(name: string): { heading: string; sub: string } {
  const h = new Date().getHours()
  const firstName = name?.split(' ')[0] || 'tam'
  if (h >= 5 && h < 11)  return { heading: `Dzień dobry, ${firstName}!`, sub: 'Gotowa na nową porcję wiedzy?' }
  if (h >= 11 && h < 17) return { heading: `Cześć, ${firstName} 👋`, sub: 'Co dziś ogarniamy?' }
  if (h >= 17 && h < 21) return { heading: `Dobry wieczór, ${firstName}!`, sub: 'Świetny czas na lekcję.' }
  return { heading: `Hej, ${firstName} 🌙`, sub: 'Późno, ale jesteśmy.' }
}

function CourseCard({ course }: { course: CourseAccess }) {
  const { progress } = course
  const isNew = progress.completed_lessons === 0
  const isDone = progress.percent === 100
  const bar = visualProgress(progress.percent)

  return (
    <div className="glass-card p-5 flex flex-col gap-4 cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
          'bg-[rgba(var(--orange-rgb),0.1)]'
        )}>
          {isDone ? '✅' : isNew ? '🆕' : '▶️'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight mb-0.5" style={{ color: 'var(--text)' }}>
            {course.name}
          </h3>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {progress.completed_lessons} / {progress.total_lessons} lekcji
          </p>
        </div>
        {isDone && <span className="badge badge-green flex-shrink-0">Ukończony</span>}
        {isNew && !isDone && <span className="badge badge-orange flex-shrink-0">Nowy</span>}
      </div>

      {progress.total_lessons > 0 && (
        <div>
          <div className="progress-track">
            <div className={cn('progress-fill', isDone && 'done')} style={{ width: `${bar}%` }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{progress.percent}% ukończone</p>
        </div>
      )}

      {course.has_course ? (
        <Link href={`/courses/${course.slug}/learn`} className="btn-primary text-center text-sm py-2.5">
          {isNew ? 'Zacznij kurs →' : isDone ? 'Powtórz kurs' : 'Kontynuuj →'}
        </Link>
      ) : (
        <div className="text-sm text-center py-2.5 rounded-xl border" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
          Materiały dostępne — skontaktuj się
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="glass-card p-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-3"
           style={{ background: 'rgba(var(--orange-rgb),0.1)' }}>
        {icon}
      </div>
      <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="text-2xl font-bold leading-none" style={{ color: 'var(--text)' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}

// Dark/light toggle button
function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      setDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-200"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      title={dark ? 'Tryb jasny' : 'Tryb ciemny'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { data: courses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: apiMyCourses,
  })

  const greeting = getGreeting(user?.full_name || '')
  const totalLessons = courses?.reduce((s: number, c: CourseAccess) => s + c.progress.completed_lessons, 0) ?? 0
  const totalMinutes = totalLessons * 14 // ~14 min per lesson estimate

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--bg)' }}>

        {/* ── TOPBAR ── */}
        <header className="sticky top-0 z-50 transition-all duration-300"
                style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--orange)' }}>
                MNIEJ ROBOTY
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Platforma</div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/profile"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--orange), #1B2A4A)' }}
                title="Mój profil"
              >
                {(user?.full_name?.[0] || user?.email?.[0] || 'K').toUpperCase()}
              </Link>
              <button onClick={logout}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'var(--muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                Wyloguj
              </button>
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="max-w-5xl mx-auto px-5 py-8">

          {/* Greeting */}
          <div className="mb-7">
            <h1 className="font-bold mb-1.5" style={{ fontSize: 'clamp(22px,3vw,30px)', color: 'var(--text)', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
              {greeting.heading}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{greeting.sub}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-7">
            <StatCard icon="📚" label="Zakupione kursy" value={String(courses?.length ?? 0)} sub="aktywne" />
            <StatCard icon="✅" label="Ukończone lekcje" value={String(totalLessons)} sub={`z ${(courses?.reduce((s: number, c: CourseAccess) => s + c.progress.total_lessons, 0) ?? 0)} łącznie`} />
            <StatCard icon="⏱️" label="Czas nauki" value={totalMinutes >= 60 ? `${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m` : `${totalMinutes}m`} sub="łącznie" />
          </div>

          {/* Two column */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">

            {/* LEFT — Kursy */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Moje kursy</h2>
                <Link href="/courses" className="text-xs font-semibold" style={{ color: 'var(--orange)' }}>
                  Zobacz wszystkie →
                </Link>
              </div>

              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1,2].map(i => (
                    <div key={i} className="glass-card p-5 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--border)' }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 rounded-lg w-3/4" style={{ background: 'var(--border)' }} />
                          <div className="h-3 rounded-lg w-1/3" style={{ background: 'var(--border)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : courses?.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {courses.map((c: CourseAccess) => <CourseCard key={c.product_id} course={c} />)}
                </div>
              ) : (
                <div className="glass-card p-10 text-center">
                  <div className="text-4xl mb-3">📚</div>
                  <h3 className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Nie masz jeszcze żadnych kursów</h3>
                  <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Kup kurs żeby uzyskać dostęp do materiałów.</p>
                  <Link href="/courses" className="btn-primary inline-block">Zobacz kursy →</Link>
                </div>
              )}
            </div>

            {/* RIGHT — Upsell + Odkryj */}
            <div className="flex flex-col gap-4">

              {/* Upsell card */}
              {!isLoading && courses?.length < 3 && (
                <div className="glass-card p-5 relative overflow-hidden" style={{ borderColor: 'rgba(var(--orange-rgb),0.25)' }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                       style={{ background: 'linear-gradient(90deg, var(--orange), var(--violet))' }} />
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--orange)' }}>
                    🎯 Specjalnie dla Ciebie
                  </div>
                  <h3 className="font-bold text-sm mb-1.5 leading-snug" style={{ color: 'var(--text)' }}>
                    Asystent Decyzji i Strategii
                  </h3>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Gotowy system do przegadania każdej decyzji biznesowej z AI. Efekt w 30 min.
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold" style={{ color: 'var(--orange)' }}>39 PLN</span>
                    <span className="text-sm line-through" style={{ color: 'var(--muted)' }}>67 PLN</span>
                    <span className="badge badge-orange">−42%</span>
                  </div>
                  <Link href="/checkout/oto-mniej-roboty" className="btn-primary block text-center text-sm py-2.5">
                    Odbierz ofertę →
                  </Link>
                </div>
              )}

              {/* Discover */}
              <div className="glass-card p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text)' }}>
                  Może Cię zainteresować
                </h2>
                <div className="flex flex-col gap-0">
                  {[
                    { icon: '🤖', title: 'AI Avatar Starter Pack', sub: 'Awatar AI w 30 minut · 39 PLN', href: '/checkout/ai-avatar-starter-pack' },
                    { icon: '📸', title: 'Twoja Modelka AI', sub: 'Zdjęcia reklamowe w 60 min · 149 PLN', href: '/checkout/modelka-ai' },
                    { icon: '✍️', title: '36 Promptów Extra', sub: 'Gotowe prompty do kopiowania · 19 PLN', href: '/checkout/36-promptow-extra' },
                    { icon: '🖼️', title: 'Biblioteka TEL', sub: 'Gotowe tła do zdjęć · 29 PLN', href: '/checkout/biblioteka-tel' },
                    { icon: '🚀', title: 'AI Creator Studio 2.0', sub: 'Pełny system brand · 399 PLN', href: '/checkout/ai-creator-studio' },
                  ].map((item, i) => (
                    <Link key={i} href={item.href}
                      className="flex items-center gap-3 py-3 transition-colors group"
                      style={{ borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                           style={{ background: 'var(--bg-2)' }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold transition-colors group-hover:text-[var(--orange)]"
                             style={{ color: 'var(--text)' }}>
                          {item.title}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{item.sub}</div>
                      </div>
                      <span className="text-base" style={{ color: 'var(--muted)' }}>›</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
