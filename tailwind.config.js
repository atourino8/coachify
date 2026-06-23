/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Paleta Coachify — Deep Blue + Electric
        bg: '#0a1628',
        surface: '#122340',
        'surface-2': '#1a2e4a',
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb'
        },
        accent: '#38bdf8',
        text: {
          DEFAULT: '#f1f5f9',
          mute: '#94a3b8'
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        full: '9999px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,.3)',
        md: '0 8px 24px -8px rgba(0,0,0,.4)',
        lg: '0 24px 48px -16px rgba(0,0,0,.5)',
        glow: '0 0 40px -10px rgba(59,130,246,.5)'
      }
    }
  },
  plugins: []
};
