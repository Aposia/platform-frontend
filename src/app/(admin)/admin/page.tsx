'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiAdminStudents, apiAdminGrantAccess, apiAdminRevokeAccess,
  apiAdminBulkGrant, apiAdminCoursesList, apiAdminAddModule,
  apiAdminAddLesson, apiAdminDeleteModule, apiAdminDeleteLesson, apiAdminStats,
} from '@/lib/api'

type Tab = 'students' | 'courses' | 'sales'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SLUGS = ['ai-creator-studio', 'modelka-ai', 'ai-avatar-starter-pack', '36-promptow-extra', 'biblioteka-tel', 'oto-mniej-roboty']

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Badge({ children, color = 'orange' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    orange: 'rgba(255,107,53,.12)',
    green: 'rgba(16,185,129,.12)',
    red: 'rgba(239,68,68,.12)',
    gray: 'rgba(107,114,128,.1)',
  }
  const text: Record<string, string> = {
    orange: '#FF6B35', green: '#10b981', red: '#ef4444', gray: 'var(--muted)',
  }
  return (
    <span style={{
      background: colors[color], color: text[color],
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
    }}>{children}</span>
  )
}

// ─── Tab: Kursanci ────────────────────────────────────────────────────────────

function StudentsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [grantEmail, setGrantEmail] = useState('')
  const [grantSlug, setGrantSlug] = useState('')
  const [grantMsg, setGrantMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkResults, setBulkResults] = useState<{ email: string; slug: string; status: string; user_created?: boolean; temp_password?: string; detail?: string }[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: students = [], isLoading } = useQuery({ queryKey: ['admin-students'], queryFn: apiAdminStudents })

  const grantMut = useMutation({
    mutationFn: ({ email, slug }: { email: string; slug: string }) => apiAdminGrantAccess(email, slug),
    onSuccess: (data) => {
      setGrantMsg({ ok: data.status !== 'error', text: data.status === 'granted' ? `✓ Dostęp nadany` : data.status === 'already_exists' ? 'Dostęp już istnieje' : 'Błąd' })
      qc.invalidateQueries({ queryKey: ['admin-students'] })
    },
    onError: (e: any) => setGrantMsg({ ok: false, text: e.response?.data?.detail || 'Błąd' }),
  })

  const revokeMut = useMutation({
    mutationFn: ({ email, slug }: { email: string; slug: string }) => apiAdminRevokeAccess(email, slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-students'] }),
  })

  const bulkMut = useMutation({
    mutationFn: (items: { email: string; product_slug: string }[]) => apiAdminBulkGrant(items),
    onSuccess: (data) => {
      setBulkResults(data.results)
      qc.invalidateQueries({ queryKey: ['admin-students'] })
    },
  })

  const filtered = students.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  function handleBulkImport() {
    const lines = bulkText.trim().split('\n').filter(Boolean)
    const items = lines.map(line => {
      const [email, product_slug] = line.split(',').map(s => s.trim())
      return { email, product_slug }
    }).filter(i => i.email && i.product_slug)
    if (!items.length) return
    bulkMut.mutate(items)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Grant access */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text)' }}>Nadaj dostęp</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Email</div>
            <input
              type="email" placeholder="klientka@gmail.com" value={grantEmail}
              onChange={e => setGrantEmail(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Slug produktu</div>
            <select
              value={grantSlug} onChange={e => setGrantSlug(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            >
              <option value="">wybierz...</option>
              {SLUGS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setGrantMsg(null); grantMut.mutate({ email: grantEmail, slug: grantSlug }) }}
            disabled={!grantEmail || !grantSlug || grantMut.isPending}
            style={{ padding: '8px 18px', borderRadius: 8, background: '#FF6B35', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {grantMut.isPending ? 'Dodaję...' : 'Nadaj dostęp'}
          </button>
        </div>
        {grantMsg && (
          <div style={{ marginTop: 8, fontSize: 12, color: grantMsg.ok ? '#10b981' : '#ef4444' }}>{grantMsg.text}</div>
        )}
      </div>

      {/* Bulk import */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>Import z WebToLearn (CSV)</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Format: email,slug — jedna linia = jeden kursant. Konta zostaną założone automatycznie.</div>
        <textarea
          value={bulkText} onChange={e => setBulkText(e.target.value)}
          placeholder={'anna@gmail.com,ai-creator-studio\nmagda@wp.pl,modelka-ai'}
          rows={4}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
        />
        <button
          onClick={handleBulkImport}
          disabled={!bulkText.trim() || bulkMut.isPending}
          style={{ marginTop: 8, padding: '8px 18px', borderRadius: 8, background: '#FF6B35', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          {bulkMut.isPending ? 'Importuję...' : 'Importuj'}
        </button>

        {bulkResults.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bulkResults.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: r.status === 'granted' ? '#10b981' : r.status === 'already_exists' ? 'var(--muted)' : '#ef4444' }}>
                {r.status === 'granted' ? '✓' : r.status === 'already_exists' ? '–' : '✗'} {r.email} → {r.slug}
                {r.status === 'granted' && r.user_created && r.temp_password && (
                  <span style={{ color: '#FF6B35', marginLeft: 6 }}>nowe konto · hasło: <strong>{r.temp_password}</strong></span>
                )}
                {r.detail && <span style={{ marginLeft: 6 }}>{r.detail}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student list */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
            Kursanci ({filtered.length})
          </div>
          <input
            placeholder="Szukaj po emailu..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, outline: 'none', width: 200 }}
          />
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>Ładowanie...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>Brak kursantów.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.map(s => (
              <div key={s.id}>
                <div
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', gap: 12 }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.email}</div>
                    {s.full_name && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.full_name}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    {s.access.length === 0
                      ? <Badge color="gray">Brak dostępów</Badge>
                      : s.access.map(a => <Badge key={a.slug} color="green">{a.slug}</Badge>)
                    }
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{fmtDate(s.created_at)}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{expanded === s.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === s.id && s.access.length > 0 && (
                  <div style={{ padding: '10px 0 10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {s.access.map(a => (
                      <div key={a.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{a.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>od {fmtDate(a.granted_at)}</span>
                        </div>
                        <button
                          onClick={() => { if (confirm(`Usunąć dostęp ${s.email} → ${a.slug}?`)) revokeMut.mutate({ email: s.email, slug: a.slug }) }}
                          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: '#ef4444', cursor: 'pointer' }}
                        >
                          Usuń dostęp
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Kursy ───────────────────────────────────────────────────────────────

function CoursesTab() {
  const qc = useQueryClient()
  const { data: courses = [], isLoading, refetch } = useQuery({ queryKey: ['admin-courses'], queryFn: apiAdminCoursesList })

  const delModMut = useMutation({ mutationFn: apiAdminDeleteModule, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }) })
  const delLesMut = useMutation({ mutationFn: apiAdminDeleteLesson, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }) })

  async function addModule(courseId: string) {
    const title = prompt('Tytuł modułu:')
    if (!title) return
    await apiAdminAddModule(courseId, title)
    qc.invalidateQueries({ queryKey: ['admin-courses'] })
  }

  async function addLesson(moduleId: string, modTitle: string) {
    const title = prompt(`Tytuł lekcji (moduł: ${modTitle}):`)
    if (!title) return
    const type = prompt('Typ (video / text / pdf):', 'text') || 'text'
    let bunny = undefined, dur = undefined
    if (type === 'video') {
      const b = prompt('Bunny Video ID (opcjonalnie):')
      if (b) bunny = b
      const d = prompt('Czas w sekundach (opcjonalnie):')
      if (d) dur = parseInt(d)
    }
    await apiAdminAddLesson(moduleId, title, type, bunny, dur)
    qc.invalidateQueries({ queryKey: ['admin-courses'] })
  }

  if (isLoading) return <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20 }}>Ładowanie...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {courses.length === 0 && (
        <div className="glass-card" style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>Brak kursów.</div>
      )}
      {courses.map(c => (
        <div key={c.course_id} className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.course_title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.product_slug} · {c.total_modules} modułów · {c.total_lessons} lekcji</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge color={c.is_published ? 'green' : 'gray'}>{c.is_published ? 'Opublikowany' : 'Szkic'}</Badge>
              <button onClick={() => addModule(c.course_id)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '1px solid #FF6B35', background: 'none', color: '#FF6B35', cursor: 'pointer', fontWeight: 600 }}>+ Moduł</button>
            </div>
          </div>

          {c.modules.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', paddingLeft: 4 }}>Brak modułów.</div>}

          {c.modules.map(mod => (
            <div key={mod.id} style={{ marginLeft: 8, marginBottom: 10, borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{mod.title}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => addLesson(mod.id, mod.title)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer' }}>+ Lekcja</button>
                  <button onClick={() => { if (confirm('Usunąć moduł i wszystkie lekcje?')) delModMut.mutate(mod.id) }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', color: '#ef4444', cursor: 'pointer' }}>Usuń</button>
                </div>
              </div>

              {mod.lessons.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Brak lekcji</div>}

              {mod.lessons.map(les => (
                <div key={les.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.03)', marginBottom: 3 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>
                    <span style={{ color: '#FF6B35', marginRight: 6, fontSize: 10, fontWeight: 700 }}>
                      {les.type === 'video' ? '▶' : les.type === 'pdf' ? 'PDF' : 'T'}
                    </span>
                    {les.title}
                    {les.duration_secs && <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>{Math.round(les.duration_secs / 60)} min</span>}
                  </div>
                  <button onClick={() => { if (confirm('Usunąć lekcję?')) delLesMut.mutate(les.id) }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: 'none', background: 'rgba(239,68,68,.1)', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Sprzedaż ────────────────────────────────────────────────────────────

function SalesTab() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: apiAdminStats })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Przychód łącznie', value: stats ? `${stats.total_revenue_pln.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} PLN` : '—', color: '#FF6B35' },
          { label: 'Zakupów łącznie', value: stats?.total_sales ?? '—', color: 'var(--text)' },
          { label: 'Użytkownicy', value: stats?.total_users ?? '—', color: 'var(--text)' },
        ].map(card => (
          <div key={card.label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div className="glass-card" style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>
        Szczegółowe raporty dostępne w panelu Railway → zakładka Raporty.
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('students')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'students', label: 'Kursanci' },
    { key: 'courses', label: 'Kursy' },
    { key: 'sales', label: 'Sprzedaż' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Panel Admin</h1>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Zarządzanie kursantami i treściami</div>
          </div>
          <a href="/dashboard" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>← Wróć do platformy</a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '7px 20px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: tab === t.key ? '#FF6B35' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--muted)',
                transition: 'all .15s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        {tab === 'students' && <StudentsTab />}
        {tab === 'courses' && <CoursesTab />}
        {tab === 'sales' && <SalesTab />}
      </div>
    </div>
  )
}
