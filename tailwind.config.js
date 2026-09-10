/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          base: '#030712',
          surface: '#070e1e',
          overlay: '#0c1730',
          acrylic: 'rgba(7, 14, 30, 0.85)',
        },
        neon_cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00f0ff',
          600: '#0284c7',
        },
        neon_magenta: {
          400: '#f472b6',
          500: '#ec4899',
          600: '#d946ef',
        },
        neon_purple: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        neon_amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        foreground: {
          primary: '#f8fafc',
          secondary: '#93c5fd',
          muted: '#64748b',
          subtle: '#1e293b',
        },
        status: {
          success: '#00f0ff',
          warning: '#fbbf24',
          error: '#ff3366',
          info: '#38bdf8',
        }
      },
      fontFamily: {
        sans: ['"M PLUS 1"', '"IBM Plex Sans JP"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 12px rgba(0, 240, 255, 0.45), 0 0 24px rgba(0, 240, 255, 0.2)',
        'neon-cyan-strong': '0 0 18px #00f0ff, 0 0 36px rgba(0, 240, 255, 0.4)',
        'neon-magenta': '0 0 12px rgba(236, 72, 153, 0.45), 0 0 24px rgba(236, 72, 153, 0.2)',
        'neon-magenta-strong': '0 0 18px #ec4899, 0 0 36px rgba(236, 72, 153, 0.4)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.35)',
      },
    },
  },
  plugins: [],
}
