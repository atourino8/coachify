// Pantalla que ve el cliente cuando su entrenador ha pausado el acceso.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { acceso, nombreCoach } = await parent();

  // Si su acceso está abierto no tiene nada que hacer aquí. Importa sobre todo
  // el momento en que paga: el entrenador actualiza la fecha y el cliente, que
  // se quedó en esta pantalla, vuelve solo a su entreno al recargar en vez de
  // quedarse mirando un mensaje que ya no es verdad.
  if (!acceso.pausado) redirect(303, '/today');

  return { nombreCoach };
};
