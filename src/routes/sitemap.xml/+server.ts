// Sitemap de las rutas PÚBLICAS.
//
// Solo entran páginas que un buscador puede ver sin iniciar sesión. Las del
// entrenador y las del cliente están detrás de autenticación: incluirlas sería
// prometerle a Google contenido al que va a responder con una redirección.
//
// El dominio se toma del origen de la petición en vez de escribirlo aquí: así
// el sitemap es correcto en local, en cada previsualización de Vercel y en el
// dominio definitivo, sin tocar código ni arrastrar una variable de entorno más.
//
// OJO: mientras robots.txt diga "Disallow: /" (beta privada) este sitemap no
// sirve de nada. Está listo para el día del lanzamiento, que es cuando hay que
// sustituir robots.txt y apuntar aquí.

import type { RequestHandler } from './$types';

/** Rutas públicas: la ruta y su prioridad relativa. */
const RUTAS: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/login', priority: '0.5', changefreq: 'yearly' },
  { path: '/register', priority: '0.8', changefreq: 'monthly' },
  { path: '/legal/terminos', priority: '0.3', changefreq: 'yearly' },
  { path: '/legal/privacidad', priority: '0.3', changefreq: 'yearly' },
  { path: '/legal/cookies', priority: '0.3', changefreq: 'yearly' }
];

export const GET: RequestHandler = ({ url }) => {
  const origin = url.origin;
  const hoy = new Date().toISOString().slice(0, 10);

  const urls = RUTAS.map(
    (r) => `  <url>
    <loc>${origin}${r.path}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
