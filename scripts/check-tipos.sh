#!/bin/bash
# Type-check real desde el contenedor.
#
# POR QUÉ HACE FALTA ESTE APAÑO
# `npm run check` no arranca aquí: svelte.config.js carga el adaptador y
# vitePreprocess, y los dos tiran de rollup, cuyo binario nativo de Linux no
# está en un node_modules instalado en Windows. `svelte-kit sync` tampoco, por
# lo mismo, así que hay que generar a mano lo que él generaría.
#
# Y no vale con copiar el fuente al proxy: `sync` lo TRANSFORMA para conservar
# el tipo INFERIDO de lo que devuelve `load`. Si se deja la anotación
# `: PageServerLoad`, el tipo se ensancha al genérico y todo `data` pasa a ser
# `any`, que fue lo que hizo que este guion pasara de 18 errores a 86.
set -e
RAIZ=/sessions/adoring-kind-cannon/mnt/Coachify
T=/tmp/chk
rm -rf $T/src && cp -r $RAIZ/src $T/src
cd $T

python3 - <<'PY'
import pathlib, re

tipos = pathlib.Path('.svelte-kit/types/src/routes')
rutas = pathlib.Path('src/routes')
NOMBRES = ('+page.server.ts', '+layout.server.ts', '+page.ts', '+layout.ts')
ENDPOINTS = ('+server.ts',)
CARGAS = 'PageServerLoad|LayoutServerLoad|PageLoad|LayoutLoad'

def transformar(src: str) -> str:
    """Lo mismo que hace `svelte-kit sync` con un fichero de servidor."""
    # export const load: X = async ({...}) =>
    #   → export const load = async ({...}: Parameters<X>[0]) =>
    src = re.sub(
        rf'export const load: ({CARGAS}) = async \(([^)]*)\) =>',
        lambda m: f'export const load = async ({m.group(2)}: Parameters<{m.group(1)}>[0]) =>',
        src
    )
    # Cada acción recibe RequestEvent en vez de heredar el tipo del objeto.
    src = re.sub(
        r'^(  \w+): async \(([^)]*)\) =>',
        lambda m: f"{m.group(1)}: async ({m.group(2)}: import('./$types').RequestEvent) =>",
        src, flags=re.M
    )
    # export const actions: Actions = {  → sin anotación, y el tipo se
    # comprueba al final para no perder la inferencia de cada acción.
    if 'export const actions: Actions = {' in src:
        src = src.replace('export const actions: Actions = {', 'export const actions = {')
        src = src.rstrip() + '\n;null as any as Actions;'
    return '// @ts-nocheck\n' + src

# Los endpoints (+server.ts) no llevan proxy, pero SÍ necesitan su $types: sin
# él, `import type { RequestHandler } from './$types'` no resuelve y todos sus
# parámetros pasan a `any` implícito. Se descubrió moviendo /cobros a /pagos:
# el guion daba siete errores que no eran del código, sino suyos.
for fuente in rutas.rglob('*'):
    if fuente.name not in ENDPOINTS:
        continue
    destino = tipos / fuente.relative_to(rutas).parent
    destino.mkdir(parents=True, exist_ok=True)
    ruta_id = '/' + '/'.join(fuente.relative_to(rutas).parent.parts)
    (destino / '$types.d.ts').write_text(f'''import type * as Kit from '@sveltejs/kit';

type RouteParams = {{}};
type RouteId = '{ruta_id}';

export type RequestHandler = Kit.RequestHandler<RouteParams, RouteId>;
export type RequestEvent = Kit.RequestEvent<RouteParams, RouteId>;
''', encoding='utf8')

for fuente in rutas.rglob('*'):
    if fuente.name not in NOMBRES:
        continue
    rel = fuente.relative_to(rutas)
    destino = tipos / rel.parent
    destino.mkdir(parents=True, exist_ok=True)
    (destino / ('proxy' + fuente.name)).write_text(
        transformar(fuente.read_text(encoding='utf8')), encoding='utf8'
    )

    tipos_d = destino / '$types.d.ts'
    if tipos_d.exists():
        continue
    # Ruta nueva: se clona el $types.d.ts de una hermana a la MISMA
    # profundidad, porque dentro hay imports relativos ('../../$types.js').
    profundidad = len(rel.parent.parts)
    plantilla = next(
        (p for p in tipos.rglob('$types.d.ts')
         if len(p.parent.relative_to(tipos).parts) == profundidad
         and (p.parent / 'proxy+page.server.ts').exists()),
        None
    )
    if not plantilla:
        print('  (sin plantilla para', rel.parent, ')')
        continue
    texto = plantilla.read_text(encoding='utf8')
    texto = re.sub(r"type RouteId = '[^']*'", f"type RouteId = '/{'/'.join(rel.parent.parts)}'", texto)
    tipos_d.write_text(texto, encoding='utf8')
    print('  tipos sintetizados para /' + '/'.join(rel.parent.parts))
PY

timeout 420 node node_modules/svelte-check/bin/svelte-check --output human --threshold error 2>&1 | tail -"${1:-30}"
