/**
 * El aviso de «ya está hecho», uno para toda la aplicación.
 *
 * EL PROBLEMA QUE RESUELVE
 *
 * Había setenta y ocho acciones y veinticinco terminaban sin decir nada:
 * pulsabas «Proponer cita», el panel se quedaba abierto igual que estaba y
 * ninguna palabra confirmaba que hubiera pasado algo. La duda que deja eso
 * —«¿lo habrá cogido?»— se resuelve pulsando otra vez, que es justo lo que no
 * se quiere.
 *
 * Y las que sí avisaban lo hacían **cada una a su manera**, con una bandera
 * distinta en el `form` de su pantalla. Veinticinco maneras de contestar a la
 * misma pregunta.
 *
 * POR QUÉ UNA COOKIE Y NO EL `form`
 *
 * Porque `form` **no sobrevive a una redirección**. Y redirigir es justo lo que
 * hace falta cuando la acción te tiene que devolver a donde empezaste: borras
 * una clase y vuelves al listado, guardas un ejercicio y vuelves a la
 * biblioteca. Con `form` el mensaje se pierde en el salto y aterrizas en una
 * pantalla que no cuenta nada.
 *
 * La cookie viaja con la redirección y también sin ella: al volver de una
 * acción, `use:enhance` revalida y el layout la lee igual.
 *
 * DE UN SOLO USO
 *
 * Se borra al leerla. Si no, el «Cita propuesta» seguiría saliendo tres
 * pantallas después, y un aviso que no se va deja de leerse.
 *
 * NO ES UNA COOKIE DE LAS QUE HAY QUE CONSENTIR: guarda una frase que acaba de
 * escribir la propia aplicación, dura treinta segundos y no identifica a nadie.
 */
import type { Cookies } from '@sveltejs/kit';

const NOMBRE = 'treno_aviso';

export type TipoAviso = 'ok' | 'aviso' | 'error';
export interface Aviso {
  texto: string;
  tipo: TipoAviso;
}

/**
 * Deja dicho lo que acaba de pasar.
 *
 * Se llama DENTRO de la acción, justo antes de devolver o de redirigir.
 *
 * El texto va en pasado y nombra la cosa concreta —«Cita propuesta a Nadia»,
 * no «Guardado»—: cuando se hacen tres cosas seguidas, un «Guardado» genérico
 * no dice cuál de las tres salió bien.
 */
export function avisar(cookies: Cookies, texto: string, tipo: TipoAviso = 'ok'): void {
  cookies.set(NOMBRE, JSON.stringify({ texto, tipo }), {
    path: '/',
    // Treinta segundos: lo que tarda la siguiente carga. Más tiempo solo sirve
    // para que reaparezca en una pestaña que abriste hace un rato.
    maxAge: 30,
    httpOnly: true,
    sameSite: 'lax'
  });
}

/**
 * Lo lee y lo borra. Solo lo llama el layout raíz.
 *
 * Devuelve `null` cuando no hay nada, que es el caso normal: la mayoría de las
 * cargas de página no vienen de una acción.
 */
export function tomarAviso(cookies: Cookies): Aviso | null {
  const crudo = cookies.get(NOMBRE);
  if (!crudo) return null;
  cookies.delete(NOMBRE, { path: '/' });
  try {
    const a = JSON.parse(crudo) as Aviso;
    // Validar aunque la escribamos nosotros: la cookie la manda el navegador y
    // puede llegar con cualquier cosa. Sin esto, `tipo` acabaría valiendo lo
    // que alguien escriba en su consola y la plantilla no pintaría ninguna rama.
    if (typeof a?.texto !== 'string') return null;
    return { texto: a.texto, tipo: ['ok', 'aviso', 'error'].includes(a.tipo) ? a.tipo : 'ok' };
  } catch {
    return null;
  }
}
