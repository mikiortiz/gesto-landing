# Landing Gesto — Proyecto Standalone

## Contexto

Crear un proyecto React independiente que hostee únicamente la landing page de **Gesto**.
Mismo diseño y contenido que la app principal. Se deploya por separado (propio dominio/Vercel).
Accesible desde el público general y desde un link dentro de la app con estado `{ fromApp: true }`.

---

## Stack

- React 19 + TypeScript + Vite (`@vitejs/plugin-react`)
- Tailwind CSS v4 (via `@tailwindcss/postcss`, sin `tailwind.config.js`)
- MUI v7 (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
- Framer Motion v12
- Lucide React
- React Router DOM v7 (solo para el estado `fromApp` y el botón "Volver")

---

## Estructura

```
src/
  pages/
    Landing.tsx
  services/
    speechService.ts
  App.tsx
  main.tsx
  index.css
public/
  imgs/
    Logo-Gesto.png
    Logotipo_de_Mercado_Pago_alternativo.webp
    logo-mercadopago-blanco.png
    clarus_rock_logotipo_transparent.svg
```

---

## package.json

```json
{
  "name": "gesto-landing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/icons-material": "^7.3.9",
    "@mui/material": "^7.3.9",
    "framer-motion": "^12.23.22",
    "lucide-react": "^0.544.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.7.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^4.6.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.3",
    "vite": "^7.0.4"
  }
}
```

---

## index.css

```css
@import "tailwindcss";

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.text-shimmer {
  background: linear-gradient(90deg, #60a5fa, #22d3ee, #34d399, #60a5fa);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
}
```

---

## App.tsx

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## src/services/speechService.ts

```ts
let _muted = false;
export const setVoiceMuted = (v: boolean) => { _muted = v; };

let _cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && window.speechSynthesis) {
  const update = () => { _cachedVoices = window.speechSynthesis.getVoices(); };
  update();
  window.speechSynthesis.addEventListener("voiceschanged", update);
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function adjustRate(rate: number): number {
  if (isMobile()) return Math.min(rate * 0.65, 1.0);
  return Math.min(rate, 1.3);
}

const MALE_HINTS   = ["jorge", "diego", "carlos", "pablo", "juan", "david", "male"];
const FEMALE_HINTS = ["sabina", "valeria", "sofia", "monica", "helena", "laura", "paulina", "female"];

function pickVoice(gender: "male" | "female"): SpeechSynthesisVoice | null {
  const voices = _cachedVoices.length ? _cachedVoices : window.speechSynthesis.getVoices();
  const esVoices = voices.filter(v => v.lang.startsWith("es"));
  if (!esVoices.length) return null;
  const hints = gender === "male" ? MALE_HINTS : FEMALE_HINTS;
  const byHint = esVoices.find(v => hints.some(h => v.name.toLowerCase().includes(h)));
  if (byHint) return byHint;
  const arVoice = esVoices.find(v => v.lang === "es-AR");
  if (arVoice) return arVoice;
  return esVoices[0];
}

function pesosToWords(pRaw: string, cRaw: string): string {
  const pesos = parseInt(pRaw.replace(/[.,]/g, ""), 10);
  const cents = cRaw.length === 1 ? parseInt(cRaw, 10) * 10 : parseInt(cRaw, 10);
  const pesoWord = pesos === 1 ? "peso" : "pesos";
  if (pesos === 0 && cents === 0) return "cero pesos";
  if (pesos === 0) return cents === 1 ? "un centavo" : `${cents} centavos`;
  if (cents === 0) return `${pesos} ${pesoWord}`;
  return `${pesos} ${pesoWord} con ${cents} centavos`;
}

function normalizeText(text: string): string {
  return text.trim()
    .replace(/\b[A-ZÁÉÍÓÚÑÜ]{2,}\b/g, (w) => w[0] + w.slice(1).toLowerCase())
    .replace(/\$\s*0[.,](\d{1,2})/g, (_, c) => {
      const n = c.length === 1 ? parseInt(c, 10) * 10 : parseInt(c, 10);
      return n === 0 ? "cero pesos" : n === 1 ? "un centavo" : `${n} centavos`;
    })
    .replace(/\$\s*([\d.]+),(\d{1,2})/g, (_, p, c) => pesosToWords(p, c))
    .replace(/\$\s*(\d+)\.(\d{1,2})(?!\d)/g, (_, p, c) => pesosToWords(p, c))
    .replace(/\$\s*([\d.,]*\d)/g, "$1 pesos")
    .replace(/\$/g, "pesos")
    .replace(/(\d[\d.,]*)\s*ml\b/gi, "$1 mililitros")
    .replace(/(\d[\d.,]*)\s*kg\b/gi, "$1 kilogramos")
    .replace(/(\d[\d.,]*)\s*g\b/gi, "$1 gramos")
    .replace(/(\d[\d.,]*)\s*lt\b/gi, "$1 litros")
    .replace(/(\d[\d.,]*)\s*l\b/gi, "$1 litros")
    .replace(/(\d[\d.,]*)\s*k\b/gi, "$1 kilos");
}

function makeUtterance(text: string, rate: number, gender: "male" | "female"): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(normalizeText(text));
  utterance.lang = "es-AR";
  utterance.rate = adjustRate(rate);
  const voice = pickVoice(gender);
  if (voice) utterance.voice = voice;
  if (gender === "male" && (!voice || !MALE_HINTS.some(h => voice.name.toLowerCase().includes(h)))) {
    utterance.pitch = 0.75;
  }
  return utterance;
}

export function stopSpeak(): void { window.speechSynthesis?.cancel(); }

export function speak(text: string, rate = 1.6, gender: "male" | "female" = "female"): void {
  if (_muted || !text?.trim() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(makeUtterance(text, rate, gender));
}
```

---

## src/pages/Landing.tsx

Copiar exactamente el archivo `src/pages/Landing.tsx` de la app principal aplicando estos 3 cambios:

### Cambio 1 — Quitar dependencia de ServicePlanContext

Eliminar:
```tsx
import { useServicePlan } from '../hooks';
// y dentro del componente:
const { palette } = useServicePlan();
```

Reemplazar con estas constantes al tope del componente `Landing`:
```tsx
const palette = {
  logoGradient: 'from-blue-600 to-cyan-600',
  navGradient: 'from-slate-900/95 to-slate-800/95',
};
```

### Cambio 2 — Botones que van al login de la app principal

Al tope del archivo agregar:
```tsx
const APP_LOGIN_URL = 'https://app.gesto.com.ar/admin-login'; // ajustar URL real
```

Reemplazar todos los `navigate('/admin-login')` y `onClick={() => navigate('/admin-login')}` por:
```tsx
onClick={() => window.open(APP_LOGIN_URL, '_blank')}
```

### Cambio 3 — Footer inline (sin el componente Footer de la app)

Reemplazar el `<Footer />` al final del return por este footer inline:

```tsx
<footer className="relative z-10 border-t border-white/10 w-full" style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.95), rgba(30,41,59,0.95))' }}>
  <div className="mx-auto max-w-7xl px-4 pt-3 pb-2">
    <div className="grid grid-cols-3 items-center gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 group bg-transparent border-none cursor-pointer"
        >
          <img src="/imgs/Logo-Gesto.png" alt="Logo Gesto" className="h-9 w-9 flex-shrink-0 rounded-full border border-white/20 bg-white/10 object-contain shadow-lg transition-opacity group-hover:opacity-80" />
          <div className="flex-shrink-0">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white leading-none group-hover:opacity-80 transition-opacity">gesto</p>
            <p className="mt-0.5 text-[11px] text-slate-300 leading-none">tu gesto. tu control.</p>
          </div>
        </button>
        <div className="ml-2 hidden sm:flex flex-col gap-1 text-[11px] text-slate-300">
          <a href="https://wa.me/5492622517454" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-100 transition-colors">📞 2622517454</a>
          <a href="mailto:ortizmichel390@gmail.com" className="text-slate-300 hover:text-slate-100 transition-colors">✉ ortizmichel390@gmail.com</a>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">Plataforma de control de caja, inventario y cobros</span>
      </div>
      <div className="flex justify-end">
        <a href="https://www.clarusrock.com" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">Sitio creado por</span>
          <img src="/imgs/clarus_rock_logotipo_transparent.svg" alt="Clarus Rock" className="h-11 w-auto object-contain" />
        </a>
      </div>
    </div>
    <div className="mt-2 flex items-center justify-center border-t border-white/10 pt-2">
      <p className="text-[10px] text-slate-500">© {new Date().getFullYear()} Gesto · Todos los derechos reservados</p>
    </div>
  </div>
</footer>
```

---

## Assets — copiar del proyecto original

Ubicados en `public/imgs/` de la app principal:

| Archivo | Descripción |
|---|---|
| `Logo-Gesto.png` | Logo en nav, hero y footer |
| `Logotipo_de_Mercado_Pago_alternativo.webp` | Card Mercado Pago en features |
| `logo-mercadopago-blanco.png` | Cards sección POS |
| `clarus_rock_logotipo_transparent.svg` | Footer |

---

## Notas finales

- El resto de `Landing.tsx` (canvas de partículas, todas las secciones, voz por scroll, animaciones) va **sin ningún cambio**.
- El import de `speak` cambia de `'../services/speechService'` — misma ruta relativa, mismo archivo.
- El `isFromApp` con `location.state` sigue funcionando igual; si alguien llega desde la app con `navigate('/landing-url', { state: { fromApp: true } })` el botón "Volver" aparece.
- Sin tests configurados, igual que la app principal.
