export const CONFIG = {
  palabrasPorPartida: 5, // palabras
  opcionesPorPalabra: 3, // opciones
  fallosMaximos: 3, // fallos
  puntosPorAcierto: 1, // puntos
  puntuacionMinima: 5, // puntos
  semillaPredeterminada: 1, // unidad de semilla
  multiplicadorGenerador: 48_271, // factor adimensional
  moduloGenerador: 2_147_483_647, // estados posibles
} as const

export type Definicion = {
  palabra: string
  verdadera: string
  falsas: readonly [string, string]
}

export type PreguntaActiva = {
  palabra: string
  opciones: readonly string[]
}

export type ResultadoPartida = 'jugando' | 'victoria' | 'derrota'

export type EstadoPartida = {
  semilla: number
  intento: number
  puntaje: number
  fallos: number
  opcionElegida: number | null
  pregunta: PreguntaActiva
  resultado: ResultadoPartida
}

export const BANCO_PALABRAS: readonly Definicion[] = [
  {
    palabra: 'albricias',
    verdadera: 'Expresión de alegría por una buena noticia.',
    falsas: ['Una herramienta para medir la lluvia.', 'Un tejido áspero hecho de lana.'],
  },
  {
    palabra: 'baladí',
    verdadera: 'De poca importancia o valor.',
    falsas: ['Que tiene un sabor especialmente dulce.', 'Dicho de un terreno: cubierto de nieve.'],
  },
  {
    palabra: 'gorigori',
    verdadera: 'Canto fúnebre de los entierros.',
    falsas: ['Baile popular de ritmo acelerado.', 'Vasija pequeña usada para guardar aceite.'],
  },
  {
    palabra: 'zahorí',
    verdadera: 'Persona a quien se atribuye descubrir lo oculto, como aguas subterráneas.',
    falsas: ['Ave marina de plumaje blanco.', 'Instrumento antiguo para afilar cuchillos.'],
  },
  {
    palabra: 'inefable',
    verdadera: 'Que no se puede explicar con palabras.',
    falsas: ['Que sucede cada dos años.', 'Que tiene muchas ventanas o aberturas.'],
  },
]

type PreguntaPreparada = {
  publica: PreguntaActiva
  indiceCorrecto: number
}

type DatosInternos = {
  preguntas: PreguntaPreparada[]
  posicionActual: number
}

const datosInternos = new WeakMap<EstadoPartida, DatosInternos>()

function normalizarSemilla(semilla: number): number {
  const moduloSemilla = CONFIG.moduloGenerador - 1
  const entera = Number.isFinite(semilla) ? Math.trunc(semilla) : CONFIG.semillaPredeterminada
  return ((entera % moduloSemilla) + moduloSemilla) % moduloSemilla + 1
}

export function crearGenerador(semilla: number): () => number {
  let estado = normalizarSemilla(semilla)

  return () => {
    estado = (estado * CONFIG.multiplicadorGenerador) % CONFIG.moduloGenerador
    return (estado - 1) / (CONFIG.moduloGenerador - 1)
  }
}

function prepararPreguntas(semilla: number): PreguntaPreparada[] {
  const aleatorio = crearGenerador(semilla)
  const preguntas = BANCO_PALABRAS.slice(0, CONFIG.palabrasPorPartida).map((definicion) => {
    const opciones = [
      { texto: definicion.verdadera, correcta: true },
      ...definicion.falsas.map((texto) => ({ texto, correcta: false })),
    ]
    const opcionesMezcladas: typeof opciones = []

    while (opciones.length > 0) {
      const indice = Math.floor(aleatorio() * opciones.length)
      opcionesMezcladas.push(...opciones.splice(indice, 1))
    }

    const indiceCorrecto = opcionesMezcladas.findIndex((opcion) => opcion.correcta)

    return {
      publica: {
        palabra: definicion.palabra,
        opciones: opcionesMezcladas.map((opcion) => opcion.texto),
      },
      indiceCorrecto,
    }
  })

  return preguntas
}

function cargarPregunta(estado: EstadoPartida, datos: DatosInternos): void {
  const preguntaPreparada = datos.preguntas[datos.posicionActual]

  if (preguntaPreparada === undefined) {
    throw new Error('No hay una pregunta preparada para el intento actual.')
  }

  estado.pregunta = preguntaPreparada.publica
}

export function crearPartida(semilla: number = CONFIG.semillaPredeterminada): EstadoPartida {
  const preguntas = prepararPreguntas(semilla)
  const estado: EstadoPartida = {
    semilla,
    intento: 1,
    puntaje: 0,
    fallos: 0,
    opcionElegida: null,
    pregunta: preguntas[0].publica,
    resultado: 'jugando',
  }

  datosInternos.set(estado, { preguntas, posicionActual: 0 })
  return estado
}

export function elegir(estado: EstadoPartida, indiceOpcion: number): boolean {
  const datos = datosInternos.get(estado)

  if (
    datos === undefined ||
    estado.resultado !== 'jugando' ||
    estado.opcionElegida !== null ||
    !Number.isInteger(indiceOpcion) ||
    indiceOpcion < 0 ||
    indiceOpcion >= estado.pregunta.opciones.length
  ) {
    return false
  }

  const preguntaPreparada = datos.preguntas[datos.posicionActual]

  if (preguntaPreparada === undefined) {
    return false
  }

  estado.opcionElegida = indiceOpcion

  if (indiceOpcion === preguntaPreparada.indiceCorrecto) {
    estado.puntaje += CONFIG.puntosPorAcierto
  } else {
    estado.fallos += 1
  }

  if (estado.fallos >= CONFIG.fallosMaximos) {
    estado.resultado = 'derrota'
  } else if (estado.intento >= CONFIG.palabrasPorPartida) {
    estado.resultado = estado.puntaje >= CONFIG.puntuacionMinima ? 'victoria' : 'derrota'
  }

  return true
}

export function siguiente(estado: EstadoPartida): boolean {
  const datos = datosInternos.get(estado)

  if (datos === undefined || estado.resultado !== 'jugando' || estado.opcionElegida === null) {
    return false
  }

  const siguientePosicion = datos.posicionActual + 1

  if (siguientePosicion >= datos.preguntas.length) {
    return false
  }

  datos.posicionActual = siguientePosicion
  estado.intento = siguientePosicion + 1
  estado.opcionElegida = null
  cargarPregunta(estado, datos)

  return true
}

export function reiniciar(estado: EstadoPartida, semilla = estado.semilla): boolean {
  const datos = datosInternos.get(estado)

  if (datos === undefined) {
    return false
  }

  const preguntas = prepararPreguntas(semilla)
  datos.preguntas = preguntas
  datos.posicionActual = 0
  estado.semilla = semilla
  estado.intento = 1
  estado.puntaje = 0
  estado.fallos = 0
  estado.opcionElegida = null
  estado.resultado = 'jugando'
  cargarPregunta(estado, datos)

  return true
}
