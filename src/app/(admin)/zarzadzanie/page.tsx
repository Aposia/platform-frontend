'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiAdminStudents, apiAdminGrantAccess, apiAdminRevokeAccess,
  apiAdminBulkGrant, apiAdminCoursesList, apiAdminAddModule,
  apiAdminAddLesson, apiAdminDeleteModule, apiAdminDeleteLesson,
  apiAdminStats, apiAdminStudentProgress,
} from '@/lib/api'

type Tab = 'students' | 'courses' | 'sales'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SLUGS = ['ai-creator-studio', 'modelka-ai', 'ai-avatar-starter-pack', '36-promptow-extra', 'biblioteka-tel', 'oto-mniej-roboty']

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function cleanName(name: string) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 3 }
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, background: '#FF6B35', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const btnGhost: React.CSSProperties = { padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }
const btnDanger: React.CSSProperties = { padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', color: '#ef4444', fontSize: 11, cursor: 'pointer' }

function Badge({ children, color = 'orange' }: { children: React.ReactNode; color?: string }) {
  const bg: Record<string, string> = { orange: 'rgba(255,107,53,.12)', green: 'rgba(16,185,129,.12)', red: 'rgba(239,68,68,.12)', gray: 'rgba(107,114,128,.1)', blue: 'rgba(59,130,246,.12)' }
  const fg: Record<string, string> = { orange: '#FF6B35', green: '#10b981', red: '#ef4444', gray: 'var(--muted)', blue: '#3b82f6' }
  return <span style={{ background: bg[color], color: fg[color], fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>{children}</span>
}

// ─── Add Lesson Form ──────────────────────────────────────────────────────────

function AddLessonForm({ moduleId, onDone }: { moduleId: string; onDone: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ title: '', type: 'text', bunny_video_id: '', content_url: '', description: '', link_url: '', duration_secs: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function set(k: string, v: string) { setF(p => ({ ...p, [k]: v })) }

  async function submit() {
    if (!f.title.trim()) { setErr('Tytuł jest wymagany'); return }
    setSaving(true); setErr('')
    try {
      await apiAdminAddLesson(moduleId, {
        title: f.title, type: f.type,
        bunny_video_id: f.bunny_video_id || undefined,
        content_url: f.content_url || undefined,
        description: f.description || undefined,
        link_url: f.link_url || undefined,
        duration_secs: f.duration_secs ? parseInt(f.duration_secs) : undefined,
      })
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
      onDone()
    } catch (e: any) { setErr(e.response?.data?.detail || 'Błąd') }
    setSaving(false)
  }

  return (
    <div style={{ background: 'rgba(255,107,53,.04)', border: '1px solid rgba(255,107,53,.2)', borderRadius: 10, padding: 14, marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Tytuł lekcji *</label>
          <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="np. Jak briefować bota AI" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Typ</label>
          <select value={f.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
            <option value="text">Tekst / HTML</option>
            <option value="video">Video (Bunny)</option>
            <option value="pdf">PDF / Plik</option>
          </select>
        </div>
        {f.type === 'video' && <>
          <div>
            <label style={labelStyle}>Bunny Video ID</label>
            <input value={f.bunny_video_id} onChange={e => set('bunny_video_id', e.target.value)} placeholder="abc123-uuid" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Czas trwania (sekundy)</label>
            <input type="number" value={f.duration_secs} onChange={e => set('duration_secs', e.target.value)} placeholder="300" style={inputStyle} />
          </div>
        </>}
        {f.type === 'pdf' && <div>
          <label style={labelStyle}>URL pliku / PDF</label>
          <input value={f.content_url} onChange={e => set('content_url', e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>}
        <div>
          <label style={labelStyle}>Link zewnętrzny (opcjonalnie)</label>
          <input value={f.link_url} onChange={e => set('link_url', e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Opis lekcji (opcjonalnie)</label>
          <textarea value={f.description} onChange={e => set('description', e.target.value)} placeholder="Co kursantka znajdzie w tej lekcji..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </div>
      {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={saving} style={btnPrimary}>{saving ? 'Zapisuję...' : 'Dodaj lekcję'}</button>
        <button onClick={onDone} style={btnGhost}>Anuluj</button>
      </div>
    </div>
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
  const [showProgress, setShowProgress] = useState(false)

  const { data: students = [], isLoading } = useQuery({ queryKey: ['admin-students'], queryFn: apiAdminStudents })
  const { data: progress = [] } = useQuery({ queryKey: ['admin-progress'], queryFn: apiAdminStudentProgress, enabled: showProgress })

  const grantMut = useMutation({
    mutationFn: ({ email, slug }: { email: string; slug: string }) => apiAdminGrantAccess(email, slug),
    onSuccess: (data) => {
      setGrantMsg({ ok: data.status !== 'error', text: data.status === 'granted' ? '✓ Dostęp nadany' : data.status === 'already_exists' ? 'Dostęp już istnieje' : 'Błąd' })
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
    onSuccess: (data) => { setBulkResults(data.results); qc.invalidateQueries({ queryKey: ['admin-students'] }) },
  })

  const filtered = students.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  function handleBulkImport() {
    const items = bulkText.trim().split('\n').filter(Boolean).map(line => {
      const [email, product_slug] = line.split(',').map(s => s.trim())
      return { email, product_slug }
    }).filter(i => i.email && i.product_slug)
    if (items.length) bulkMut.mutate(items)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Grant */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text)' }}>Nadaj dostęp</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" placeholder="klientka@gmail.com" value={grantEmail} onChange={e => setGrantEmail(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>Kurs</label>
            <select value={grantSlug} onChange={e => setGrantSlug(e.target.value)} style={inputStyle}>
              <option value="">wybierz...</option>
              {SLUGS.map(s => <option key={s} value={s}>{cleanName(s)}</option>)}
            </select>
          </div>
          <button onClick={() => { setGrantMsg(null); grantMut.mutate({ email: grantEmail, slug: grantSlug }) }} disabled={!grantEmail || !grantSlug || grantMut.isPending} style={btnPrimary}>
            {grantMut.isPending ? 'Dodaję...' : 'Nadaj dostęp'}
          </button>
        </div>
        {grantMsg && <div style={{ marginTop: 8, fontSize: 12, color: grantMsg.ok ? '#10b981' : '#ef4444' }}>{grantMsg.text}</div>}
      </div>

      {/* Bulk import */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>Import z WebToLearn (CSV)</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Jedna linia = email,slug-kursu. Konta zakładane automatycznie.</div>
        <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={'anna@gmail.com,ai-creator-studio\nmagda@wp.pl,modelka-ai'} rows={4}
          style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }} />
        <button onClick={handleBulkImport} disabled={!bulkText.trim() || bulkMut.isPending} style={{ ...btnPrimary, marginTop: 8 }}>
          {bulkMut.isPending ? 'Importuję...' : 'Importuj'}
        </button>
        {bulkResults.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {bulkResults.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: r.status === 'granted' ? '#10b981' : r.status === 'already_exists' ? 'var(--muted)' : '#ef4444' }}>
                {r.status === 'granted' ? '✓' : r.status === 'already_exists' ? '–' : '✗'} {r.email} → {r.slug}
                {r.status === 'granted' && r.user_created && r.temp_password && <span style={{ color: '#FF6B35', marginLeft: 6 }}>nowe konto · hasło: <strong>{r.temp_password}</strong></span>}
                {r.detail && <span style={{ marginLeft: 6 }}>{r.detail}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Postęp */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Postęp kursantów</div>
          <button onClick={() => setShowProgress(p => !p)} style={btnGhost}>{showProgress ? 'Ukryj' : 'Pokaż statystyki'}</button>
        </div>
        {showProgress && (progress.length === 0
          ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>Brak danych.</div>
          : progress.map(s => (
            <div key={s.email} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{s.email}{s.full_name ? ` · ${s.full_name}` : ''}</div>
              {s.courses.map(c => (
                <div key={c.product_slug} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>{c.product_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.completed_lessons}/{c.total_lessons} lekcji · {c.watch_minutes}min · {fmtDate(c.last_activity)}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: 4, width: `${c.percent}%`, background: c.percent === 100 ? '#10b981' : '#FF6B35', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{c.percent}%</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Lista kursantów */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Kursanci ({filtered.length})</div>
          <input placeholder="Szukaj..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 180 }} />
        </div>
        {isLoading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Ładowanie...</div> : filtered.length === 0 ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Brak kursantów.</div> :
          filtered.map(s => (
            <div key={s.id}>
              <div onClick={() => setExpanded(expanded === s.id ? null : s.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.email}</div>
                  {s.full_name && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.full_name}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {s.access.length === 0 ? <Badge color="gray">Brak dostępów</Badge> : s.access.map(a => <Badge key={a.slug} color="green">{a.name}</Badge>)}
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
                      <button onClick={() => { if (confirm(`Usunąć dostęp ${s.email} → ${a.slug}?`)) revokeMut.mutate({ email: s.email, slug: a.slug }) }} style={btnDanger}>Usuń dostęp</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ─── Tab: Kursy ───────────────────────────────────────────────────────────────

function CoursesTab() {
  const qc = useQueryClient()
  const { data: courses = [], isLoading } = useQuery({ queryKey: ['admin-courses'], queryFn: apiAdminCoursesList })
  const [addingLessonFor, setAddingLessonFor] = useState<string | null>(null)
  const [addingModuleFor, setAddingModuleFor] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [savingModule, setSavingModule] = useState(false)

  const delModMut = useMutation({ mutationFn: apiAdminDeleteModule, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }) })
  const delLesMut = useMutation({ mutationFn: apiAdminDeleteLesson, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }) })

  async function submitModule(courseId: string) {
    if (!newModuleTitle.trim()) return
    setSavingModule(true)
    await apiAdminAddModule(courseId, newModuleTitle)
    qc.invalidateQueries({ queryKey: ['admin-courses'] })
    setNewModuleTitle(''); setAddingModuleFor(null); setSavingModule(false)
  }

  if (isLoading) return <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20 }}>Ładowanie...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {courses.length === 0 && <div className="glass-card" style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>Brak kursów.</div>}
      {courses.map(c => (
        <div key={c.course_id} className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{c.course_title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.total_modules} modułów · {c.total_lessons} lekcji</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge color={c.is_published ? 'green' : 'gray'}>{c.is_published ? 'Opublikowany' : 'Ukryty'}</Badge>
              <button onClick={() => setAddingModuleFor(addingModuleFor === c.course_id ? null : c.course_id)}
                style={{ ...btnGhost, color: '#FF6B35', borderColor: 'rgba(255,107,53,.4)', fontWeight: 600 }}>+ Moduł</button>
            </div>
          </div>

          {addingModuleFor === c.course_id && (
            <div style={{ background: 'rgba(255,107,53,.04)', border: '1px solid rgba(255,107,53,.2)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <label style={labelStyle}>Tytuł modułu</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} placeholder="np. Wstęp do AI" style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && submitModule(c.course_id)} />
                <button onClick={() => submitModule(c.course_id)} disabled={savingModule} style={btnPrimary}>{savingModule ? '...' : 'Dodaj'}</button>
                <button onClick={() => setAddingModuleFor(null)} style={btnGhost}>Anuluj</button>
              </div>
            </div>
          )}

          {c.modules.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Brak modułów.</div>}

          {c.modules.map(mod => (
            <div key={mod.id} style={{ marginBottom: 14, borderLeft: '3px solid var(--border)', paddingLeft: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{mod.title}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setAddingLessonFor(addingLessonFor === mod.id ? null : mod.id)}
                    style={{ ...btnGhost, color: '#FF6B35', borderColor: 'rgba(255,107,53,.3)', fontSize: 11 }}>+ Lekcja</button>
                  <button onClick={() => { if (confirm('Usunąć moduł i wszystkie lekcje?')) delModMut.mutate(mod.id) }} style={btnDanger}>Usuń moduł</button>
                </div>
              </div>

              {(mod.lessons as any[]).map((les: any) => (
                <div key={les.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.03)', marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: '#FF6B35', fontSize: 10, fontWeight: 700 }}>
                        {les.type === 'video' ? '▶' : les.type === 'pdf' ? 'PDF' : 'T'}
                      </span>
                      {les.title}
                      {les.duration_secs && <span style={{ color: 'var(--muted)', fontSize: 10 }}>{Math.round(les.duration_secs / 60)}min</span>}
                      {les.link_url && <a href={les.link_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: 10 }}>↗ link</a>}
                      {les.bunny_video_id && <span style={{ color: 'var(--muted)', fontSize: 10 }}>Bunny: {les.bunny_video_id.slice(0, 8)}…</span>}
                    </div>
                    {les.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, paddingLeft: 16 }}>{les.description}</div>}
                  </div>
                  <button onClick={() => { if (confirm('Usunąć lekcję?')) delLesMut.mutate(les.id) }} style={{ ...btnDanger, marginLeft: 8, flexShrink: 0 }}>✕</button>
                </div>
              ))}

              {addingLessonFor === mod.id && (
                <AddLessonForm moduleId={mod.id} onDone={() => setAddingLessonFor(null)} />
              )}
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
          { label: 'Zakupów łącznie', value: String(stats?.total_sales ?? '—'), color: 'var(--text)' },
          { label: 'Użytkownicy', value: String(stats?.total_users ?? '—'), color: 'var(--text)' },
        ].map(card => (
          <div key={card.label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('students')
  const tabs: { key: Tab; label: string }[] = [
    { key: 'students', label: 'Kursanci' },
    { key: 'courses', label: 'Kursy' },
    { key: 'sales', label: 'Sprzedaż' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 0' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>Panel Admin</h1>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Zarządzanie kursantami i treściami</div>
          </div>
          <a href="/dashboard" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>← Wróć</a>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(0,0,0,0.08)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '7px 20px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === t.key ? '#FF6B35' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--muted)', transition: 'all .15s',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'students' && <StudentsTab />}
        {tab === 'courses' && <CoursesTab />}
        {tab === 'sales' && <SalesTab />}
      </div>
    </div>
  )
}
