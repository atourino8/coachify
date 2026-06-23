# Coachify

SaaS B2B para entrenadores personales. Construido con **SvelteKit** + **Supabase**
+ **Cloudinary**. Hosting en **Vercel**.

> 📄 Documentos del proyecto:
> - [`SPEC-TRAINER.md`](./SPEC-TRAINER.md) — especificación completa (modelo de datos, pantallas, roadmap, presupuesto).
> - [`LECCIONES.md`](./LECCIONES.md) — aprendizajes acumulados de proyectos previos (Can Ficus + este).

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | SvelteKit 2 + Svelte 5 (con runes) |
| Estilos | Tailwind CSS 3 + design tokens (paleta Deep Blue + Electric) |
| Tipado | TypeScript strict |
| Backend (Fase B+) | Supabase (Postgres + Auth + Storage + RLS) |
| Vídeos (Fase C+) | Cloudinary |
| Pagos (v1.5+) | Stripe |
| OAuth Google Calendar (v1) | Google Identity Services |
| Hosting | Vercel |
| Email (v1) | Resend |

---

## Empezar en local

```bash
npm install
npm run dev
```

La app levanta en [http://localhost:5173](http://localhost:5173).

**Otros comandos:**

```bash
npm run build       # build de producción
npm run preview     # previsualizar build localmente
npm run check       # type-check con svelte-check
npm run format      # prettier write
npm run lint        # prettier check
```

---

## Estructura del proyecto

```
src/
├── app.html                ← shell HTML
├── app.css                 ← Tailwind directives + design tokens
├── app.d.ts                ← tipos globales
├── routes/
│   ├── +layout.svelte      ← layout raíz
│   ├── +page.svelte         ← landing pública
│   ├── login/+page.svelte   ← login (UI Fase A)
│   ├── register/+page.svelte ← registro (UI Fase A)
│   ├── legal/
│   │   ├── terminos/+page.svelte
│   │   └── privacidad/+page.svelte
│   ├── (coach)/             ← rutas autenticadas de coach (Fase B)
│   ├── (client)/            ← rutas autenticadas de cliente (Fase B)
│   └── api/                 ← endpoints serverless (Stripe webhook, Google OAuth, etc.)
├── lib/
│   ├── supabase.ts          ← cliente Supabase (Fase B)
│   ├── stripe.ts            ← cliente Stripe (Fase 1.5)
│   ├── google-calendar.ts   ← OAuth + API (Fase B)
│   ├── cloudinary.ts        ← upload helper (Fase C)
│   ├── components/          ← componentes reutilizables
│   └── stores/              ← stores Svelte (user, tenant, etc.)
└── static/
    └── favicon.svg
```

---

## Roadmap

| Fase | Alcance | Estado |
| --- | --- | --- |
| **A** | Scaffolding SvelteKit + Tailwind + landing pública estática + login/register UI | ✅ En curso |
| **B** | Supabase (DB + Auth + RLS) + dashboard básico por rol | 🔜 |
| **C** | Cloudinary + biblioteca de ejercicios con vídeos | 🔜 |
| **v1** | Producto completo según `SPEC-TRAINER.md` | 🔜 |
| **v1.5** | Plantillas + PWA + Stripe + etiquetas + vista mensual | 🔜 |
| **v2** | Analytics + app nativa Capacitor + tracking enriquecido + multi-idioma | 🔜 |

---

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores reales conforme avancen las
fases. **`.env.local` NUNCA se commitea** (está en `.gitignore`).

---

## Despliegue

Push a `main` → Vercel desplegará automáticamente. La URL del proyecto será del tipo
`coachify-xxx.vercel.app` hasta que se conecte un dominio propio.

---

## Convenciones

- **Idioma del código y comentarios**: inglés.
- **Idioma de la UI por defecto**: español. Multi-idioma ES+EN llega en v2.
- **Commits**: mensajes en español, descriptivos (no `fix bug`).
- **Branches**: trabajo en `main` directamente mientras seamos pocos. Cuando entren más devs, feature branches.
- **Tests**: viven junto al componente (`Component.test.ts`). Vitest. Llegan en Fase B.

---

## Soporte

Esto es un proyecto en desarrollo activo. Issues y feedback bienvenidos al email del equipo.
