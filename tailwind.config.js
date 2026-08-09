/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    // ---------------------------------------------------------------------
    // COLORES · fuera de `extend` A PROPÓSITO
    //
    // Al declararlos aquí (y no en theme.extend) se BORRA la paleta por
    // defecto de Tailwind. Eso significa que `bg-indigo-600`, `text-slate-900`
    // y compañía dejan de compilar: el build falla en vez de colar un color
    // que no es nuestro.
    //
    // Forzar el fallo es justo el objetivo. La paleta por defecto de Tailwind
    // es lo que aparece en millones de tutoriales, así que es a lo que tira
    // por defecto cualquier generador de código —y cualquiera con prisa—.
    // Si no compila, no hay atajo posible.
    //
    // Se conservan solo los cuatro universales, que sí usamos: white (texto
    // sobre acento), black (fondos de modal), transparent y current.
    // ---------------------------------------------------------------------
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      white: '#ffffff',
      black: '#000000',

      bg: 'rgb(var(--c-bg) / <alpha-value>)',
      surface: 'rgb(var(--c-surface) / <alpha-value>)',
      'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
      primary: {
        DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
        hover: 'rgb(var(--c-primary-hover) / <alpha-value>)'
      },
      accent: 'rgb(var(--c-accent) / <alpha-value>)',
      line: 'rgb(var(--c-line) / <alpha-value>)',
      'line-strong': 'rgb(var(--c-line-strong) / <alpha-value>)',
      text: {
        DEFAULT: 'rgb(var(--c-text) / <alpha-value>)',
        mute: 'rgb(var(--c-text-mute) / <alpha-value>)'
      },
      danger: 'rgb(var(--c-danger) / <alpha-value>)',
      warning: 'rgb(var(--c-warning) / <alpha-value>)',
      success: 'rgb(var(--c-success) / <alpha-value>)'
    },
    extend: {
      // La escala de texto de Tailwind empieza en 12px (text-xs) y el diseño
      // necesita bajar más. Sin estos escalones aparecían 33 tamaños
      // inventados a mano (`text-[10px]`, `text-[11px]`…), que es la deriva
      // típica: si la escala no llega, se improvisa.
      fontSize: {
        '3xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
        '2xs': ['0.6875rem', { lineHeight: '1rem' }] // 11px
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Serif con carácter para titulares: da voz editorial y separa
        // jerarquía sin recurrir a decoración.
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        full: '9999px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,.35)',
        md: '0 4px 16px -6px rgba(0,0,0,.45)',
        lg: '0 16px 40px -12px rgba(0,0,0,.55)',
        glow: '0 4px 16px -6px rgba(0,0,0,.5)'
      }
    }
  },
  plugins: []
};
