// GitHub Pages sirve el sitio en una subcarpeta; sin esta base, la página sale en blanco.
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const variablesEntorno = loadEnv(mode, '.', '')

  return {
    base: variablesEntorno.BASE_PATH || '/semana2/',
  }
})
