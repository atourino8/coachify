// Generación de CSV pensada para que se abra bien en Excel en España.
//
// Dos decisiones que parecen manías y no lo son:
//
// 1. SEPARADOR PUNTO Y COMA. Excel no lee el separador del fichero: usa el de
//    la configuración regional. En España el separador de lista es `;` y la
//    coma es el decimal. Con un CSV separado por comas, Excel español mete
//    toda la fila en la columna A y el entrenador ve un churro.
//
// 2. BOM AL PRINCIPIO. Sin él, Excel no detecta que el fichero es UTF-8 y
//    "Nadia Ferrer · técnica" acaba como "NadÃ­a FerrÃ©r". Tres bytes que
//    ahorran la queja más típica de cualquier export en español.
//
// Los importes se escriben con coma decimal por lo mismo: para que Excel los
// entienda como números y se puedan sumar, no como texto.

/** Escapa un valor para CSV: comillas dobles si hay separador, comillas o saltos. */
function escapar(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (/[";\n\r]/.test(texto)) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

/** Número con coma decimal, para que Excel español lo lea como número. */
export function numeroCSV(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '';
  return valor.toFixed(decimales).replace('.', ',');
}

/**
 * Construye el CSV completo, con BOM incluido.
 * `cabeceras` y cada fila deben tener el mismo número de columnas.
 */
export function construirCSV(cabeceras: string[], filas: unknown[][]): string {
  const BOM = '﻿';
  const lineas = [cabeceras.map(escapar).join(';')];
  for (const fila of filas) {
    lineas.push(fila.map(escapar).join(';'));
  }
  // CRLF: es lo que espera el estándar de CSV y lo que menos sorpresas da en
  // Windows, que es donde van a abrirlo.
  return BOM + lineas.join('\r\n') + '\r\n';
}

/** Respuesta HTTP lista para que el navegador descargue el fichero. */
export function respuestaCSV(nombre: string, contenido: string): Response {
  return new Response(contenido, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'no-store'
    }
  });
}
