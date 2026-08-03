/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Paleta Coachify — "Cuaderno de entrenador".
        // Fondo papel, tinta casi negra y un único acento terracota.
        // Deliberadamente fuera del oscuro+neón que usa todo el sector.
        bg: '#FBFAF7', // papel
        surface: '#FFFFFF', // fichas y paneles
        'surface-2': '#F2EFE7', // relleno sutil, hover
        primary: {
          DEFAULT: '#1C1A16', // tinta: acciones principales
          hover: '#37332C'
        },
        accent: '#B3441E', // terracota: identidad, nav activo, enlaces
        // Líneas: separan sin encajonar. Son la base de las listas densas.
        line: '#E5E1D6',
        'line-strong': '#D9D5CA',
        text: {
          DEFAULT: '#1C1A16',
          mute: '#6B665C'
        },
        danger: '#8C1D18',
        warning: '#8A5A0B',
        success: '#3F6B2B'
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
        sm: '0 1px 2px rgba(28,26,22,.06)',
        md: '0 4px 16px -6px rgba(28,26,22,.10)',
        lg: '0 16px 40px -12px rgba(28,26,22,.14)',
        glow: '0 4px 16px -6px rgba(28,26,22,.14)'
      }
    }
  },
  plugins: []
};
