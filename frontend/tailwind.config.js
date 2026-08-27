/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#69C98B',
          deepGreen: '#2F7D50',
          mint: '#E8F7EE',
          teal: '#4FB3A4',
          blue: '#6FA8DC',
          lavender: '#9B8CC4',
          amber: '#F3C969',
          coral: '#E98585',
          high: '#f43f5e',
          moderate: '#f59e0b',
          low: '#10b981',
          'high-bg': '#f43f5e',
          'moderate-bg': '#f59e0b',
          'low-bg': '#10b981',
          bg: 'var(--bg-color)',
          card: 'var(--card-bg)',
          text: 'var(--text-color)',
          muted: 'var(--muted)',
          faint: 'var(--faint)',
          border: 'var(--border-color)',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s infinite ease-in-out',
        'blob': 'blob 7s infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(105, 201, 139, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(105, 201, 139, 0.45)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
