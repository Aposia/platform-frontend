'use client'

import { useState, useCallback, useRef } from 'react'
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
  content_html: string | null
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
  if (type === 'video') return <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>▶</span>
  if (type === 'pdf') return <span style={{ fontSize: 10, color: 'var(--orange)', fontWeight: 700 }}>PDF</span>
  return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>T</span>
}

function HtmlLesson({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = () => {
    const iframe = iframeRef.current
    try {
      const body = iframe?.contentDocument?.body || iframe?.contentWindow?.document?.body
      if (body) {
        iframe!.style.height = (body.scrollHeight + 32) + 'px'
      }
    } catch {
      // cross-origin guard
    }
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', border: 'none', borderRadius: 16, minHeight: 500, display: 'block' }}
      title="Treść lekcji"
    />
  )
}

function BunnyPlayer({ url }: { url: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full rounded-2xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function NotesPanel({ lessonId }: { lessonId: string }) {
  const key = `notes_${lessonId}`
  const [text, setText] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(key) ?? '') : ''
  )
  const [saved, setSaved] = useState(false)

  const save = () => {
    localStorage.setItem(key, text)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>📝 Notatki do tej lekcji</span>
        <button
          onClick={save}
          style={{
            fontSize: 12,
            padding: '4px 14px',
            borderRadius: 8,
            border: 'none',
            background: saved ? '#22c55e' : 'var(--orange)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s'
          }}
        >
          {saved ? 'Zapisano ✓' : 'Zapisz'}
        </button>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Zapisz co ważne, swoje przemyślenia lub pomysły na wdrożenie..."
        style={{
          width: '100%',
          minHeight: 120,
          resize: 'vertical',
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--text)',
          background: 'var(--bg)',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div style={{ width: 32, height: 32, border: '2.5px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

        {/* Top nav */}
        <header style={{
          flexShrink: 0,
          borderBottom: '1.5px solid var(--border)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'var(--card)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--border)', fontSize: 14 }}>|</span>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {course?.title}
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
          >
            {sidebarOpen ? 'Ukryj spis' : 'Pokaż spis'}
          </button>
        </header>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Sidebar */}
          {sidebarOpen && (
            <aside style={{
              width: 272,
              flexShrink: 0,
              borderRight: '1.5px solid var(--border)',
              overflowY: 'auto',
              background: 'var(--card)',
            }}>
              <div style={{ padding: 16 }}>
                {course?.modules.map((mod) => (
                  <div key={mod.id} style={{ marginBottom: 24 }}>
                    <h3 style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 10,
                      paddingLeft: 8,
                    }}>
                      {mod.title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {mod.lessons.map((lesson) => {
                        const isActive = lesson.id === currentLesson?.id
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '9px 12px',
                              borderRadius: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 400,
                              background: isActive ? 'rgba(255,107,0,0.1)' : 'transparent',
                              color: isActive ? 'var(--orange)' : 'var(--text)',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <LessonIcon type={lesson.type} />
                            <span style={{ flex: 1, lineHeight: 1.4 }}>{lesson.title}</span>
                            {lesson.duration_secs && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
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
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {currentLesson ? (
              <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Lesson header */}
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--heading)', marginBottom: 4, fontFamily: 'var(--serif)' }}>
                    {currentLesson.title}
                  </h2>
                  {currentLesson.duration_secs && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDuration(currentLesson.duration_secs)} min
                    </p>
                  )}
                </div>

                {/* Player */}
                {currentLesson.type === 'video' && currentLesson.bunny_embed_url ? (
                  <BunnyPlayer url={currentLesson.bunny_embed_url} />
                ) : currentLesson.type === 'pdf' && currentLesson.content_url ? (
                  <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Pobierz materiał PDF</p>
                    <a href={currentLesson.content_url} target="_blank" rel="noreferrer" className="btn-primary">
                      Otwórz PDF →
                    </a>
                  </div>
                ) : currentLesson.content_html ? (
                  <HtmlLesson html={currentLesson.content_html} />
                ) : (
                  <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Materiał zostanie wkrótce dodany.
                  </div>
                )}

                {/* Navigation + complete */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setActiveLesson(prevLesson)}
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: '10px 16px', opacity: prevLesson ? 1 : 0.3 }}
                  >
                    ← Poprzednia
                  </button>

                  <button
                    onClick={handleComplete}
                    disabled={completeMutation.isPending}
                    className="btn-primary"
                    style={{ fontSize: 13, padding: '10px 20px', flex: 1, textAlign: 'center' }}
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
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: '10px 16px', opacity: nextLesson ? 1 : 0.3 }}
                  >
                    Następna →
                  </button>
                </div>

                {/* Notes */}
                <NotesPanel lessonId={currentLesson.id} />

                {/* Completion celebration */}
                {completeMutation.isSuccess && !nextLesson && (
                  <div className="card" style={{ padding: 32, textAlign: 'center', borderColor: '#22c55e', background: 'rgba(34,197,94,0.04)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                    <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--heading)', fontFamily: 'var(--serif)' }}>Kurs ukończony!</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Brawo! Masz teraz certyfikat ukończenia.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificates/${slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ display: 'inline-block', fontSize: 14 }}
                      >
                        🏆 Pobierz certyfikat →
                      </a>
                      <Link href="/dashboard" className="btn-secondary" style={{ display: 'inline-block', fontSize: 14 }}>
                        Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'var(--text-muted)' }}>Wybierz lekcję z listy</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
