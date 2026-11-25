# Prueba · comprimir los vídeos antes de subirlos

Desde noviembre de 2026, los vídeos se comprimen **en el móvil** antes de subirse
(`src/lib/compresion-video.ts`, con la librería Mediabunny). Salen en MP4 H.264, con el
lado corto a 720 px y 2 Mbps. Se aplica en dos sitios:

- El vídeo de un ejercicio que sube el entrenador (`SelectorVideo.svelte`).
- El vídeo de técnica que manda el cliente (`workout/[id]`).

**Nunca impide subir.** Si el navegador no sabe comprimir, si algo falla o si el
resultado pesa casi lo mismo, se sube el original como antes. El tope de peso (100 MB
el entrenador, 50 MB el cliente) se mira **después** de comprimir.

## Dónde probar

**Ajustes → Vídeo → Probar la compresión** (`/ajustes/prueba-video`). No sube nada:
eliges un vídeo, lo comprimes con los ajustes que quieras y ves el original y el
comprimido lado a lado, con el peso y el tiempo.

> **En el móvil, solo funciona por HTTPS.** El navegador no deja comprimir en una página
> sin candado. Si abres `npm run dev` desde el móvil con la IP del ordenador
> (`http://192.168…`), te dirá «NO tiene WebCodecs» aunque el móvil sí sepa. Prueba
> en el móvil con la versión publicada en Vercel. En el ordenador, `localhost` sí vale.

## Qué probar

Con vídeos reales grabados con la cámara normal, sin editar:

| # | Vídeo | Móvil / navegador | Antes | Después | Tiempo | ¿Se ve bien? |
|---|---|---|---|---|---|---|
| 1 | 30 s horizontal | iPhone · Safari | | | | |
| 2 | 30 s vertical | iPhone · Safari | | | | |
| 3 | 1 min, 4K si lo graba | iPhone · Safari | | | | |
| 4 | 30 s vertical | Android · Chrome | | | | |
| 5 | Un vídeo de WhatsApp (ya comprimido) | cualquiera | | | | |

Y en cada uno, mirando el comprimido:

- **Colores.** Los iPhone graban en HDR por defecto. Si el resumen dice «original en
  HDR» y el comprimido se ve apagado o lavado, apúntalo: es lo más probable que falle.
- **Giro.** Que el vertical siga vertical.
- **Nitidez.** ¿Se distingue la técnica: rodillas, espalda, agarre? Prueba también
  1,5 y 1 Mbps: si se ve igual de bien, se baja el ajuste y se ahorra más.
- **Sonido**, si lo tenía.
- **Reproducirlo en otro móvil**: el comprimido de un iPhone, abrirlo en un Android.

Luego, el flujo de verdad: subir un vídeo a un ejercicio (como Aarón) y uno de
técnica (como cliente). Debajo del vídeo sale el resumen («85 MB → 12 MB…»).

## Si algo sale mal

El resumen dice por qué se subió el original («Este navegador no sabe…»,
«Falló la compresión: …»). Cópialo tal cual. En el ordenador, la consola del
navegador (F12) tiene el detalle.

## Los ajustes

Están arriba del todo en `compresion-video.ts` (`COMPRESION`): lado corto, bitrate de
imagen y de sonido. Se cambian ahí y vale para todo.
