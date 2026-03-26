'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
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

// Endowed progress effect: nowe kursy (0%) startują wizualnie od 12%
// żeby dać poczucie "już jesteś w środku" — zwiększa completion rate
function visualProgress(realPct: number): number {
  if (realPct === 100) return 100
  if (realPct === 0) return 12
  return Math.max(realPct, 12)
}

function ProgressRing({ pct }: { pct: number }) {
  const display = visualProgress(pct)
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (display / 100) * circ
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <circle cx="26" cy="26" r={r} fill="none"
        stroke={pct === 100 ? '#34C759' : '#FF6B35'}
        strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="26" y="31" textAnchor="middle" fontSize="11" fontWeight="600"
        fill={pct === 100 ? '#34C759' : '#FF6B35'}>
        {pct}%
      </text>
    </svg>
  )
}

function CourseCard({ course }: { course: CourseAccess }) {
  const { progress } = course
  const isNew = progress.completed_lessons === 0
  const isDone = progress.percent === 100
  const barWidth = visualProgress(progress.percent)

  return (
    <div className="glass-card p-6 flex flex-col gap-4 hover:bg-white/[0.10] transition-colors">
      {/* Header */}
      <div className="flex items-start gap-4">
        <ProgressRing pct={progress.percent} />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white leading-tight mb-1">{course.name}</h3>
          <p className="text-white/40 text-sm">
            {progress.completed_lessons} / {progress.total_lessons} lekcji
          </p>
        </div>
        {isDone && (
          <span className="text-xs bg-green/15 text-green px-3 py-1 rounded-full font-medium flex-shrink-0">
            Ukończony ✓
          </span>
        )}
        {isNew && !isDone && (
          <span className="text-xs bg-orange/15 text-orange px-3 py-1 rounded-full font-medium flex-shrink-0">
            Nowy
          </span>
        )}
      </div>

      {/* Progress bar z endowed progress effect */}
      {progress.total_lessons > 0 && (
        <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700',
              isDone ? 'bg-green' : 'bg-gradient-to-r from-orange to-yellow')}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}

      {/* CTA */}
      {course.has_course ? (
        <Link
          href={`/courses/${course.slug}/learn`}
          className="btn-primary text-center text-sm py-2.5"
        >
          {isNew ? 'Zacznij kurs →' : isDone ? 'Powtórz kurs' : 'Kontynuuj →'}
        </Link>
      ) : (
        <div className="text-white/30 text-sm text-center py-2.5 border border-white/10 rounded-xl">
          Materiały dostępne — skontaktuj się z nami
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()

  const { data: courses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: apiMyCourses,
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen"
           style={{ background: 'radial-gradient(ellipse 100% 50% at 50% -10%, rgba(255,107,53,0.08) 0%, transparent 70%), #0d0f1c' }}>

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06]"
                style={{ background: 'rgba(13,15,28,0.85)', backdropFilter: 'blur(28px)' }}>
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="font-medium text-sm tracking-tight">MNIEJ ROBOTY</span>
            <div className="flex items-center gap-4">
              <span className="text-white/40 text-sm hidden sm:block">
                {user?.full_name || user?.email}
              </span>
              <button onClick={logout}
                className="text-white/30 hover:text-white/60 text-sm transition-colors">
                Wyloguj
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-4xl mx-auto px-6 py-10">

          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-3xl font-medium tracking-tight mb-2">
              Cześć, {user?.full_name?.split(' ')[0] || 'tam'} 👋
            </h1>
            <p className="text-white/40">
              {isLoading ? '' : courses?.length
                ? `Masz dostęp do ${courses.length} ${courses.length === 1 ? 'kursu' : 'kursów'}.`
                : 'Nie masz jeszcze żadnych kursów.'}
            </p>
          </div>

          {/* Courses */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1,2].map(i => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-[52px] h-[52px] rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded-lg w-3/4" />
                      <div className="h-3 bg-white/10 rounded-lg w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses?.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((course: CourseAccess) => (
                <CourseCard key={course.product_id} course={course} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-medium mb-2">Nie masz jeszcze żadnych kursów</h3>
              <p className="text-white/40 text-sm mb-6">Kup kurs żeby uzyskać dostęp do materiałów.</p>
              <Link href="/courses" className="btn-primary inline-block">
                Przeglądaj kursy →
              </Link>
            </div>
          )}

          {/* Bottom promo — tylko gdy user ma < 3 kursy */}
          {!isLoading && courses?.length < 3 && (
            <div className="mt-10 glass-card p-6 border-orange/20 bg-orange/[0.04]">
              <div className="flex items-center gap-4">
                <div className="text-2xl">🚀</div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">AI Creator Studio 2.0</h4>
                  <p className="text-white/40 text-xs">
                    Awatar AI, Reelsy bez nagrywania, 30 dni contentu z jednej sesji.
                  </p>
                </div>
                <Link href="/checkout/ai-creator-studio" className="btn-primary text-sm py-2 px-4 flex-shrink-0">
                  Kup →
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
