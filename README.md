# ¿Real o Inventado?

¿Real o Inventado? es un juego de vocabulario: en cada turno aparece una palabra poco común y hay que elegir cuál de tres opciones explica su significado verdadero.

## Cómo se juega

- Una partida consta de cinco palabras y cada una ofrece tres definiciones posibles.
- Se suma un punto por cada respuesta correcta. Para ganar hay que completar las cinco palabras con la puntuación máxima; tres fallos terminan la partida antes.
- Después de responder, se puede avanzar con el botón **Siguiente** o la tecla **Enter**.
- También se puede reiniciar la partida al finalizar.
- En cada palabra hay 30 segundos para responder. Si el tiempo se agota, la respuesta se registra como un fallo y se puede continuar, salvo que sea el tercer fallo.
- Una respuesta correcta durante los primeros nueve segundos recibe 100 puntos adicionales de bonificación por velocidad.

## Funciones especiales

- **Temporizador contrarreloj:** barra progresiva de 30 segundos por palabra, con aviso visual pulsante cuando quedan nueve segundos.
- **Bono de velocidad:** suma 100 puntos al responder correctamente durante los primeros nueve segundos.
- **Contador de racha:** muestra las respuestas correctas consecutivas y vuelve a cero al fallar o dejar que se agote el tiempo.
- **Puntaje máximo:** conserva en `localStorage` la puntuación más alta de partidas anteriores y destaca cuando se supera el récord.
- **Controles:** se puede elegir una opción con las teclas **1**, **2** y **3**, o tocando su botón. Se avanza con **Enter** o con **Siguiente**.
- **Diseño adaptable:** interfaz responsive con controles táctiles de al menos 48 píxeles de alto.

## Requisitos

- Node.js y npm.

## Instalación y ejecución

Desde la carpeta del proyecto, instalá las dependencias:

```sh
npm install
```

Iniciá el servidor de desarrollo:

```sh
npm run dev
```

Ejecutá las pruebas unitarias con Vitest:

```sh
npx vitest run
```

## Contenido del proyecto

- `src/logica.ts`: estado, banco de palabras y reglas de la partida.
- `src/logica.test.ts`: pruebas unitarias de la lógica.
- `src/main.ts`: interfaz, controles, temporizador, racha y puntaje máximo.
- `src/style.css`: estilos de la interfaz y diseño adaptable.
