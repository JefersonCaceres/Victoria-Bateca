# Galaxia para Victoria: traspaso a Angular

Regalo web para Victoria (novia de Jefferson). Ella lo abre el **17 de octubre de 2026** desde un **iPhone 16**, pero debe funcionar en cualquier celular y en escritorio.

El archivo `galaxia.html` (en la raíz del proyecto, solo como referencia) es el **prototipo aprobado y la fuente de verdad**: animaciones, tiempos, colores, textos y shaders ya están ajustados. La tarea es portarlo a Angular **sin cambiar cómo se ve ni cómo se siente**. Ante cualquier duda, copiar el comportamiento exacto del prototipo.

## Stack y restricciones

- Angular (versión que trae el proyecto), componentes standalone y signals. Sin router y sin SSR.
- **three@0.128.0** fijado (`@types/three@0.128.0`). No actualizar: las versiones nuevas cambian el manejo de color (`outputEncoding`, `sRGBEncoding`) y la intensidad de las luces, y el resultado se vería distinto.
- Fuentes de Google Fonts: Great Vibes, Dancing Script 700 y Cormorant Garamond (normal 500 e itálica 400 y 500). Ponerlas en `index.html` con el mismo link del prototipo.
- Imágenes en `public/`: `nebula.jpg` (fondo de la nebulosa, en el prototipo va en base64 dentro de `NEBULA_SRC`) y `victoria.jpg` (foto de ella). Referenciarlas con rutas relativas, sin `/` al inicio, para que funcionen con el `base-href` de GitHub Pages.
- En `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="robots" content="noindex">`, título "Para ti" y favicon 💌.

## Flujo de la experiencia

1. **Carta:** sobre blanco con sello de lacre y corazón, el nombre "Victoria" arriba y el texto "Toca la carta para abrirla". Al tocarla: el sello se rompe, la solapa se abre en 3D, la carta sube con brillo y un destello blanco llena la pantalla.
2. **Nombre en estrellas 3D:** unas 3.200 partículas (Three.js `Points` con shader propio) regadas en profundidad vuelan de izquierda a derecha hasta formar "Victoria" en Dancing Script 700. Tienen brillo mientras vuelan, destello al llegar y un giro suave del conjunto. Después explotan hacia la cámara.
3. **Cinco paradas:** salto a la velocidad de la luz (estrellas 2D estiradas, FOV que se abre, destello al llegar). En cada parada hay una escena 3D, y el título, la fecha y la frase aparecen escalonados:
   1. Nacimiento: una nube de polvo se ordena en galaxia espiral.
   2. Gravedad: una luz rosada y una azul se atraen, con estelas y polvo cayendo en espiral.
   3. Primera estrella: las luces se fusionan, destello, nace una estrella con halo y una onda de chispas.
   4. Órbita: dos estrellas en órbita con estelas y un hilo de luz que aparece entre ellas.
   5. Hogar: planeta tipo Tierra (textura procedural, nubes, atmósfera), dos soles al fondo y una luz cálida que se enciende en el lado de noche.
4. **Galaxia final:** la cámara se aleja y revela una galaxia grande. Las cinco paradas quedan sobre uno de sus brazos (función `armPos`), marcadas como estrellas brillantes.
5. **Foto y final:** un anillo de estrellas 2D rodea la foto, que queda en el centro de la galaxia. Luego aparece el texto final, con el contador de días, y un botón "Volver a ver".

## Datos (pasar a `src/app/data/story.data.ts`)

Todo lo personal va en un solo archivo de configuración, igual que el objeto `CONFIG` del prototipo:

- `nombre`: 'Victoria' (también acepta `?n=` en la URL)
- `segundosPorFrase`: 6.5
- `inicio`: '2026-07-13'. El contador es `floor((hoy - inicio) / 1 día)`, y el 13 de julio cuenta como día 0. El 17 de octubre debe mostrar **96**. Se calcula en el cliente, así que sube solo cada día.
- `historia`: las cinco entradas `{ titulo, fecha, texto }`. Copiarlas literal del prototipo.
- Textos del final: "No te puedo regalar una galaxia," / "pero sí crear una para ti." / "Te amo, Victoria ❤️" / "{n} días desde que nació nuestra galaxia".
- `foto`: 'victoria.jpg'. En la versión final, quitar el selector de archivo del prototipo ("Toca para probar con su foto") y mostrar la foto real.

## Estructura sugerida

```
src/app/
  data/story.data.ts            textos, fechas, tiempos
  services/scene.service.ts     estado de la secuencia (signal) y run() con los tiempos del prototipo
  services/tween.service.ts     tween(), sleep(), easings (o utilidades puras)
  components/envelope/          carta (HTML + CSS puro)
  components/sky-canvas/        canvas 2D: nebulosa, estrellas de fondo con warp, anillo de la foto
  components/space-3d/          canvas WebGL: nombre 3D, cinco escenas, galaxia final, cámara y vuelos
  components/story-overlay/     título, fecha y frase
  components/finale/            foto, textos finales, contador, botón para volver a ver
  three/                        noise.ts, textures.ts, glow-points.ts, scenes/*.ts (una por escena)
```

Un único `requestAnimationFrame` debe mover ambos canvas (2D y WebGL) en el mismo orden que la función `frame()` del prototipo. Correrlo fuera de la zona de Angular (`NgZone.runOutsideAngular`) para no disparar detección de cambios en cada frame.

## Detalles que no se pueden perder

- Alto con `100dvh` y safe areas con `env(safe-area-inset-*)`. La `devicePixelRatio` se limita a 2.
- `camera.setViewOffset(W, H, 0, H * .1, W, H)`: el centro visual queda al 40 % del alto, para dejar espacio al texto abajo. Respetarlo en el resize.
- Las texturas de los planetas y la galaxia se generan mientras se muestra la carta (en el `setTimeout` de `init3D`), para que no se trabe la animación.
- Respetar `prefers-reduced-motion`, igual que el prototipo.
- Si WebGL no está disponible, usar el respaldo 2D del prototipo (`formName` y `scatter`).
- Shaders, colores, tamaños y tiempos: copiarlos tal cual.

## Despliegue

```bash
ng deploy --base-href=/<nombre-del-repo>/
```

Después, en GitHub: Settings → Pages → rama `gh-pages`. Probar el link final en un iPhone antes del 17 de octubre.

## Orden de trabajo

1. Copiar `nebula.jpg` y la foto a `public/`. Configurar fuentes y meta tags.
2. Crear `story.data.ts` y las utilidades (tween, easings, noise).
3. Carta, primero sola, comparándola con el prototipo.
4. Canvas 2D: nebulosa, estrellas y warp.
5. Space-3d: motor, nombre 3D y vuelos de cámara.
6. Las cinco escenas, una por una.
7. Galaxia final, foto, final y contador.
8. Build, deploy y prueba en celular.
