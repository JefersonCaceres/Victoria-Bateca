/* =========================================================
   CONFIGURACIÓN: aquí se cambia todo lo personal
   ========================================================= */
export interface StoryItem {
  titulo: string;
  fecha: string;
  texto: string;
}

const params = new URLSearchParams(location.search);

/** ['victoria.jpg', 'victoria-2.jpg', …, 'victoria-N.jpg'] */
function fotosNumeradas(base: string, cantidad: number) {
  return Array.from({ length: cantidad }, (_, i) => i === 0 ? `${base}.jpg` : `${base}-${i + 1}.jpg`);
}

export const STORY = {
  nombre: params.get('n') || 'Victoria',
  historia: [
    { titulo: '✨ El nacimiento de una galaxia', fecha: '13 de julio',
      texto: 'Dos caminos se cruzaron, y del polvo de estrellas empezó a nacer una galaxia que ninguno sabía que estaba buscando.' },
    { titulo: '🌙 La fuerza de gravedad', fecha: 'Los días siguientes',
      texto: 'Conversación a conversación, la gravedad nos fue acercando, hasta que estar lejos dejó de sentirse igual.' },
    { titulo: '⭐ Nuestra primera estrella', fecha: '22 de julio',
      texto: 'Entre ramen y miradas se encendió nuestra primera estrella, y supimos que juntos había mucho por explorar.' },
    { titulo: '💫 Dos estrellas, una órbita', fecha: '17 de agosto',
      texto: 'Te pedí que fueras mi novia, y desde ese día giramos juntos: ya no coincido contigo por casualidad, te elijo cada día.' },
    { titulo: '🪐 Nuestro hogar', fecha: '15 de septiembre',
      texto: 'Nuestras órbitas se unieron bajo el mismo techo, y en este pequeño planeta empezamos a construir nuestro universo.' }
  ] as StoryItem[],
  segundosPorFrase: 6.5,
  inicio: '2026-07-13',   // día en que nació la galaxia (para el contador)
  // fotos en public/: victoria.jpg, victoria-2.jpg, victoria-3.jpg… hasta victoria-N.jpg (N = cantidad)
  // si agregas más, solo cambia el número; las que no existan se saltan
  fotos: fotosNumeradas('victoria', 14),
  segundosPorFoto: 5,
  // canción en public/; empieza al tocar la carta, entra suave y se repite
  musica: {
    archivo: 'musica.mp3',
    volumen: .2,        // de 0 a 1, como se percibe al oído
    desdeSegundo: 0,     // para saltar la intro de la canción
    segundosFadeIn: 4
  },
  final: {
    l1: 'No te puedo regalar una galaxia,',
    l2: 'pero sí crear una para ti.',
    teAmo: (nombre: string) => `Te amo, ${nombre} ❤️`,
    dias: (n: number) => `${n} ${n === 1 ? 'día' : 'días'} desde que nació nuestra galaxia`
  }
};

/** Días completos desde `inicio` (el mismo día cuenta como 0), por fecha del calendario local. */
export function diasDesde(inicio: string, hoy = new Date()): number {
  const [y, m, d] = inicio.split('-').map(Number);
  const dias = (Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - Date.UTC(y, m - 1, d)) / 86400000;
  return Math.max(0, Math.floor(dias));
}
