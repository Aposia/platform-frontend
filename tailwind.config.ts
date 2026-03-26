import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphism dark (platforma kursowa)
        'bg-dark': '#0d0f1c',
        'card': 'rgba(255,255,255,0.07)',
        'border': 'rgba(255,255,255,0.10)',
        'orange': '#FF6B35',
        'green': '#34C759',
        'yellow': '#FFD60A',
        'blue': '#0A84FF',
        'red-alert': '#FF453A',
        'muted': 'rgba(240,240,248,0.45)',
        // Sprzedażowe (landing pages style)
        'cream': '#F5F0E8',
        'navy': '#1B2A4A',
        'brand-orange': '#F97316',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
      backdropBlur: {
        'glass': '28px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.35)',
        'glass-sm': '0 4px 16px rgba(0,0,0,0.25)',
        'orange-glow': '0 14px 40px rgba(255,107,53,0.4)',
      },
      borderRadius: {
        'glass': '16px',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
