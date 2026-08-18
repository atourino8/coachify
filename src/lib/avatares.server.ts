/**
 * Firmar fotos de perfil, en lote.
 *
 * El cubo `avatars` es privado, así que una ruta no se puede pintar: hay que
 * cambiarla por una URL firmada. Y la rejilla de clientes pinta sesenta a la
 * vez, así que se firman todas de una llamada. Firmar de una en una es el
 * mismo N+1 de siempre pero contra el almacenamiento, que además está más
 * lejos que la base.
 */

const CUBO = 'avatars';

/** Una hora. Lo que dura una sesión mirando la aplicación, de sobra. */
const VIGENCIA = 3600;

type SupabaseServer = App.Locals['supabase'];

/**
 * Devuelve ruta → URL firmada. Las rutas nulas se descartan antes de pedir
 * nada, que es el caso normal mientras casi nadie tenga foto.
 *
 * Falla a vacío: sin foto se pinta la inicial, que es exactamente lo que ya
 * pasa cuando no hay ninguna. Una lista de clientes no debe caerse porque el
 * almacenamiento tenga un mal día.
 */
export async function urlsDeAvatar(
  supabase: SupabaseServer,
  rutas: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const limpias = [...new Set(rutas.filter((r): r is string => !!r))];
  if (limpias.length === 0) return urls;

  const { data, error } = await supabase.storage.from(CUBO).createSignedUrls(limpias, VIGENCIA);
  if (error) return urls;

  for (const f of data ?? []) {
    if (f.path && f.signedUrl) urls.set(f.path, f.signedUrl);
  }
  return urls;
}

/** Lo mismo para una sola. Envuelve a la anterior para no tener dos caminos. */
export async function urlDeAvatar(
  supabase: SupabaseServer,
  ruta: string | null | undefined
): Promise<string | null> {
  if (!ruta) return null;
  return (await urlsDeAvatar(supabase, [ruta])).get(ruta) ?? null;
}

// =============================================================================
// Guardar y quitar
// =============================================================================

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const TOPE = 5 * 1024 * 1024;

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

/**
 * Sube la foto de `profileId` y deja la ruta apuntada en su perfil.
 *
 * Quien llama decide si tiene derecho a hacerlo: aquí no se comprueba nada de
 * permisos a propósito, porque hay dos caminos legítimos (el dueño y su
 * entrenador) y las dos comprobaciones ya viven en la RLS del cubo y en la de
 * profiles. Duplicarlas en JavaScript sería una tercera versión de la regla
 * que puede desincronizarse con las otras dos.
 */
export async function guardarAvatar(
  supabase: SupabaseServer,
  profileId: string,
  archivo: File | null,
  rutaAnterior: string | null
): Promise<{ ruta: string } | { error: string }> {
  if (!archivo || archivo.size === 0) return { error: 'No has elegido ninguna foto.' };
  if (!TIPOS.includes(archivo.type)) return { error: 'La foto tiene que ser JPG, PNG o WEBP.' };
  if (archivo.size > TOPE) return { error: 'La foto no puede pasar de 5 MB.' };

  const ruta = `${profileId}/avatar.${EXTENSION[archivo.type]}`;

  const { error: errSubida } = await supabase.storage
    .from(CUBO)
    .upload(ruta, archivo, { upsert: true, contentType: archivo.type });
  if (errSubida) return { error: errSubida.message };

  // Si antes tenía otra extensión, el fichero viejo se queda huérfano en el
  // cubo: `upsert` sobrescribe el MISMO nombre, y avatar.png y avatar.jpg no
  // lo son. Se borra aquí y no en una limpieza periódica porque el momento en
  // que se sabe cuál sobra es exactamente este.
  if (rutaAnterior && rutaAnterior !== ruta) {
    await supabase.storage.from(CUBO).remove([rutaAnterior]);
  }

  const { error: errPerfil } = await supabase
    .from('profiles')
    .update({ avatar_path: ruta } as never)
    .eq('id', profileId);
  if (errPerfil) return { error: errPerfil.message };

  return { ruta };
}

/** Quita la foto: primero del perfil y luego del cubo. */
export async function quitarAvatar(
  supabase: SupabaseServer,
  profileId: string,
  ruta: string | null
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_path: null } as never)
    .eq('id', profileId);
  if (error) return { error: error.message };

  // El orden importa: si se borrara el fichero primero y fallara el perfil,
  // quedaría una ruta apuntando a nada y la foto saldría rota en vez de salir
  // la inicial. Al revés, lo peor que queda es un fichero de sobra.
  if (ruta) await supabase.storage.from(CUBO).remove([ruta]);
  return {};
}
