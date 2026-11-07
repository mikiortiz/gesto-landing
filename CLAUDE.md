# CLAUDE.md — gesto-landing

> Estado al 07/11/2026, commit `f20293f` (rama `develop`). Mapa general de ClarusRock: `CLAUDE.md` de la carpeta raíz (local, no versionado).

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
