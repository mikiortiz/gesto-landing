# CLAUDE.md — gesto-landing

> Estado al 12/11/2026 (rama `develop`): bloque "Tus empleados venden, vos ves todo" (cajeros), cajeros por plan, pregunta frecuente y el manual (`public/docs/gesto-manual-de-uso.pdf`) con la sección 16 Cajeros. **No pasar a `main` hasta que cajeros esté en producción en la app** (hoy solo en develop). Antes: commit `f20293f`. Mapa general de ClarusRock: `CLAUDE.md` de la carpeta raíz (local, no versionado).

Landing pública de **Gesto.lat**. Sitio estático (React 19 + TypeScript + Vite, Tailwind v4, MUI v7, Framer Motion), deployado aparte en Vercel. **No se conecta a ningún backend.** El diseño, el contenido y la estructura están en `LANDING_STANDALONE_BRIEFING.md`.

## Comandos

```bash
npm run dev       # servidor local
npm run build     # tsc -b && vite build: correr antes de pushear
npm run preview
```

## Reglas

- Se llega también desde la app con el estado `{ fromApp: true }`, que muestra el botón "Volver": no romperlo.
- Arreglos chicos, una vez verificados en el navegador, van de `develop` directo a producción (`main`). `main` tiene regla de PR que el push del dueño saltea; no abrir PRs salvo que se pida.
- Lo visual no se da por terminado sin captura o sin verlo en el navegador.
- Los planes (`PLANS` en `src/pages/Landing.tsx` y `public/llms.txt`) copian `PLAN_LIMITS` del back (`services/servicePlan.js`): prueba gratis 3 cajas, Esencial 1, Profesional 3, Enterprise 5, y un local en todos los planes. Cajeros (`MAX_CASHIERS`): prueba 3, Esencial 1, Profesional 3, Enterprise sin límite. Si cambian en el back, cambiarlos acá.
