import { describe, expect, it } from 'vitest'
import {
  BANCO_PALABRAS,
  CONFIG,
  crearGenerador,
  crearPartida,
  elegir,
  reiniciar,
  siguiente,
} from './logica.ts'
import type { Definicion, EstadoPartida } from './logica.ts'

function obtenerDefinicion(estado: EstadoPartida): Definicion {
  const definicion = BANCO_PALABRAS.find(({ palabra }) => palabra === estado.pregunta.palabra)

  if (definicion === undefined) {
    throw new Error(`No se encontró la definición de ${estado.pregunta.palabra}.`)
  }

  return definicion
}

function obtenerIndiceCorrecto(estado: EstadoPartida): number {
  return estado.pregunta.opciones.indexOf(obtenerDefinicion(estado).verdadera)
}

function obtenerIndiceIncorrecto(estado: EstadoPartida): number {
  return estado.pregunta.opciones.findIndex(
    (opcion) => opcion !== obtenerDefinicion(estado).verdadera,
  )
}

describe('lógica de ¿Real o Inventado?', () => {
  it('crea una partida en el estado inicial esperado', () => {
    const estado = crearPartida()

    expect(estado).toMatchObject({
      semilla: CONFIG.semillaPredeterminada,
      intento: 1,
      puntaje: 0,
      fallos: 0,
      opcionElegida: null,
      resultado: 'jugando',
    })
    expect(estado.pregunta.palabra).toBeTruthy()
    expect(estado.pregunta.opciones).toHaveLength(CONFIG.opcionesPorPalabra)
    expect(estado.pregunta.opciones).toContain(obtenerDefinicion(estado).verdadera)
    expect(siguiente(estado)).toBe(false)
  })

  it('acepta una respuesta correcta una sola vez y suma el puntaje', () => {
    const estado = crearPartida()

    expect(elegir(estado, obtenerIndiceCorrecto(estado))).toBe(true)
    expect(estado.puntaje).toBe(CONFIG.puntosPorAcierto)
    expect(estado.fallos).toBe(0)
    expect(estado.opcionElegida).not.toBeNull()
    expect(elegir(estado, obtenerIndiceCorrecto(estado))).toBe(false)
  })

  it('registra una respuesta incorrecta como fallo sin sumar puntos', () => {
    const estado = crearPartida()

    expect(elegir(estado, obtenerIndiceIncorrecto(estado))).toBe(true)
    expect(estado.puntaje).toBe(0)
    expect(estado.fallos).toBe(1)
    expect(elegir(estado, -1)).toBe(false)
    expect(elegir(estado, CONFIG.opcionesPorPalabra)).toBe(false)
  })

  it('avanza a la siguiente palabra solo después de elegir una opción', () => {
    const estado = crearPartida()
    const palabraInicial = estado.pregunta.palabra

    expect(siguiente(estado)).toBe(false)
    expect(elegir(estado, obtenerIndiceCorrecto(estado))).toBe(true)
    expect(siguiente(estado)).toBe(true)
    expect(estado.intento).toBe(2)
    expect(estado.pregunta.palabra).not.toBe(palabraInicial)
    expect(estado.opcionElegida).toBeNull()
    expect(siguiente(estado)).toBe(false)
  })

  it('termina en derrota al alcanzar el límite de fallos', () => {
    const estado = crearPartida()

    for (let fallo = 1; fallo <= CONFIG.fallosMaximos; fallo += 1) {
      expect(elegir(estado, obtenerIndiceIncorrecto(estado))).toBe(true)
      expect(estado.fallos).toBe(fallo)

      if (fallo < CONFIG.fallosMaximos) {
        expect(siguiente(estado)).toBe(true)
      }
    }

    expect(estado.resultado).toBe('derrota')
    expect(elegir(estado, obtenerIndiceCorrecto(estado))).toBe(false)
    expect(siguiente(estado)).toBe(false)
  })

  it('reinicia la partida y devuelve false para un estado ajeno', () => {
    const estado = crearPartida(23)

    expect(elegir(estado, obtenerIndiceIncorrecto(estado))).toBe(true)
    expect(reiniciar(estado)).toBe(true)
    expect(estado).toMatchObject({
      semilla: 23,
      intento: 1,
      puntaje: 0,
      fallos: 0,
      opcionElegida: null,
      resultado: 'jugando',
    })
    expect(estado.pregunta).toEqual(crearPartida(23).pregunta)
    expect(reiniciar({ ...estado })).toBe(false)
  })

  it('produce la misma secuencia pseudoaleatoria para una misma semilla', () => {
    const generadorA = crearGenerador(42)
    const generadorB = crearGenerador(42)
    const secuenciaA = Array.from({ length: 8 }, () => generadorA())
    const secuenciaB = Array.from({ length: 8 }, () => generadorB())

    expect(secuenciaA).toEqual(secuenciaB)
    expect(crearPartida(42).pregunta).toEqual(crearPartida(42).pregunta)
  })
})
