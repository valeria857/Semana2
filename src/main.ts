import './style.css'
import { BANCO_PALABRAS, CONFIG, crearPartida, elegir, reiniciar, siguiente } from './logica.ts'

const contenedorEncontrado = document.querySelector<HTMLDivElement>('#app')

if (contenedorEncontrado === null) {
  throw new Error('No se encontró el contenedor principal de la aplicación.')
}

const aplicacion = contenedorEncontrado
let estado = crearPartida()
let mensajeRespuesta = ''
let respuestaCorrecta: boolean | null = null

function mostrarPartida(selectorEnfocable?: string): void {
  const definicion = BANCO_PALABRAS.find(({ palabra }) => palabra === estado.pregunta.palabra)

  if (definicion === undefined) {
    throw new Error(`No se encontró la definición de ${estado.pregunta.palabra}.`)
  }

  const partidaTerminada = estado.resultado !== 'jugando'
  const opciones = estado.pregunta.opciones
    .map((opcion, indice) => {
      const elegida = estado.opcionElegida === indice
      const claseResultado = elegida && respuestaCorrecta !== null
        ? respuestaCorrecta
          ? ' opcion-correcta'
          : ' opcion-incorrecta'
        : ''
      const estadoBoton = estado.opcionElegida !== null || partidaTerminada ? ' disabled' : ''

      return `
        <button class="opcion${claseResultado}" type="button" data-opcion="${indice}"${estadoBoton}>
          <span class="numero-opcion" aria-hidden="true">${indice + 1}</span>
          <span>${opcion}</span>
          <span class="marca-opcion" aria-hidden="true">${elegida && respuestaCorrecta !== null ? (respuestaCorrecta ? '✓' : '×') : ''}</span>
        </button>
      `
    })
    .join('')

  const contenidoFinal = partidaTerminada
    ? `
      <section class="resultado-final ${estado.resultado}" role="status" aria-live="polite">
        <span class="etiqueta-resultado">${estado.resultado === 'victoria' ? 'Partida completada' : 'Partida terminada'}</span>
        <h2>${estado.resultado === 'victoria' ? '¡Excelente vocabulario!' : '¡A seguir aprendiendo!'}</h2>
        <p>${estado.resultado === 'victoria'
          ? `Lograste ${estado.puntaje} de ${CONFIG.palabrasPorPartida} puntos y completaste las ${CONFIG.palabrasPorPartida} palabras.`
          : `Obtuviste ${estado.puntaje} de ${CONFIG.palabrasPorPartida} puntos y acumulaste ${estado.fallos} fallos.`
        }</p>
        <button class="boton-principal boton-reiniciar" type="button" data-accion="reiniciar">Jugar otra vez</button>
      </section>
    `
    : `
      <div class="pie-pregunta">
        <p class="mensaje-respuesta${respuestaCorrecta === false ? ' mensaje-error' : ''}" role="status" aria-live="polite">${mensajeRespuesta}</p>
        <button class="boton-principal boton-siguiente" type="button" data-accion="siguiente"${estado.opcionElegida === null ? ' disabled' : ''}>
          Siguiente <span aria-hidden="true">→</span>
        </button>
      </div>
    `

  aplicacion.innerHTML = `
    <main class="contenedor-juego">
      <header class="encabezado">
        <a class="marca" href="#" aria-label="¿Real o Inventado? Inicio">
          <span class="marca-icono" aria-hidden="true">¿?</span>
          <span>Palabrario</span>
        </a>
        <span class="insignia">DESAFÍO DE VOCABULARIO</span>
      </header>

      <section class="introduccion" aria-labelledby="titulo-juego">
        <p class="sobretitulo"><span class="punto-cian" aria-hidden="true"></span> PON A PRUEBA TU CURIOSIDAD</p>
        <h1 id="titulo-juego">¿Real o <span>Inventado?</span></h1>
        <p class="descripcion">Hay palabras que parecen inventadas. ¿Podrás descubrir qué significan de verdad?</p>
      </section>

      <section class="tarjeta-juego" aria-labelledby="palabra-actual">
        <div class="resumen-partida">
          <div class="dato-partida">
            <span class="etiqueta-dato">INTENTO</span>
            <strong>${String(estado.intento).padStart(2, '0')} <span>/ ${String(CONFIG.palabrasPorPartida).padStart(2, '0')}</span></strong>
          </div>
          <div class="progreso" aria-label="Palabra ${estado.intento} de ${CONFIG.palabrasPorPartida}">
            ${Array.from({ length: CONFIG.palabrasPorPartida }, (_, indice) => `
              <span class="paso-progreso${indice < estado.intento ? ' completado' : ''}${indice + 1 === estado.intento ? ' actual' : ''}"></span>
            `).join('')}
          </div>
          <div class="dato-partida dato-puntaje">
            <span class="etiqueta-dato">PUNTAJE</span>
            <strong>${estado.puntaje} <span>/ ${CONFIG.puntuacionMinima}</span></strong>
          </div>
        </div>

        <div class="contenido-pregunta">
          <p class="instruccion">¿QUÉ SIGNIFICA ESTA PALABRA?</p>
          <h2 id="palabra-actual">${estado.pregunta.palabra}</h2>
          <p class="ayuda">Elige la definición verdadera</p>
          <div class="lista-opciones" aria-label="Opciones de definición">
            ${opciones}
          </div>
          ${contenidoFinal}
        </div>
      </section>

      <footer class="pie-pagina">
        <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> para elegir</span>
        <span class="separador-pie" aria-hidden="true">·</span>
        <span><kbd>↵</kbd> para continuar</span>
      </footer>
    </main>
  `

  if (selectorEnfocable !== undefined) {
    aplicacion.querySelector<HTMLButtonElement>(selectorEnfocable)?.focus()
  }
}

function seleccionarOpcion(indice: number): void {
  const puntajeAnterior = estado.puntaje

  if (!elegir(estado, indice)) {
    return
  }

  respuestaCorrecta = estado.puntaje > puntajeAnterior
  mensajeRespuesta = respuestaCorrecta
    ? '¡Correcto! Esa es la definición verdadera.'
    : `No era esa. La definición verdadera es: ${definicionActual().verdadera}`

  if (estado.resultado === 'victoria') {
    mensajeRespuesta = ''
  } else if (estado.resultado === 'derrota') {
    mensajeRespuesta = ''
  }

  mostrarPartida(estado.resultado === 'jugando' ? '.boton-siguiente' : '.boton-reiniciar')
}

function definicionActual() {
  const definicion = BANCO_PALABRAS.find(({ palabra }) => palabra === estado.pregunta.palabra)

  if (definicion === undefined) {
    throw new Error(`No se encontró la definición de ${estado.pregunta.palabra}.`)
  }

  return definicion
}

function avanzar(): void {
  if (!siguiente(estado)) {
    return
  }

  mensajeRespuesta = ''
  respuestaCorrecta = null
  mostrarPartida('.opcion')
}

function comenzarDeNuevo(): void {
  if (!reiniciar(estado)) {
    return
  }

  mensajeRespuesta = ''
  respuestaCorrecta = null
  mostrarPartida('.opcion')
}

aplicacion.addEventListener('click', (evento: MouseEvent) => {
  const objetivo = evento.target

  if (!(objetivo instanceof Element)) {
    return
  }

  const botonOpcion = objetivo.closest<HTMLButtonElement>('[data-opcion]')
  if (botonOpcion !== null) {
    seleccionarOpcion(Number(botonOpcion.dataset.opcion))
    return
  }

  const accion = objetivo.closest<HTMLButtonElement>('[data-accion]')?.dataset.accion
  if (accion === 'siguiente') {
    avanzar()
  } else if (accion === 'reiniciar') {
    comenzarDeNuevo()
  }
})

document.addEventListener('keydown', (evento: KeyboardEvent) => {
  if (evento.key === 'Enter') {
    evento.preventDefault()
    avanzar()
    return
  }

  if (estado.resultado !== 'jugando' || estado.opcionElegida !== null) {
    return
  }

  const indice = Number(evento.key) - 1
  if (Number.isInteger(indice) && indice >= 0 && indice < CONFIG.opcionesPorPalabra) {
    evento.preventDefault()
    seleccionarOpcion(indice)
  }
})

mostrarPartida()
