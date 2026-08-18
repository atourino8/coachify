// Ajustes del entrenador.
//
// Nace de un agujero concreto: el nombre solo se escribía en el asistente de
// alta y después NO había forma de cambiarlo. Eso pasó de molesto a problema
// cuando la cabecera del cliente empezó a enseñar el nombre de su entrenador:
// una errata al registrarse la ven todos sus clientes, todos los días.
//
// Ahora es además donde se configura su vocabulario de etiquetas.

import { fail, redirect } from '@sveltejs/kit';
import { aIdentificador, identificadorValido, type ClaseEtiqueta } from '$lib/tags';
import { guardarAvatar, quitarAvatar, urlDeAvatar } from '$lib/avatares.server';
import type { PageServerLoad, Actions } from './$types';

const CLASES: ClaseEtiqueta[] = ['muscle', 'equipment', 'client'];

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const [{ data: profile }, { data: propias }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, brand_accent, default_location, avatar_path')
      .eq('id', user.id)
      .single(),
    supabase
      .from('coach_tags')
      .select('id, kind, slug, label')
      .eq('coach_id', user.id)
      .order('label')
  ]);

  return {
    nombre: profile?.full_name ?? '',
    avatar: await urlDeAvatar(supabase, profile?.avatar_path ?? null),
    tieneFoto: Boolean(profile?.avatar_path),
    sitio: profile?.default_location ?? '',
    email: user.email ?? '',
    tieneMarca: Boolean(profile?.brand_accent),
    propias: (propias ?? []) as { id: string; kind: ClaseEtiqueta; slug: string; label: string }[]
  };
};

export const actions: Actions = {
  // La foto va en su propio formulario y no junto al nombre: son dos envíos
  // distintos —uno multipart y otro no— y juntarlos obligaría a subir la foto
  // otra vez cada vez que corriges una letra del nombre.
  foto: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();

    const { data: actual } = await supabase
      .from('profiles')
      .select('avatar_path')
      .eq('id', user.id)
      .single();
    const anterior = (actual as { avatar_path: string | null } | null)?.avatar_path ?? null;

    if (fd.get('quitar')) {
      const { error } = await quitarAvatar(supabase, user.id, anterior);
      if (error) return fail(500, { error });
      return { success: true, fotoQuitada: true };
    }

    const res = await guardarAvatar(supabase, user.id, fd.get('foto') as File | null, anterior);
    if ('error' in res) return fail(400, { error: res.error });
    return { success: true, fotoGuardada: true };
  },

  nombre: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const nombre = (fd.get('full_name') as string)?.trim() ?? '';
    const sitio = ((fd.get('default_location') as string) ?? '').trim();

    // Se exige nombre: si se permitiera vacío, sus clientes verían "Treno" en
    // la cabecera en vez de a su entrenador, que es lo contrario de lo que
    // buscamos.
    if (nombre.length < 2) {
      return fail(400, { error: 'Escribe tu nombre: es lo que ven tus clientes.' });
    }
    if (nombre.length > 80) return fail(400, { error: 'El nombre es demasiado largo.' });
    if (sitio.length > 60) return fail(400, { error: 'El sitio es demasiado largo.' });

    const { error } = await supabase
      .from('profiles')
      // Vacío se guarda como null y no como cadena vacía: así "no lo he
      // puesto" y "lo he borrado" son el mismo estado, y la cabecera no tiene
      // que distinguir entre dos formas de nada.
      .update({ full_name: nombre, default_location: sitio || null } as never)
      .eq('id', user.id);

    if (error) return fail(500, { error: error.message });
    return { success: true, guardado: 'nombre' };
  },

  // ---- Vocabulario propio ---------------------------------------------------

  crearEtiqueta: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const kind = String(fd.get('kind') ?? '') as ClaseEtiqueta;
    const label = String(fd.get('label') ?? '').trim();

    if (!CLASES.includes(kind)) return fail(400, { error: 'Clase de etiqueta no válida.' });
    if (label.length < 2) return fail(400, { error: 'La etiqueta necesita al menos dos letras.' });
    if (label.length > 40) return fail(400, { error: 'La etiqueta es demasiado larga.' });

    // El identificador se deriva del texto, no se le pide. Nadie debería tener
    // que entender qué es un "slug" para añadir "Suelo pélvico".
    const slug = aIdentificador(label);
    if (!identificadorValido(slug)) {
      return fail(400, { error: 'Ese nombre no vale: usa al menos dos letras o números.' });
    }

    const { error } = await supabase
      .from('coach_tags')
      .insert({ coach_id: user.id, kind, slug, label } as never);

    // 23505 = clave duplicada. Pasa al añadir algo que ya existe, y decir
    // "ya la tienes" es mucho más útil que el mensaje de Postgres.
    if (error?.code === '23505') return fail(400, { error: `Ya tienes una etiqueta "${label}".` });
    if (error) return fail(500, { error: error.message });
    return { success: true, creada: label };
  },

  renombrarEtiqueta: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const kind = String(fd.get('kind') ?? '') as ClaseEtiqueta;
    const slug = String(fd.get('slug') ?? '');
    const label = String(fd.get('label') ?? '').trim();

    if (!CLASES.includes(kind)) return fail(400, { error: 'Clase de etiqueta no válida.' });
    if (!identificadorValido(slug)) return fail(400, { error: 'Etiqueta no válida.' });
    if (label.length < 2 || label.length > 40) {
      return fail(400, { error: 'El nombre nuevo tiene que tener entre 2 y 40 caracteres.' });
    }

    // upsert y no update: renombrar una etiqueta DEL BASE crea la fila que la
    // pisa, y renombrar una propia actualiza la que ya hay. Son la misma
    // intención del entrenador, así que son la misma operación.
    //
    // Ojo: el identificador NO cambia. Cambiarlo obligaría a reescribir todos
    // los ejercicios que lo usan, y con un fallo a medias quedarían apuntando
    // a una etiqueta que ya no existe. Se renombra lo que se ve, no la clave.
    const { error } = await supabase
      .from('coach_tags')
      .upsert({ coach_id: user.id, kind, slug, label } as never, {
        onConflict: 'coach_id,kind,slug'
      });

    if (error) return fail(500, { error: error.message });
    return { success: true, renombrada: label };
  },

  borrarEtiqueta: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const kind = String(fd.get('kind') ?? '') as ClaseEtiqueta;
    const slug = String(fd.get('slug') ?? '');

    if (!CLASES.includes(kind)) return fail(400, { error: 'Clase de etiqueta no válida.' });
    if (!identificadorValido(slug)) return fail(400, { error: 'Etiqueta no válida.' });

    // Borrar la etiqueta sin más dejaría el identificador dentro de las filas
    // que la usaban, y ahí se vería el identificador crudo ("suelo_pelvico")
    // en vez de un nombre. Así que primero se quita de donde esté y luego se
    // borra la fila del vocabulario.
    //
    // Las tres clases se comportan igual; lo único que cambia es de qué tabla
    // y de qué columna hay que quitarla.
    const donde =
      kind === 'muscle'
        ? { tabla: 'exercises', columna: 'muscle_groups', clave: 'id' }
        : kind === 'equipment'
          ? { tabla: 'exercises', columna: 'equipment_types', clave: 'id' }
          : { tabla: 'client_info', columna: 'tags', clave: 'client_id' };
    const { tabla, columna, clave } = donde;

    const { data: afectadosRaw } = await supabase
      .from(tabla)
      .select(`${clave}, ${columna}`)
      .eq('coach_id', user.id)
      .contains(columna, [slug]);

    const afectados = (afectadosRaw ?? []) as unknown as Record<string, unknown>[];

    // Se agrupan los que acaban con el MISMO array y se manda una consulta por
    // grupo, no una por ejercicio. Con la etiqueta puesta en cuarenta
    // ejercicios eso es la diferencia entre dos consultas y cuarenta, y es el
    // mismo patrón que usa la reclasificación en lote de la biblioteca.
    const porResultado = new Map<string, string[]>();
    for (const ex of afectados) {
      const restante = ((ex[columna] as string[]) ?? []).filter((v) => v !== slug);
      const resultado = JSON.stringify(restante);
      porResultado.set(resultado, [...(porResultado.get(resultado) ?? []), ex[clave] as string]);
    }

    for (const [resultado, ids] of porResultado) {
      const { error: errQuitar } = await supabase
        .from(tabla)
        .update({ [columna]: JSON.parse(resultado) } as never)
        .in(clave, ids)
        .eq('coach_id', user.id);
      if (errQuitar) return fail(500, { error: errQuitar.message });
    }

    const { error } = await supabase
      .from('coach_tags')
      .delete()
      .eq('coach_id', user.id)
      .eq('kind', kind)
      .eq('slug', slug);

    if (error) return fail(500, { error: error.message });
    return { success: true, borrada: true, quitadaDe: afectados.length };
  }
};
