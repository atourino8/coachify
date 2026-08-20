/**
 * Comparar texto como lo compara una persona.
 *
 * POR QUÉ EXISTE
 *
 * Esto estaba escrito tres veces, letra por letra: en la lista de clientes, en
 * la de entrenamientos y en el modal de añadir ejercicios. Nadie lo había roto
 * todavía, pero la cuarta copia iba a ser la de la biblioteca de ejercicios y
 * ahí es donde estas cosas empiezan a divergir: alguien arregla la ñ en un
 * sitio y en los otros tres sigue mal.
 *
 * QUÉ HACE Y POR QUÉ ASÍ
 *
 * Pasa a minúsculas y quita las tildes. Buscar «press frances» tiene que
 * encontrar «Press Francés»: quien escribe deprisa en el gimnasio no pone
 * tildes, y castigarle por eso convierte el buscador en un adivina la
 * ortografía.
 *
 * `normalize('NFD')` separa la letra de su tilde —«é» pasa a ser «e» más una
 * marca suelta— y el reemplazo se lleva las marcas.
 *
 * LA Ñ TAMBIÉN SE PIERDE, Y ES A SABIENDAS
 *
 * La virgulilla de la ñ está en ese mismo rango, así que «Muñoz» se compara
 * como «munoz». Para el idioma la ñ es otra letra, no una n adornada, y esto
 * la trata como si lo fuera.
 *
 * Se deja así porque lo que se está haciendo no es ordenar un diccionario,
 * es buscar en una lista de sesenta nombres: que quien escribe «munoz» a toda
 * prisa encuentre a Muñoz vale más que evitar que «pena» encuentre a «Peña»,
 * que además salta a la vista en cuanto lo ves en la lista. Si algún día hay
 * que distinguirlas, se saca el ̃ del rango y ya.
 */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * ¿Está `aguja` dentro de `pajar`, comparando como compara una persona?
 *
 * El caso de la aguja vacía devuelve `true` a propósito: un buscador en blanco
 * no filtra nada. Ponerlo aquí evita el `q === '' || ...` repetido en cada
 * pantalla, que es justo donde se cuela el fallo de dejar la lista vacía
 * mientras no has escrito nada.
 */
export function contiene(pajar: string, aguja: string): boolean {
  const q = normalizar(aguja.trim());
  return q === '' || normalizar(pajar).includes(q);
}
