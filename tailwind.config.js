/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // ---------------------------------------------------------------------
      // PALETA
      //
      // Los colores NO viven aquí: viven en variables CSS (src/app.css). Aquí
      // solo se declara qué variable usa cada token.
      //
      // Por qué el formato "rgb(var(--x) / <alpha-value>)" y no el hexadecimal
      // directo en la variable: usamos mucho `bg-accent/10`, `border-accent/20`
      // y similares. Para que Tailwind pueda aplicar esas transparencias
      // necesita los canales sueltos ("179 68 30"), no un "#B3441E". Con
      // hexadecimal, todas las opacidades del proyecto dejarían de funcionar
      // en silencio, que es peor que romperse.
      //
      // La ventaja: cambiar la paleta entera —la nuestra, o la de un
      // entrenador -es reescribir variables en tiempo de ejecución. Ni
      // recompilar, ni tocar componentes.
      // ---------------------------------------------------------------------
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)', // papel
        surface: 'rgb(var(--c-surface) / <alpha-value>)', // fichas y paneles
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)', // relleno sutil, hover
        primary: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)', // acciones principales
          hover: 'rgb(var(--c-primary-hover) / <alpha-value>)'
        },
        accent: 'rgb(var(--c-accent) / <alpha-value>)', // identidad, nav activo, enlaces
        // Líneas: separan sin encajonar. Son la base de las listas densas.
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'line-strong': 'rgb(var(--c-line-strong) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--c-text) / <alpha-value>)',
          mute: 'rgb(var(--c-text-mute) / <alpha-value>)'
        },
        // Estos tres NO son personalizables: significan algo. Un aviso de error
        // en el verde de la marca de alguien deja de comunicar que es un error.
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)'
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
