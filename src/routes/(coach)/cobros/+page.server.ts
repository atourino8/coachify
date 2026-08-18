// La pantalla se llamaba Cobros y ahora se llama Pagos, que es como la nombran
// el wireframe y los entrenadores cuando hablan.
//
// Esta ruta se queda como redirección permanente porque una URL que ha estado
// publicada no se retira: puede estar guardada en un marcador, en el historial
// del navegador o pegada en una conversación. Tres líneas evitan un 404 a
// alguien que no ha hecho nada mal.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  redirect(308, '/pagos');
};
