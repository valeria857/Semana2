import './style.css'
import { BANCO_PALABRAS, CONFIG, crearPartida, elegir, reiniciar, siguiente } from './logica.ts'

const TIEMPO_POR_PALABRA_SEGUNDOS = 30
const TIEMPO_POR_PALABRA_MS = TIEMPO_POR_PALABRA_SEGUNDOS * 1_000
const TIEMPO_BONIFICACION_MS = TIEMPO_POR_PALABRA_MS * 0.3
const BONIFICACION_VELOCIDAD = 100
const INTERVALO_RELOJ_MS = 50
const CLAVE_PUNTAJE_MAXIMO = 'real-o-inventado-puntaje-maximo'

const contenedorEncontrado = document.querySelector<HTMLDivElement>('#app')

if (contenedorEncontrado === null) {
  throw new Error('No se encontró el contenedor principal de la aplicación.')
}

const aplicacion = contenedorEncontrado
let estado = crearPartida()
let mensajeRespuesta = ''
let respuestaCorrecta: boolean | null = null
let bonificacionAcumulada = 0
let rachaActual = 0
let puntajeMaximo = leerPuntajeMaximo()
let nuevoRecordDurantePartida = false
let tiempoRestanteMs = TIEMPO_POR_PALABRA_MS
let inicioTemporizador = 0
let temporizador: number | undefined

function leerPuntajeMaximo(): number {
  const puntajeGuardado = Number(localStorage.getItem(CLAVE_PUNTAJE_MAXIMO))

  return Number.isFinite(puntajeGuardado) && puntajeGuardado >= 0 ? puntajeGuardado : 0
}

function actualizarPuntajeMaximo(): void {
  if (estado.puntaje <= puntajeMaximo) {
    return
  }

  puntajeMaximo = estado.puntaje
  nuevoRecordDurantePartida = true
  localStorage.setItem(CLAVE_PUNTAJE_MAXIMO, String(puntajeMaximo))
}

function detenerTemporizador(): void {
  if (temporizador !== undefined) {
    window.clearInterval(temporizador)
    temporizador = undefined
  }
}

function actualizarVistaTemporizador(): void {
  const reloj = aplicacion.querySelector<HTMLElement>('.reloj-cuenta-regresiva')
  const indicador = aplicacion.querySelector<HTMLElement>('.barra-tiempo-fondo')
  const barra = aplicacion.querySelector<HTMLElement>('.barra-tiempo-progreso')
  const tiempo = aplicacion.querySelector<HTMLElement>('.tiempo-restante')

  if (reloj === null || indicador === null || barra === null || tiempo === null) {
    return
  }

  const porcentaje = (tiempoRestanteMs / TIEMPO_POR_PALABRA_MS) * 100
  barra.style.width = `${porcentaje}%`
  reloj.classList.toggle('advertencia', tiempoRestanteMs <= TIEMPO_BONIFICACION_MS)
  tiempo.textContent = `${Math.ceil(tiempoRestanteMs / 1_000)} s`
  indicador.setAttribute('aria-valuenow', String(Math.ceil(tiempoRestanteMs / 1_000)))
}

function iniciarTemporizador(): void {
  detenerTemporizador()
  tiempoRestanteMs = TIEMPO_POR_PALABRA_MS
  inicioTemporizador = performance.now()
  actualizarVistaTemporizador()

  temporizador = window.setInterval(() => {
    tiempoRestanteMs = Math.max(
      0,
      TIEMPO_POR_PALABRA_MS - (performance.now() - inicioTemporizador),
    )
    actualizarVistaTemporizador()

    if (tiempoRestanteMs === 0) {
      detenerTemporizador()
      seleccionarOpcion(obtenerIndiceIncorrecto(), true)
    }
  }, INTERVALO_RELOJ_MS)
}

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
          ? `Lograste ${estado.puntaje} puntos y completaste las ${CONFIG.palabrasPorPartida} palabras, con ${bonificacionAcumulada} puntos de bonificación por velocidad.`
          : `Obtuviste ${estado.puntaje} puntos, incluidos ${bonificacionAcumulada} de bonificación por velocidad, y acumulaste ${estado.fallos} fallos.`
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
          <div class="dato-partida dato-intento">
            <span class="etiqueta-dato">INTENTO</span>
            <strong>${String(estado.intento).padStart(2, '0')} <span>/ ${String(CONFIG.palabrasPorPartida).padStart(2, '0')}</span></strong>
          </div>
          <div class="dato-partida dato-racha">
            <span class="etiqueta-dato">RACHA ACTUAL</span>
            <strong>${rachaActual}</strong>
          </div>
          <div class="dato-partida dato-puntaje">
            <span class="etiqueta-dato">PUNTAJE</span>
            <strong>${estado.puntaje} <span>pts</span></strong>
            <span class="bono-acumulado">+${bonificacionAcumulada} bono</span>
          </div>
          <div class="dato-partida dato-record${nuevoRecordDurantePartida ? ' nuevo-record' : ''}">
            <span class="etiqueta-dato">PUNTAJE MÁXIMO</span>
            <strong>${puntajeMaximo} <span>pts</span></strong>
            ${nuevoRecordDurantePartida ? '<span class="aviso-nuevo-record">¡Nuevo Récord!</span>' : ''}
          </div>
          <div class="progreso" aria-label="Palabra ${estado.intento} de ${CONFIG.palabrasPorPartida}">
            ${Array.from({ length: CONFIG.palabrasPorPartida }, (_, indice) => `
              <span class="paso-progreso${indice < estado.intento ? ' completado' : ''}${indice + 1 === estado.intento ? ' actual' : ''}"></span>
            `).join('')}
          </div>
        </div>

        <div class="reloj-cuenta-regresiva" role="timer" aria-label="Tiempo restante para responder">
          <div class="cabecera-reloj">
            <span class="etiqueta-reloj">TIEMPO</span>
            <span class="tiempo-restante">${Math.ceil(tiempoRestanteMs / 1_000)} s</span>
          </div>
          <div class="barra-tiempo-fondo" role="progressbar" aria-label="Tiempo restante" aria-valuemin="0" aria-valuemax="${TIEMPO_POR_PALABRA_SEGUNDOS}" aria-valuenow="${Math.ceil(tiempoRestanteMs / 1_000)}">
            <span class="barra-tiempo-progreso" style="width: ${(tiempoRestanteMs / TIEMPO_POR_PALABRA_MS) * 100}%"></span>
          </div>
          <span class="ayuda-bonificacion">¡Responde en los primeros ${TIEMPO_BONIFICACION_MS / 1_000} segundos y gana +${BONIFICACION_VELOCIDAD} puntos!</span>
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

function obtenerIndiceIncorrecto(): number {
  const definicion = definicionActual()
  const indiceIncorrecto = estado.pregunta.opciones.findIndex((opcion) => opcion !== definicion.verdadera)

  if (indiceIncorrecto < 0) {
    throw new Error(`No se encontró una opción falsa para ${estado.pregunta.palabra}.`)
  }

  return indiceIncorrecto
}

function seleccionarOpcion(indice: number, tiempoAgotado = false): void {
  const tiempoTranscurrido = tiempoAgotado
    ? TIEMPO_POR_PALABRA_MS
    : performance.now() - inicioTemporizador
  const puntajeAnterior = estado.puntaje

  detenerTemporizador()

  if (!elegir(estado, indice)) {
    return
  }

  respuestaCorrecta = estado.puntaje > puntajeAnterior
  if (respuestaCorrecta && tiempoTranscurrido <= TIEMPO_BONIFICACION_MS) {
    estado.puntaje += BONIFICACION_VELOCIDAD
    bonificacionAcumulada += BONIFICACION_VELOCIDAD
    mensajeRespuesta = `¡Correcto! +${BONIFICACION_VELOCIDAD} puntos de bonificación por velocidad.`
  } else if (tiempoAgotado) {
    mensajeRespuesta = `¡Se acabó el tiempo! La palabra cuenta como fallo. La definición verdadera es: ${definicionActual().verdadera}`
  } else {
    mensajeRespuesta = respuestaCorrecta
      ? '¡Correcto! Esa es la definición verdadera.'
      : `No era esa. La definición verdadera es: ${definicionActual().verdadera}`
  }

  if (respuestaCorrecta) {
    rachaActual += 1
  } else {
    rachaActual = 0
  }
  actualizarPuntajeMaximo()

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
  iniciarTemporizador()
}

function comenzarDeNuevo(): void {
  if (!reiniciar(estado)) {
    return
  }

  mensajeRespuesta = ''
  respuestaCorrecta = null
  bonificacionAcumulada = 0
  rachaActual = 0
  nuevoRecordDurantePartida = false
  mostrarPartida('.opcion')
  iniciarTemporizador()
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
iniciarTemporizador()
