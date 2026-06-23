# Lecciones aprendidas · Can Ficus

Documento vivo. Captura todo lo que sirvió y todo lo que no, para reutilizar
en futuros proyectos. Dos partes: **técnica** (cómo construir) y **comercial**
(cómo vender, cobrar, traspasar).

Última revisión: 22 de junio de 2026.

---

## PARTE 1 · TÉCNICA

### 1.1 Errores cometidos y cómo evitarlos

| Error | Síntoma | Causa raíz | Cómo evitarlo |
| --- | --- | --- | --- |
| **Comentario JS sin cerrar tras Edit** | "currentLang is not defined" en consola del navegador, pero `new Function()` decía OK | Un Edit fusionó `/* ============ */` con la línea siguiente. El `*/` desapareció y el comentario engulló las declaraciones críticas. | Validar SIEMPRE con servidor HTTP local + abrir el navegador y mirar la consola antes de commitear. `new Function()` no detecta comentarios mal cerrados. |
| **Archivos HTML enormes con todo embebido** | Cada Edit pequeño truncaba el archivo a mitad del JS | El sistema de Edit/Write tiene un bug de sincronización con archivos grandes (>40 KB). Vista virtual y filesystem real desincronizan. | Modularizar: CSS y JS en archivos separados desde el día 1. Archivos < 500 líneas siempre que sea posible. |
| **Bytes nulos literales en regex** | El HTML servido se cortaba en medio de página (navegador rechaza bytes nulos) | Escribí `/[ -]+/` con caracteres de control literales en lugar de `/[\x00-\x1F]+/` | Para rangos de caracteres no imprimibles, **siempre** notación de escape `\xNN` o `\uNNNN`. Nunca pegar caracteres binarios en un editor. |
| **`mailto:` header injection** | Potencial inyección de Bcc/Cc vía CRLF en el campo nombre | `encodeURIComponent` no neutraliza CRLF; algunos clientes de correo los decodifican como cabeceras | Función `sanitize()` que strip caracteres de control antes de meter cualquier input en mailto/wa.me. |
| **Fetch sin servidor falla en local** | "Si abres con doble clic, no funciona" | `file://` bloquea fetch por CORS | Documentarlo siempre. Recordatorio en README + fallback elegante en la UI. Considerar pre-render si es crítico. |
| **Carpeta huérfana añadida al repo Git** | Netlify falla con "Cannot init submodule 'Can Ficus'" | `git add .` añadió una carpeta vacía con su propio `.git` dentro como submódulo | Antes de `git add .`, comprobar con `ls` que no hay carpetas residuales. Y `git status` antes de cualquier commit. |
| **Token de invitación quemado** | "User not found" tras aceptar invitación de Netlify Identity | El link de invitación va a `/` (home) pero el widget de Identity solo vive en `/admin/`. Token consumido sin completar setup. | Añadir el widget de Identity en TODA página pública para capturar invite_token y redirigir al `/admin/`. |
| **Cuentas en nombre del desarrollador** | Cliente no es propietario real de su web | "Crear cuenta rápido con mi email" durante la fase de desarrollo | Cuentas del cliente desde el día 1, con su email, 2FA activado. Tú entras como colaborador, no como dueño. |

### 1.2 Buenas prácticas confirmadas

- **JSON estático en repo + Decap CMS** es excelente para webs informativas (restaurantes, agencias, portfolios). Coste 0 €, velocidad máxima, seguridad alta por diseño.
- **5 idiomas con `data-i18n` + `data-content` mixto**: separar textos del sistema (nav, formularios) de los textos editables. Mantenibilidad altísima.
- **Sanitize universal de inputs** antes de cualquier acción (mailto, wa.me, URLs): elimina la mayoría de los vectores de inyección.
- **Honeypot anti-bot**: 4 líneas que filtran ~95 % del spam automatizado sin pedir CAPTCHA al usuario real.
- **CSS variables para imágenes en pseudo-elementos**: si el hero usa `::before` con background, una variable `--hero-img` permite sobrescribirla con JS.
- **Headers de seguridad vía `netlify.toml`**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Suben la nota en `securityheaders.com` y son gratuitos.
- **Cache largo para `/img/*` + cache corto para `/content/*`**: las fotos son inmutables; los datos del CMS deben verse rápido al editar.
- **JSON-LD de tipo `Restaurant`** (u otro `LocalBusiness`): mejora drásticamente la indexación en Google y la aparición en Maps.
- **TRASPASO.md desde el principio**: con campos en blanco para rellenar el día de la entrega.

### 1.3 Stack que funcionó bien (Tier 1 — webs estáticas)

| Capa | Elección | Cuándo usar |
| --- | --- | --- |
| Hosting | Netlify | Web estática, 100 GB/mes, free tier. |
| CMS | Decap CMS + Git Gateway | Cliente edita texto/fotos sin tocar código. |
| Auth admin | Netlify Identity (invite only) | Hasta 5 usuarios gratis. |
| Repo | GitHub (private) | Versionado y backup. |
| Dominio | Cloudflare Registrar | Precio a coste, sin sobrecoste. |
| Fonts | Google Fonts | Tipografía profesional, gratis. |
| Mapa | OpenStreetMap embed | Sin API key, sin tracking de Google. |
| Imágenes generadas | PIL + gradientes y ruido | Placeholders bonitos antes de tener fotos propias. |

### 1.4 Stack pendiente de probar (Tier 2 — apps con backend)

Para proyectos con autenticación multi-usuario, base de datos y storage de
ficheros (típico: marketplaces, plataformas SaaS pequeñas, apps internas):

| Capa | Elección | Por qué |
| --- | --- | --- |
| Backend / DB / Auth | Supabase | Postgres + Auth + Storage + RLS en una cuenta. Free tier 500 MB. |
| Frontend | SvelteKit (preferido) o Astro+Vue | App reactiva sin la sobrecarga de React/Next. Curva suave. |
| Vídeos / media pesada | Cloudinary (free 25 GB) o Bunny.net Stream | CDN global + transcoding automático. |
| Hosting | Vercel o Netlify | Despliegue automático desde GitHub. SvelteKit nativo. |
| Email transaccional | Resend (free 3K/mes) o Loops | Mejor que SMTP propio. |

### 1.5 Stack a evitar (o usar con cuidado)

- **WordPress**: para webs informativas modernas, es overkill. Lo que tarda en mantener (plugins, updates, seguridad) supera lo que ahorra en montarlo.
- **Wix/Squarespace**: parecen baratos pero cobran por siempre y locken al cliente. Sin valor diferencial frente a Decap+Netlify.
- **Firebase para apps relacionales**: si los datos son relacionales (cliente→entrenamiento→ejercicios), Postgres en Supabase encaja mucho mejor que Firestore.
- **Caracteres binarios en JS**: ya explicado arriba.
- **Apilar Edits sobre el mismo archivo HTML grande**: ya explicado.

### 1.6 Checklist técnico antes de cada push

```
[ ] Servidor HTTP local levantado (python -m http.server / npx serve)
[ ] Página principal abierta en navegador
[ ] DevTools → Console: 0 errores en rojo
[ ] DevTools → Network: todos los recursos en 200
[ ] Cambio de idioma reaplicado correctamente
[ ] Formulario probado (con datos válidos e inválidos)
[ ] Mobile: probado con DevTools en modo responsive
[ ] git status: nada inesperado
[ ] git log: el commit message describe lo que cambió
[ ] git push: confirmar "Your branch is up to date"
[ ] Netlify deploy verde
[ ] Refresco con Ctrl+Shift+R en producción y verificación visual
```

---

## PARTE 2 · COMERCIAL

### 2.1 Modelos de relación cliente

Tres modelos limpios. Elige antes de presupuestar:

**Modelo A — "Llave en mano sin mantenimiento"**

- Cliente paga una sola vez. Se le entregan las cuentas.
- Tú firmas disclaimer claro: "cualquier cambio futuro requiere contratar a un desarrollador".
- ✅ Bueno para: amigos cercanos que no quieren atarse, webs informativas estables que no van a cambiar.
- ❌ Malo para: apps con backend, datos de usuarios, vídeo. Algo se va a romper en 6-12 meses.

**Modelo B — "Llave en mano + mantenimiento mensual"**

- Cliente paga inicial + cuota mensual de 25-80 €.
- Mantenimiento incluye: backups, monitorización, 1-2 horas/mes de cambios pequeños, atender bugs sin facturar aparte.
- ✅ Bueno para: clientes con quien quieres relación a largo plazo, apps con backend, negocios que necesitan fiabilidad.
- Es el modelo profesional sano. Si el cliente lo rechaza, considera si quieres el proyecto.

**Modelo C — "Yo pago la infraestructura"**

- Tú mantienes las cuentas. El cliente paga cuota mensual que incluye hosting + tu tiempo.
- ✅ Bueno para: ingreso recurrente garantizado, control total.
- ❌ Malo para: el cliente está en lock-in. Si dejas de pagar tú, la web cae. Un cliente avispado lo verá rápido.

### 2.2 Cómo presupuestar (rangos reales en España 2026)

| Tipo de proyecto | Horas | €/h amigo | €/h pro | Total amigo | Total pro |
| --- | --- | --- | --- | --- | --- |
| Web informativa estática (1 página, 2 idiomas) | 12–20 | 30 | 50 | 400-600 € | 600-1000 € |
| Web restaurante tipo Can Ficus | 30–50 | 35 | 50 | 1.000-1.800 € | 1.500-2.500 € |
| Landing + CRM básico para una PYME | 40–70 | 40 | 55 | 1.600-2.800 € | 2.200-3.850 € |
| App con auth + DB + media (tipo entrenador) | 80–120 | 35 | 55 | 2.800-4.200 € | 4.400-6.600 € |
| E-commerce a medida | 100–200 | 40 | 60 | 4.000-8.000 € | 6.000-12.000 € |

**Reglas:**

- Si pides menos del rango "amigo", estás perdiendo dinero y atrayendo malos clientes.
- Si pides más del rango "pro" sin ser una agencia, pierdes el deal frente a alternativas.
- Suma siempre un **20–30 % de buffer** para imprevistos. Los hay. Siempre.
- Cuota de mantenimiento ≈ **1-3 % del coste de desarrollo / mes**. Web de 2.000 € → 30-60 €/mes.

### 2.3 Cómo traspasar a un cliente sin perder la cabeza

**Antes de empezar a programar:**

1. Confirma por escrito (email basta) el alcance, el coste y los plazos.
2. Decide modelo de relación (A, B o C).
3. Decide quién compra el dominio.
4. Decide qué cuentas creará el cliente y cuáles tú.
5. Pide un 30-50 % por adelantado para arrancar.

**Durante el desarrollo:**

1. **Cuentas del cliente** (GitHub, Netlify, Cloudinary, registrar): que las cree él, con su email, 2FA activado. Tú entras como colaborador.
2. Trabaja en una **rama o repo intermedio si no quieres que vea el código en proceso**. Para amigos no merece la pena.
3. Hitos cada 2-3 días con captura/URL temporal. Mantén al cliente involucrado.

**El día del traspaso:**

1. Sentados juntos (en persona o videollamada).
2. Rellena el `TRASPASO.md` con sus datos delante de él.
3. Activa todas las cuentas con su email definitivo si no estaban.
4. Que él haga un cambio en el panel admin contigo al lado. Hasta que no lo haga, no es "suyo".
5. Cobra el resto del importe.
6. Firma el disclaimer (un párrafo en `TRASPASO.md` basta) sobre qué incluye y qué no la entrega.

**Después del traspaso:**

1. Envío email de cortesía a los 7 días: "¿todo bien?". Crea recuerdo positivo.
2. Si Modelo B (con mantenimiento), agenda recordatorio mensual de revisar uptime y enviar resumen.
3. Mantén tus credenciales en el llavero pero **borra contraseñas innecesarias** que ya no controles.

### 2.4 Plantilla de email de propuesta

```
Hola [nombre],

Te paso el resumen de lo hablado.

ALCANCE
- Web one-page con sección de carta
- 5 idiomas (ES, EN, DE, FR, IT)
- Formulario de reservas por email + WhatsApp
- Panel de administración para que edites carta, fotos y horarios

FUERA DEL ALCANCE
- Sesión de fotos profesional
- Logo profesional (uso provisional)
- Integración con sistemas de reserva en tiempo real (TheFork, etc.)

COSTE
- Desarrollo + despliegue: ___ € (IVA aparte)
- Mantenimiento mensual: ___ €/mes (opcional)
- Dominio: ~12 €/año (lo compras tú directamente)

PLAZOS
- Maqueta para revisar: __ días desde confirmación
- Web online en pruebas: __ días
- Entrega final: __ días

CONDICIONES
- 50 % al confirmar / 50 % al entregar
- Tras la entrega, cualquier cambio nuevo se valora aparte

¿Confirmamos para arrancar la semana del __?

Un abrazo.
```

### 2.5 Disclaimer a incluir SIEMPRE en TRASPASO.md

> Esta web se entrega en estado funcional, sin compromiso de mantenimiento
> continuado por parte del desarrollador. El cliente acepta que cualquier
> modificación posterior (añadir secciones, corregir bugs, actualizar
> dependencias, migrar tecnologías) requiere contratar a un desarrollador
> profesional. Las cuentas de [GitHub, Netlify, Cloudinary, registrar] son
> propiedad del cliente. La continuidad del servicio depende de que el
> cliente renueve el dominio anualmente y mantenga sus cuentas activas.
> El cliente declara haber recibido la guía de uso y haber realizado al
> menos una modificación de prueba en el panel de administración.

Firmado: ______________________
Fecha: ________________________

---

## PARTE 3 · PLANTILLAS REUTILIZABLES

### 3.1 Estructura inicial de proyecto web informativo

```
proyecto/
├── index.html              ← landing
├── carta.html / servicios.html / ...
├── admin/
│   ├── index.html          ← UI Decap CMS
│   └── config.yml          ← qué edita el cliente
├── content/
│   ├── inicio.json         ← textos home
│   ├── info.json           ← contacto, horarios
│   └── ...                 ← según secciones
├── img/                    ← fotos (suben desde el panel)
├── favicon.svg + variantes PNG
├── og-image.jpg            ← 1200x630 para compartir
├── netlify.toml            ← headers seguridad, cache, redirects
├── sitemap.xml + robots.txt
├── README.md               ← técnico
└── TRASPASO.md             ← cliente
```

### 3.2 Documentos a generar SIEMPRE

| Documento | Para quién | Cuándo |
| --- | --- | --- |
| `README.md` | Desarrollador (tú o el siguiente) | Mientras desarrollas |
| `TRASPASO.md` | Cliente final | Antes del traspaso, rellenar el día |
| Email de propuesta | Cliente, ANTES de empezar | Tras la reunión de scoping |
| Disclaimer firmado | Ambos | El día de la entrega |

### 3.3 Comandos PowerShell útiles

```powershell
# Servidor local rápido sin Python
npx.cmd serve

# Habilitar scripts de PowerShell (permanente, una vez por máquina)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Verificar HTML en bloc
(Get-Content archivo.html).Count
Get-Content archivo.html -Tail 5

# Git: estado claro antes de tocar nada
git status
git log --oneline -5

# Git: cambiar el remote tras transferir repo
git remote set-url origin https://github.com/NUEVO-USUARIO/repo.git
```

---

## PARTE 4 · CHECKLIST POR FASE

### 4.1 Fase 0 — Scoping (antes de presupuestar)

- [ ] Reunión presencial o videollamada de 1 h
- [ ] Brief escrito tras la reunión, enviado por email
- [ ] Confirmación expresa del cliente sobre alcance
- [ ] Modelo de relación elegido (A / B / C)
- [ ] Presupuesto enviado por email con desglose

### 4.2 Fase 1 — Pre-desarrollo

- [ ] 50 % por adelantado cobrado
- [ ] Cuentas del cliente creadas con su email + 2FA
- [ ] Repo en GitHub creado (privado)
- [ ] Tarea creada en gestor (Notion, Trello, lo que uses) con hitos
- [ ] Stack confirmado
- [ ] Carpeta de proyecto inicializada con la estructura de 3.1

### 4.3 Fase 2 — Desarrollo

- [ ] Hitos cada 2-3 días con URL/captura compartida
- [ ] Después de cada cambio importante: servidor local + consola del navegador
- [ ] Commits pequeños con mensajes claros
- [ ] README actualizado conforme avanza

### 4.4 Fase 3 — Despliegue

- [ ] Netlify conectado al repo
- [ ] Headers de seguridad activos (`netlify.toml`)
- [ ] HTTPS automático funcionando
- [ ] Dominio propio configurado (si aplica)
- [ ] Panel admin probado por ti
- [ ] Cliente invitado, se loguea y edita una cosa

### 4.5 Fase 4 — Traspaso

- [ ] `TRASPASO.md` rellenado en presencia del cliente
- [ ] Cliente realiza una modificación en vivo
- [ ] Disclaimer firmado
- [ ] Saldo cobrado
- [ ] Email de cortesía agendado a 7 días
- [ ] Mantenimiento mensual configurado (si modelo B)

### 4.6 Fase 5 — Post-traspaso

- [ ] Email cortesía a 7 días
- [ ] Revisión mensual si modelo B (uptime, backups, dependencias)
- [ ] Renovación anual: recordar al cliente fecha de renovación de dominio

---

## PARTE 5 · IDEAS A FUTURO (backlog del playbook)

Cosas que merecería la pena codificar en plantillas reutilizables algún día:

- **Starter `restaurant-static-cms`**: el código de Can Ficus limpiado, sin nombres hardcodeados, listo para clonar y rellenar.
- **Starter `trainer-app`**: SvelteKit + Supabase + Cloudinary, con auth, RLS y modelo base.
- **Starter `landing-pyme`**: web genérica de servicios (consultoría, abogados, fisios…).
- **Generador de favicons + OG images** desde un YAML de marca (color, letra, nombre).
- **Validador de proyecto** pre-commit: corre el servidor, abre headless Chrome, valida que la consola está limpia.
- **Email transaccional listo**: formulario que va a Resend/Loops en vez de mailto.

---

*Fin del documento. Este archivo se actualiza con cada proyecto.*
