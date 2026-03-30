'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { apiMyCourses, apiGetProducts } from '@/lib/api'
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

interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  type: string
  price_pln: number
  is_active: boolean
}

function visualProgress(real: number): number {
  if (real === 100) return 100
  if (real === 0) return 12
  return Math.max(real, 12)
}

// Produkty z bezpośrednim linkiem do materiału HTML
const MATERIAL_LINKS: Record<string, string> = {
  'oto_mniej_roboty': 'https://www.mniejroboty.pl/oto-material',
  'ai-avatar-starter-pack': 'https://www.mniejroboty.pl/oto-material',
}

export default function CoursesPage() {
  const { user } = useAuth()

  const { data: myCourses, isLoading: loadingMy } = useQuery({
    queryKey: ['my-courses'],
    queryFn: apiMyCourses,
  })

  const { data: allProducts, isLoading: loadingAll } = useQuery({
    queryKey: ['products'],
    queryFn: apiGetProducts,
  })

  const myProductIds = new Set((myCourses || []).map((c: CourseAccess) => c.product_id))
  const shopProducts = (allProducts || []).filter(
    (p: Product) => p.is_active && !myProductIds.has(p.id)
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

        {/* Topbar */}
        <header className="sticky top-0 z-50"
                style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <Link href="/dashboard" className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--orange)' }}>
              ← MNIEJ ROBOTY
            </Link>
            <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              Moje kursy
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-8">

          {/* Moje kursy */}
          <section className="mb-10">
            <h1 className="font-bold mb-5"
                style={{ fontSize: 'clamp(20px,2.5vw,26px)', color: 'var(--text)', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
              Moje kursy
            </h1>

            {loadingMy ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map(i => (
                  <div key={i} className="glass-card p-5 animate-pulse h-40" />
                ))}
              </div>
            ) : myCourses?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {myCourses.map((course: CourseAccess) => {
                  const isDone = course.progress.percent === 100
                  const isNew = course.progress.completed_lessons === 0
                  const bar = visualProgress(course.progress.percent)

                  return (
                    <div key={course.product_id} className="glass-card p-5 flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                             style={{ background: 'rgba(var(--orange-rgb),0.1)' }}>
                          {isDone ? '✅' : isNew ? '🆕' : '▶️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight mb-0.5" style={{ color: 'var(--text)' }}>
                            {course.name}
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {course.progress.completed_lessons} / {course.progress.total_lessons} lekcji
                          </p>
                        </div>
                        {isDone && <span className="badge badge-green flex-shrink-0">Ukończony</span>}
                        {isNew && !isDone && <span className="badge badge-orange flex-shrink-0">Nowy</span>}
                      </div>

                      {course.progress.total_lessons > 0 && (
                        <div>
                          <div className="progress-track">
                            <div className={cn('progress-fill', isDone && 'done')} style={{ width: `${bar}%` }} />
                          </div>
                          <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{course.progress.percent}% ukończone</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {MATERIAL_LINKS[course.slug] ? (
                          <a href={MATERIAL_LINKS[course.slug]} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center text-sm py-2.5">
                            Otwórz materiał →
                          </a>
                        ) : course.has_course ? (
                          <Link href={`/courses/${course.slug}/learn`} className="btn-primary flex-1 text-center text-sm py-2.5">
                            {isNew ? 'Zacznij →' : isDone ? 'Powtórz' : 'Kontynuuj →'}
                          </Link>
                        ) : (
                          <div className="flex-1 text-sm text-center py-2.5 rounded-xl border"
                               style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
                            Materiał w przygotowaniu
                          </div>
                        )}
                        {isDone && (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificates/${course.slug}`}
                             target="_blank" rel="noreferrer"
                             className="text-sm px-3 py-2.5 rounded-xl border font-medium"
                             style={{ color: 'var(--orange)', borderColor: 'rgba(var(--orange-rgb),0.3)', background: 'rgba(var(--orange-rgb),0.08)' }}>
                            🏆 Certyfikat
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="glass-card p-10 text-center">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Nie masz jeszcze żadnych kursów</h3>
                <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Kup kurs żeby uzyskać dostęp do materiałów.</p>
              </div>
            )}
          </section>

          {/* Sklep — dostępne produkty */}
          {shopProducts.length > 0 && (
            <section>
              <h2 className="font-bold mb-5"
                  style={{ fontSize: 'clamp(17px,2vw,22px)', color: 'var(--text)', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
                Dostępne kursy i materiały
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shopProducts.map((product: Product) => (
                  <div key={product.id} className="glass-card p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold" style={{ color: 'var(--orange)' }}>
                        {product.price_pln} PLN
                      </span>
                      <Link href={`/checkout/${product.slug}`} className="btn-primary text-sm py-2 px-4">
                        Kup →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>
    </ProtectedRoute>
  )
}
