/**
 * Deshacer paso a paso dentro de un formulario sin guardar.
 *
 * Lo piden las pantallas 9 y 15 del wireframe, y lo decidió Toni frente a la
 * alternativa barata de dejar solo «Cancelar». Vive aquí y no dentro de cada
 * pantalla porque son dos, y porque las dos reglas de abajo son fáciles de
 * olvidar en la segunda copia.
 *
 * REGLA 1 · UN PASO POR CAMBIO, NO POR PULSACIÓN
 *
 * Escribir «90» en un campo de descanso son dos pulsaciones y un solo cambio.
 * Guardando por pulsación, deshacer una vez quita el «0» y parece que el botón
 * está roto. Por eso la instantánea se toma al ENTRAR en un campo —`marcar()`
 * en el foco— y se descarta al salir si nada cambió —`olvidarSiIgual()`—.
 *
 * Para lo que no es escribir —añadir, quitar, reordenar— basta `marcar()`
 * antes de tocar nada: son cambios discretos y cada uno es un paso.
 *
 * REGLA 2 · SI NO HAY NADA QUE DESHACER, EL BOTÓN SE APAGA
 *
 * Un «Deshacer» siempre pulsable que a veces no hace nada es peor que no
 * tenerlo: enseña que la aplicación miente.
 *
 * POR QUÉ INSTANTÁNEAS Y NO UN REGISTRO DE OPERACIONES
 *
 * Un registro («se borró el ejercicio 3 en la posición 2») ocupa menos y
 * permite rehacer, pero obliga a escribir la operación inversa de CADA acción
 * y a mantenerlas al día cuando la pantalla cambie. Aquí los datos son una
 * lista de diez ejercicios: copiarla entera cuesta microsegundos y no se puede
 * escribir mal.
 */

/** Tope de pasos guardados. Cincuenta ediciones seguidas sin guardar no pasan. */
const TOPE = 50;

export class Historial<T> {
  #pasos = $state<string[]>([]);

  /** ¿Hay algo que deshacer? Para apagar el botón. */
  get puedeDeshacer(): boolean {
    return this.#pasos.length > 0;
  }

  /** Cuántos pasos caben hacia atrás. Útil para enseñarlo o para depurar. */
  get profundidad(): number {
    return this.#pasos.length;
  }

  /**
   * Guarda cómo estaba ANTES de un cambio. Se llama justo antes de tocar nada.
   *
   * Se serializa a texto: es la copia profunda más simple que hay, y de paso
   * corta cualquier referencia viva al estado reactivo, que si no se colaría
   * en la pila y se modificaría sola.
   */
  marcar(estado: T): void {
    this.#pasos.push(JSON.stringify(estado));
    if (this.#pasos.length > TOPE) this.#pasos.shift();
  }

  /**
   * Tira el último paso si el estado actual es idéntico.
   *
   * Es la mitad de la regla 1: entrar en un campo, no tocar nada y salir no
   * puede dejar un paso que al deshacerse no haga nada visible.
   */
  olvidarSiIgual(estado: T): void {
    const ultimo = this.#pasos[this.#pasos.length - 1];
    if (ultimo !== undefined && ultimo === JSON.stringify(estado)) this.#pasos.pop();
  }

  /** Devuelve el estado anterior, o null si no queda ninguno. */
  deshacer(): T | null {
    const paso = this.#pasos.pop();
    return paso === undefined ? null : (JSON.parse(paso) as T);
  }

  /** Vacía la pila. Se llama al guardar: lo guardado ya no se deshace aquí. */
  limpiar(): void {
    this.#pasos = [];
  }
}
