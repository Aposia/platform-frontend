'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { apiGetProducts, apiCreateStripeSession } from '@/lib/api'

interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  price_pln: number
}

// ── Kontent per produkt ────────────────────────────────────────────────────────

const PRODUCT_CONTENT: Record<string, {
  tagline: string
  desc: string
  includes: string[]
  for_who: string
  emoji: string
}> = {
  'ai-avatar-starter-pack': {
    emoji: '🤖',
    tagline: 'Stwórz swojego pierwszego awatara AI w 30 minut',
    desc: 'To nie jest e-book. To interaktywny panel w którym pracujesz — kopiujesz gotowe rozwiązania jednym kliknięciem i masz efekt w 30 sekund.',
    includes: [
      '16 gotowych awatarów o różnych osobowościach (kobiety i mężczyźni)',
      'Instrukcja: profesjonalne zdjęcia za 0 zł, bez subskrypcji',
      'Metoda "Podwójnego Promptu" + 24 gotowe scenariusze sesji zdjęciowej',
      'Działa na telefonie, tablecie i komputerze — bez aplikacji',
      'Dostęp 24/7 — otwierasz link i masz wszystko',
    ],
    for_who: 'Dla osób które chcą zacząć z awatarami AI bez chaosu i teorii. Idealny pierwszy krok.',
  },
  '36-promptow-extra': {
    emoji: '✍️',
    tagline: '36 gotowych scenariuszy do kopiowania',
    desc: 'Mix lifestylowych ujęć do Reelsów i feedu — prompty gotowe do wklejenia lub modyfikacji. Zero wymyślania, zero tracenia czasu.',
    includes: [
      '36 scenariuszy dla awatara (lifestyle, city, studio, travel)',
      'Prompty gotowe do skopiowania 1:1 lub modyfikacji',
      'Kompatybilne z Nano-Banana PRO i Nano Banana 2',
      'Mix stylów: editorial, UGC, street, wellness, interior',
      'Dostęp dożywotni + przyszłe aktualizacje',
    ],
    for_who: 'Dla osób które mają już awatara i chcą szybko rozbudować content bez wymyślania promptów.',
  },
  'biblioteka-tel': {
    emoji: '🖼️',
    tagline: 'Gotowe studia fotograficzne — bez wynajmu i fotografa',
    desc: 'Katalog profesjonalnych teł do reklam. Wgrywasz tło jako referencję, wrzucasz modelkę i masz gotową reklamę w kilka minut. Zastępuje wynajem studia za 1500–3000 zł.',
    includes: [
      'Gotowe tła w kategoriach: Beauty, Gastro, Butik, Dom, Biuro',
      'Format 16:9 — zaprojektowane pod generatory AI',
      'Prompty do każdego tła (możesz modyfikować)',
      'Instrukcja krok po kroku: wgraj modelkę → wybierz tło → generuj',
      'Generuj w dowolnym formacie: 9:16, 1:1, 16:9',
    ],
    for_who: 'Dla osób po kursie Modelka AI lub AI Creator Studio, które chcą szybko tworzyć reklamy produktowe.',
  },
  'modelka-ai': {
    emoji: '📸',
    tagline: 'Profesjonalne zdjęcia reklamowe z własnego komputera — w 60 minut',
    desc: 'Krótki, konkretny kurs techniczny. Tworzysz profesjonalną postać do reklam swojego biznesu — bez sesji zdjęciowej, bez fotografa, bez pokazywania twarzy.',
    includes: [
      'Krok po kroku: od zera do gotowej postaci reklamowej',
      'Dla gastronomii, salonów, usług — każdej branży bez marki osobistej',
      'Gotowe prompty i narzędzia z linkami',
      'Materiały reklamowe gotowe do użycia od razu',
      'Dostęp dożywotni + wszystkie aktualizacje',
    ],
    for_who: 'Dla przedsiębiorców którzy nie chcą budować marki osobistej, ale potrzebują profesjonalnej postaci do reklam.',
  },
  'ai-creator-studio': {
    emoji: '🚀',
    tagline: 'Pełny system: awatar, Reelsy, posty, brand — bez kamery i bez zespołu',
    desc: 'Budujesz markę online z własnym awatarem AI. Od zera do hiperrealistycznego awatara z wideo i głosem — każda faza to praktyczne lekcje z nagraniami ekranu i gotowymi promptami.',
    includes: [
      'Awatar AI: tworzenie, personalizacja, sesja zdjęciowa',
      'Reelsy i video content bez nagrywania siebie',
      'Posty, stories, brand presence na autopilocie',
      'Asystenci AI piszący prompty za Ciebie (oszczędzasz 80% czasu)',
      'Dostęp dożywotni + wszystkie przyszłe aktualizacje gratis',
    ],
    for_who: 'Dla twórców i przedsiębiorców którzy chcą budować markę online z awatarem — bez kamery, bez nagrywania.',
  },
  'oto_mniej_roboty': {
    emoji: '🧠',
    tagline: 'Gotowy system do pracy z Claude — efekt w 30 minut',
    desc: 'Asystent Decyzji i Strategii. Przestajesz siedzieć sama z każdą decyzją biznesową. Claude zna Twój biznes i jest dostępny o 23:00.',
    includes: [
      'Gotowy system Claude Projects do natychmiastowego wdrożenia',
      'Szablony kontekstu biznesowego — wypełnij raz, działa zawsze',
      'Scenariusze: copy, strategia, decyzje, burza mózgów',
      'Instrukcja jak "nauczyć" Claude swojego biznesu',
      'Dostęp dożywotni do materiałów',
    ],
    for_who: 'Dla osób prowadzących biznes solo, które płacą za Claude Pro i chcą w końcu z tego korzystać.',
  },
}

// ── Auth Modal ─────────────────────────────────────────────────────────────────

function AuthModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, fullName)
      } else {
        await login(email, password)
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Coś poszło nie tak. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>
          {mode === 'register' ? 'Utwórz konto aby kontynuować' : 'Zaloguj się aby kontynuować'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Potrzebujemy Twojego konta żeby przypisać zakup.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 4, background: 'var(--bg)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
          {(['register', 'login'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, fontSize: 13, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s',
              background: mode === m ? 'var(--orange)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-muted)',
            }}>{m === 'register' ? 'Nowe konto' : 'Mam konto'}</button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="Imię" required />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="Email" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Hasło (min. 8 znaków)" required minLength={8} />
          {error && <p style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary" style={{ textAlign: 'center' }}>
            {loading ? 'Chwilka...' : mode === 'register' ? 'Utwórz konto i kup →' : 'Zaloguj i kup →'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Checkout Page ──────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams()
  const slug = params.slug as string
  const { user } = useAuth()

  const [showAuth, setShowAuth] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: apiGetProducts,
  })

  const product = products?.find((p: Product) => p.slug === slug)
  const content = PRODUCT_CONTENT[slug]

  async function startCheckout() {
    setError('')
    setCheckoutLoading(true)
    try {
      const { checkout_url } = await apiCreateStripeSession(slug)
      window.location.href = checkout_url
    } catch {
      setError('Nie udało się otworzyć strony płatności. Spróbuj ponownie.')
      setCheckoutLoading(false)
    }
  }

  function handleBuyClick() {
    if (!user) {
      setShowAuth(true)
    } else {
      startCheckout()
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); startCheckout() }} />
      )}

      {/* Nav */}
      <header style={{ borderBottom: '1.5px solid var(--border)', padding: '14px 24px', background: 'var(--card)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>← Dashboard</Link>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MNIEJ ROBOTY</span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {!product ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 32, height: 32, border: '2.5px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

            {/* LEFT — opis produktu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Header */}
              <div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{content?.emoji || '📦'}</div>
                <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {product.type === 'guide' ? 'Materiał' : 'Kurs'}
                </span>
                <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, color: 'var(--heading)', margin: '8px 0 12px', fontFamily: 'var(--serif)', lineHeight: 1.2 }}>
                  {product.name}
                </h1>
                {content?.tagline && (
                  <p style={{ fontSize: 16, color: 'var(--orange)', fontWeight: 600, marginBottom: 12 }}>{content.tagline}</p>
                )}
                <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7 }}>
                  {content?.desc || product.description}
                </p>
              </div>

              {/* Co dostajesz */}
              {content?.includes && (
                <div className="card" style={{ padding: 24 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Co dostajesz
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {content.includes.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dla kogo */}
              {content?.for_who && (
                <div style={{ padding: '16px 20px', background: 'rgba(255,107,0,0.06)', borderRadius: 14, border: '1.5px solid rgba(255,107,0,0.15)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dla kogo</span>
                  <p style={{ fontSize: 14, color: 'var(--text)', marginTop: 6, lineHeight: 1.6 }}>{content.for_who}</p>
                </div>
              )}
            </div>

            {/* RIGHT — karta zakupu */}
            <div className="card" style={{ padding: 28, position: 'sticky', top: 88 }}>

              {/* Cena */}
              <div style={{ textAlign: 'center', padding: '20px 0 24px', borderBottom: '1.5px solid var(--border)', marginBottom: 24 }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--heading)', lineHeight: 1 }}>
                  {product.price_pln} PLN
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>jednorazowo · dostęp dożywotni</div>
              </div>

              {/* Gwarancje */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {['Dostęp natychmiast po zakupie', 'Dostęp dożywotni do materiałów', 'Wszystkie przyszłe aktualizacje gratis'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text)' }}>
                    <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 13 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button onClick={handleBuyClick} disabled={checkoutLoading} className="btn-primary" style={{ width: '100%', textAlign: 'center', fontSize: 16, padding: '14px', fontWeight: 700 }}>
                {checkoutLoading ? 'Przekierowuję...' : `Kup za ${product.price_pln} PLN →`}
              </button>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}>
                🔒 Bezpieczna płatność · Karta lub BLIK
              </p>

              {/* Powrót */}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1.5px solid var(--border)', textAlign: 'center' }}>
                <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Wróć do dashboardu
                </Link>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Responsive — na mobile kolumna */}
      <style>{`
        @media (max-width: 720px) {
          main > div > div:first-child { display: flex; flex-direction: column; }
          main > div { grid-template-columns: 1fr !important; }
          main > div > div:last-child { position: static !important; }
        }
      `}</style>
    </div>
  )
}
