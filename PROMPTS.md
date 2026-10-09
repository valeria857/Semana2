# Historial de prompts de desarrollo

Este registro resume, en orden, las solicitudes que guiaron el desarrollo de ¿Real o Inventado? Los prompts se describen por su objetivo y alcance.

## Prompts iniciales

### P1 — Lógica del juego

Crear `src/logica.ts` en TypeScript a partir de la ficha del juego. Definir tipos y configuración, mantener la lógica separada de la pantalla, devolver `true` o `false` en las acciones de estado y ofrecer azar reproducible mediante semilla. Se aclaró que se elige la definición verdadera, se suma un punto por acierto, se necesitan cinco puntos para ganar, la partida recibe un banco inicial de cinco palabras y se avanza manualmente con **Siguiente** después de responder.

### P2 — Pruebas unitarias

Crear `src/logica.test.ts` con Vitest, en español, para verificar el estado inicial, respuestas correctas e incorrectas, avance, límite de fallos, reinicio, valores booleanos de las acciones y determinismo del generador con semilla.

### P3 — Pantalla del juego

Construir la interfaz de ¿Real o Inventado? modificando únicamente `src/main.ts` y `src/style.css`. Conectarla a `src/logica.ts`, mostrar palabra, intento, puntaje y tres opciones, admitir teclado y controles táctiles, hacerla responsive y presentar los resultados y el reinicio.

### P4 — Temporizador y bonificación

Agregar un modo contrarreloj con diez segundos por palabra, barra de tiempo, bonificación de 100 puntos por responder durante los primeros tres segundos, fallo automático al agotar el tiempo y animación roja de advertencia, manteniendo las teclas rápidas.

## Ajustes y mejoras posteriores

1. **Duración del temporizador:** ampliar el tiempo de diez a treinta segundos por palabra. Se eligió escalar proporcionalmente la ventana de bonificación de tres a nueve segundos; la barra y su máximo accesible se adaptaron al nuevo límite.
2. **Racha y récord:** mostrar las respuestas correctas consecutivas, reiniciar la racha cuando se falla y guardar en `localStorage` el puntaje máximo entre partidas, con un indicador animado al superarlo.
3. **Experiencia móvil:** asegurar áreas táctiles de al menos 48 píxeles, mejorar el tamaño relativo de títulos y definiciones y evitar desbordamiento horizontal en pantallas pequeñas sin desactivar animaciones, temporizador, racha ni controles de teclado.