'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiGetCourseContent, apiMarkLessonComplete } from '@/lib/api'
import { ProtectedRoute } from '@/components/ui/protected-route'
import { formatDuration, cn } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  type: 'video' | 'text' | 'pdf'
  position: number
  duration_secs: number | null
  is_free_preview: boolean
  bunny_embed_url: string | null
  content_url: string | null
}

interface Module {
  id: string
  title: string
  position: number
  is_free_preview: boolean
  lessons: Lesson[]
}

interface CourseData {
  id: string
  title: string
  modules: Module[]
}

function LessonIcon({ type }: { type: string }) {
  if (type === 'video') return <span className="text-xs text-blue">▶</span>
  if (type === 'pdf') return <span className="text-xs text-yellow">PDF</span>
  return <span className="text-xs text-white/40">T</span>
}

function BunnyPlayer({ url }: { url: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full rounded-xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export default function LearnPage() {
  const params = useParams()
  const slug = params.slug as string
  const queryClient = useQueryClient()

  const { data: course, isLoading } = useQuery<CourseData>({
    queryKey: ['course', slug],
    queryFn: () => apiGetCourseContent(slug),
  })

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => apiMarkLessonComplete(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
    },
  })

  const allLessons = course?.modules.flatMap(m => m.lessons) ?? []
  const currentLesson = activeLesson ?? allLessons[0] ?? null
  const currentIdx = allLessons.findIndex(l => l.id === currentLesson?.id)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  const handleComplete = useCallback(() => {
    if (!currentLesson) return
    completeMutation.mutate(currentLesson.id)
    if (nextLesson) setActiveLesson(nextLesson)
  }, [currentLesson, nextLesson, completeMutation])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col" style={{ background: '#0d0f1c' }}>

        {/* Top nav */}
        <header className="flex-shrink-0 border-b border-white/[0.06] px-4 py-3 flex items-center gap-4"
                style={{ background: 'rgba(13,15,28,0.9)', backdropFilter: 'blur(20px)' }}>
          <Link href="/dashboard" className="text-white/40 hover:text-white/70 transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-white/20 text-sm">|</span>
          <h1 className="text-sm font-medium truncate flex-1">{course?.title}</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/40 hover:text-white/70 text-sm transition-colors ml-auto"
          >
            {sidebarOpen ? 'Ukryj spis' : 'Pokaż spis'}
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="w-72 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto"
                   style={{ background: 'rgba(13,15,28,0.6)' }}>
              <div className="p-4 space-y-6">
                {course?.modules.map((mod) => (
                  <div key={mod.id}>
                    <h3 className="text-xs font-medium text-white/30 uppercase tracking-widest mb-3 px-2">
                      {mod.title}
                    </h3>
                    <div className="space-y-1">
                      {mod.lessons.map((lesson) => {
                        const isActive = lesson.id === currentLesson?.id
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            className={cn(
                              'w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm',
                              isActive
                                ? 'bg-orange/15 text-white'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
                            )}
                          >
                            <LessonIcon type={lesson.type} />
                            <span className="flex-1 leading-snug">{lesson.title}</span>
                            {lesson.duration_secs && (
                              <span className="text-xs text-white/25 flex-shrink-0">
                                {formatDuration(lesson.duration_secs)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {currentLesson ? (
              <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

                {/* Lesson header */}
                <div>
                  <h2 className="text-xl font-medium mb-1">{currentLesson.title}</h2>
                  {currentLesson.duration_secs && (
                    <p className="text-white/40 text-sm">
                      {formatDuration(currentLesson.duration_secs)} min
                    </p>
                  )}
                </div>

                {/* Player */}
                {currentLesson.type === 'video' && currentLesson.bunny_embed_url ? (
                  <BunnyPlayer url={currentLesson.bunny_embed_url} />
                ) : currentLesson.type === 'pdf' && currentLesson.content_url ? (
                  <div className="glass-card p-6 text-center">
                    <p className="text-white/60 mb-4">Pobierz materiał PDF</p>
                    <a href={currentLesson.content_url} target="_blank" rel="noreferrer"
                       className="btn-primary inline-block">
                      Otwórz PDF →
                    </a>
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center text-white/40">
                    Materiał wideo zostanie wkrótce dodany.
                  </div>
                )}

                {/* Navigation + complete */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setActiveLesson(prevLesson)}
                    className="btn-secondary text-sm py-2.5 disabled:opacity-30"
                  >
                    ← Poprzednia
                  </button>

                  <button
                    onClick={handleComplete}
                    disabled={completeMutation.isPending}
                    className="btn-primary text-sm py-2.5 flex-1 text-center"
                  >
                    {completeMutation.isPending
                      ? 'Zapisuję...'
                      : nextLesson
                        ? 'Ukończ i przejdź dalej →'
                        : 'Ukończ lekcję ✓'}
                  </button>

                  <button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setActiveLesson(nextLesson)}
                    className="btn-secondary text-sm py-2.5 disabled:opacity-30"
                  >
                    Następna →
                  </button>
                </div>

                {/* Completion celebration */}
                {completeMutation.isSuccess && !nextLesson && (
                  <div className="glass-card p-6 text-center border-green/20 bg-green/[0.04]">
                    <div className="text-3xl mb-3">🎉</div>
                    <h3 className="font-medium mb-2">Kurs ukończony!</h3>
                    <p className="text-white/40 text-sm mb-4">Certyfikat zostanie wysłany na Twój email.</p>
                    <Link href="/dashboard" className="btn-primary inline-block text-sm">
                      Wróć do dashboardu →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/30">Wybierz lekcję z listy</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
