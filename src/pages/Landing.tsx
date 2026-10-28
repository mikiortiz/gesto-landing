import { createContext, Fragment, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, MotionConfig, AnimatePresence, type Variants } from 'framer-motion';
import {
  Check, ChevronDown, Download, Volume2, VolumeX, ArrowRight, ScanBarcode, Mic, Banknote, Landmark,
  NotebookPen, Scale, MonitorSmartphone, Split, PauseCircle, Laptop, Smartphone, Sparkles, Bell,
} from 'lucide-react';
import { speak } from '../services/speechService';

const APP_LOGIN_URL = 'https://app.gesto.lat/admin-login';
// Manual de uso servido por la propia landing (public/docs), así el link no depende del deploy de la app
const MANUAL_URL = '/docs/gesto-manual-de-uso.pdf';
const WHATSAPP_URL = 'https://wa.me/5492622517454';
const MP_ICON = '/imgs/logos-MP/mercadopago.svg';
const WA_GREEN = '#25D366';

const INTRO_SPEECH = 'Hola, soy Gesto. Te ayudo a vender, cobrar y llevar la caja y el stock de tu comercio desde un solo lugar. Podés probarme sesenta días gratis, y te acompaño paso a paso desde el primer día.';

// Narración por sección: solo suena si la persona activa la voz desde el menú
const SECTION_SPEECH: Record<string, string> = {
  producto: 'Con mi punto de venta cobrás al toque. Escaneás el código, elegís cómo cobrar y listo: efectivo, QR de Mercado Pago, transferencia sin comisión o fiado. Y al final del turno, la caja te cierra.',
  fiados: '¿Cuánta plata perdés porque no podés cobrarle a los clientes a tiempo? Yo armo el mensaje con todo lo que te deben y lo mandamos por WhatsApp en un clic.',
  'en-vivo': 'Podés tener varias cajas abiertas, en la compu o en el celular, y todo se actualiza al instante. Cuando Mercado Pago aprueba un pago, te enterás en el momento.',
  voz: 'Si tenés las manos ocupadas, decime Gesto y pedime lo que necesites: agregar al carrito, cobrar, o consultar un precio. Y preguntame lo que quieras sobre tus ventas, tu stock o tus fiados.',
  'primeros-pasos': 'Arrancar es fácil, porque no estás solo. Apenas entrás, yo te acompaño paso a paso hasta dejar tu negocio listo para vender.',
  planes: 'Podés probarme sesenta días gratis, sin tarjeta. Después pagás mes a mes, y cambiás de plan cuando quieras.',
};

const RUBROS = ['Almacenes', 'Verdulerías', 'Carnicerías', 'Panaderías', 'Kioscos', 'Dietéticas', 'Fiambrerías'];

const GUIDE_STEPS: [string, string][] = [
  ['Elegí tu plan', 'Arrancás con la prueba gratis de 60 días y cambiás cuando quieras.'],
  ['Configurá cómo cobrás', 'Transferencia a tu CBU o alias, o Mercado Pago: sucursal, caja y cuenta, paso a paso.'],
  ['Cargá tu primer producto', 'Escaneás el código y Gesto completa los datos que conoce. Vos ponés precio y stock.'],
  ['Hacé tu primera venta', 'Abrís la caja, agregás el producto y cobrás. Gesto te marca qué tocar.'],
  ['Armá tu vidriera', 'Nombre, logo, dirección, horarios y WhatsApp para que tus clientes te encuentren.'],
];

// Límites reales por plan (interno-e-commerce-back: PLAN_LIMITS y services/servicePlan.js)
const PLANS = [
  {
    name: 'Prueba gratis',
    price: 'Gratis',
    period: '60 días',
    note: 'Todo incluido para que lo pruebes en serio.',
    features: ['3 cajas abiertas a la vez', '1 local', 'Asistente de voz y chat con IA', 'Soporte por email'],
    cta: 'Empezar la prueba',
    featured: false,
  },
  {
    name: 'Esencial',
    price: 20000,
    period: 'por mes',
    note: 'Lo necesario para el día a día del mostrador.',
    features: ['2 cajas abiertas a la vez', 'Hasta 2 locales', 'Ventas, caja, stock y fiados', 'Cobros con QR y transferencia'],
    cta: 'Elegir Esencial',
    featured: false,
  },
  {
    name: 'Profesional',
    price: 35000,
    period: 'por mes',
    note: 'Para comercios con más movimiento y más de un turno.',
    features: ['3 cajas abiertas a la vez', 'Hasta 3 locales', 'Asistente de voz y chat con IA', 'Cierre a ciegas e historial de cierres en PDF'],
    cta: 'Elegir Profesional',
    featured: true,
  },
];

const FAQ: [string, string][] = [
  ['¿Necesito tarjeta para probarlo?', 'No. Te registrás y tenés 60 días con todas las funciones. Si después querés seguir, elegís un plan y lo pagás con Mercado Pago, mes a mes.'],
  ['¿Qué pasa cuando terminan los 60 días?', 'Podés seguir entrando y ver todo lo que cargaste, pero para vender y abrir caja hay que activar un plan. No se borra nada.'],
  ['¿Funciona en el celular?', 'Sí. Gesto funciona en el navegador de la compu, la tablet o el celular, y podés tener varias cajas abiertas en distintos dispositivos.'],
  ['¿Qué lector de códigos necesito?', 'Cualquier lector USB común. Si no tenés, podés escanear con la cámara del celular o buscar el producto por nombre.'],
  ['¿Las transferencias tienen comisión?', 'No. La plata va directo a tu CBU o alias; Gesto no la toca. Los cobros con QR de Mercado Pago tienen la comisión de Mercado Pago, en tu propia cuenta.'],
  ['¿Tengo que cargar todos los productos a mano?', 'No. Gesto tiene una base de más de 37.000 productos: escaneás el código y se completan nombre y marca. Vos solo ponés precio y stock.'],
];

const priceFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

/* ── Animaciones de entrada ──
   Reveal aparece al entrar en pantalla y escalona a sus Item hijos (uno detrás de otro).
   Usa variantes con nombre ("hidden"/"show") para que los Item hereden el estado del Reveal que los contiene. */
const EASE = [0.22, 1, 0.36, 1] as const;

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, staggerChildren: 0.09, delayChildren: 0.08 } },
};
// Contenedor que solo escalona (no se mueve él)
const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function Reveal({ children, className = '', group = false, onLoad = false }: { children: React.ReactNode; className?: string; group?: boolean; onLoad?: boolean }) {
  return (
    <motion.div variants={group ? groupVariants : revealVariants} initial="hidden"
      {...(onLoad ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, amount: 0.15 } })}
      className={className}>
      {children}
    </motion.div>
  );
}

function Item({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={itemVariants} className={className}>{children}</motion.div>;
}

function ItemLi({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <motion.li variants={itemVariants} className={className}>{children}</motion.li>;
}

// Al ir a una sección desde el menú, su contenido se vuelve a montar para que la animación se repita
const ReplayContext = createContext<Record<string, number>>({});
function Replay({ id, children }: { id: string; children: React.ReactNode }) {
  const n = useContext(ReplayContext)[id] ?? 0;
  return <Fragment key={n}>{children}</Fragment>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-teal mb-3">{children}</p>;
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-display font-bold tracking-tight text-ink text-3xl sm:text-4xl leading-[1.1] ${className}`}>{children}</h2>;
}

function PrimaryButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <a href={APP_LOGIN_URL} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-teal px-5 py-3 font-semibold text-white no-underline transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${className}`}>
      {children}
    </a>
  );
}

function MpIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return <img src={MP_ICON} alt="Mercado Pago" width={size} height={Math.round(size * 0.73)} className={`inline-block object-contain ${className}`} />;
}

function WhatsAppGlyph({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.8.7.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.4l5.82-1.53a11.3 11.3 0 0 0 5.63 1.43h.01c6.25 0 11.34-5.09 11.35-11.34 0-3.03-1.18-5.88-3.33-8.02z" />
    </svg>
  );
}

/* ── Pantallas de ejemplo ──
   Maquetas simples con el aspecto de la app. Se pueden reemplazar por capturas reales
   (public/imgs/app/*.png) sin tocar el resto de la sección. */

function Screen({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(28,38,40,0.04),0_12px_32px_-12px_rgba(28,38,40,0.18)] overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2.5">
        <img src="/imgs/Logo-Gesto.png" alt="" className="h-5 w-5 object-contain" />
        <span className="text-xs font-semibold text-ink-2">{title}</span>
      </div>
      {children}
    </div>
  );
}

function PosScreen() {
  const items: [string, string, number][] = [
    ['Yerba Taragüi 1 kg', '1 ×', 4850],
    ['Coca-Cola 2,25 L', '2 ×', 6400],
    ['Pan francés', '0,750 kg', 2250],
    ['Queso cremoso', '0,320 kg', 3520],
  ];
  const total = items.reduce((s, [, , v]) => s + v, 0);
  return (
    <Screen title="Punto de venta · Caja 1">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink-3 mb-4">
          <ScanBarcode size={16} className="text-teal" /> Escaneá o buscá un producto
        </div>
        {/* Los productos entran de a uno, como si se fueran escaneando */}
        <motion.ul className="divide-y divide-line text-sm" initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.28, delayChildren: 0.6 } } }}>
          {items.map(([name, qty, value]) => (
            <motion.li key={name} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } } }}
              className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-ink">{name} <span className="text-ink-3">· {qty}</span></span>
              <span className="tabular-nums font-medium text-ink">{priceFormatter.format(value)}</span>
            </motion.li>
          ))}
        </motion.ul>
        <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl font-bold tabular-nums">{priceFormatter.format(total)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
          {([
            ['Efectivo', <Banknote key="e" size={16} />],
            ['QR', <MpIcon key="q" size={20} />],
            ['Transferencia', <Landmark key="t" size={16} />],
            ['Fiado', <NotebookPen key="f" size={16} />],
          ] as [string, React.ReactNode][]).map(([m, icon], i) => (
            <span key={m} className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center ${i === 1 ? 'border-[#00a6e0] bg-[#e6f7fd] text-ink' : 'border-line text-ink-2'}`}>
              {icon}{m}
            </span>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function CashScreen() {
  const rows: [string, number][] = [['Apertura', 20000], ['Ventas en efectivo', 184300], ['Retiro (proveedor)', -45000]];
  return (
    <Screen title="Caja · Turno mañana">
      <div className="p-4 sm:p-5 text-sm">
        <ul className="space-y-2">
          {rows.map(([label, value]) => (
            <li key={label} className="flex justify-between">
              <span className="text-ink-2">{label}</span>
              <span className={`tabular-nums font-medium ${value < 0 ? 'text-orange' : 'text-ink'}`}>{priceFormatter.format(value)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
          <span>Debería haber</span><span className="tabular-nums">{priceFormatter.format(159300)}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {[['QR', 96200], ['Transf.', 58700], ['Fiado', 12400]].map(([l, v]) => (
            <div key={l} className="rounded-md bg-paper px-2 py-2">
              <div className="text-ink-3">{l}</div>
              <div className="tabular-nums font-semibold text-ink">{priceFormatter.format(Number(v))}</div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function StockScreen() {
  const rows: [string, string, 'ok' | 'low' | 'out'][] = [
    ['Coca-Cola 2,25 L', '48 u', 'ok'],
    ['Pan lactal Bimbo', '6 u', 'low'],
    ['Asado', '3,8 kg', 'ok'],
    ['Leche La Serenísima 1 L', '2 u', 'out'],
    ['Queso cremoso', '1,2 kg', 'low'],
  ];
  const style = { ok: 'text-ink-2', low: 'text-orange font-semibold', out: 'text-red-700 font-semibold' };
  return (
    <Screen title="Inventario">
      <motion.ul className="divide-y divide-line text-sm" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}>
        {rows.map(([name, qty, level]) => (
          <motion.li key={name} variants={{ hidden: { opacity: 0, x: 12 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } } }}
            className="flex items-center justify-between px-4 sm:px-5 py-2.5">
            <span className="text-ink">{name}</span>
            <span className={`tabular-nums ${style[level]}`}>{qty}{level !== 'ok' && ' · reponer'}</span>
          </motion.li>
        ))}
      </motion.ul>
    </Screen>
  );
}

function WhatsAppMessage() {
  const rows: [string, string, boolean][] = [['05/05', '$ 2.800', false], ['12/05', '$ 1.500', false], ['18/05 · pago', '− $ 2.000', true], ['28/05', '$ 3.200', false]];
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-xl shadow-[0_12px_32px_-12px_rgba(28,38,40,0.25)]">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">MG</div>
        <div className="flex-1">
          <div className="text-sm font-semibold">María González</div>
          <div className="text-xs text-white/70">Cliente · fiado</div>
        </div>
        <WhatsAppGlyph size={22} />
      </div>
    <div className="bg-[#e7ddd3] p-4 sm:p-5">
      {/* Primero llega el resumen y después contesta el cliente, como en un chat */}
      <motion.div initial={{ opacity: 0, y: 14, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45, delay: 0.3, ease: EASE }} style={{ transformOrigin: 'top left' }}
        className="rounded-lg rounded-tl-none bg-white p-4 text-sm text-ink shadow-sm">
        <p className="font-semibold mb-1">Hola María, ¿cómo estás?</p>
        <p className="text-ink-2 mb-3">Te paso el resumen de tu cuenta en Almacén Don Luis:</p>
        <ul className="space-y-1 mb-3 tabular-nums">
          {rows.map(([d, v, paid]) => (
            <li key={d} className="flex justify-between"><span className="text-ink-3">{d}</span><span className={paid ? 'text-teal' : ''}>{v}</span></li>
          ))}
        </ul>
        <p className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span className="tabular-nums">$ 5.500</span></p>
        <p className="mt-1 text-right text-[11px] text-ink-3">10:32</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4, delay: 1.4, ease: EASE }} style={{ transformOrigin: 'top right' }}
        className="mt-2 ml-auto w-fit rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm text-ink shadow-sm">
        ¡Gracias! Paso mañana y te lo dejo.
      </motion.div>
    </div>
    </div>
  );
}

/* ── Vistas "en vivo" (sección oscura) ── */

const LIVE_EVENTS: { icon: 'mp' | 'cash' | 'transfer' | 'wa' | 'stock'; text: string; amount?: string; where: string }[] = [
  { icon: 'mp', text: 'Pago QR aprobado', amount: '$ 6.400', where: 'Caja 1 · mostrador' },
  { icon: 'cash', text: 'Venta en efectivo', amount: '$ 2.250', where: 'Caja 2 · celular' },
  { icon: 'stock', text: 'Leche La Serenísima: quedan 2', where: 'Inventario' },
  { icon: 'transfer', text: 'Transferencia confirmada', amount: '$ 11.300', where: 'Caja 1 · mostrador' },
  { icon: 'wa', text: 'Resumen enviado a María G.', where: 'Fiados' },
  { icon: 'mp', text: 'Pago QR aprobado', amount: '$ 3.520', where: 'Caja 2 · celular' },
];

function LiveIcon({ kind }: { kind: (typeof LIVE_EVENTS)[number]['icon'] }) {
  const box = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg';
  if (kind === 'mp') return <span className={`${box} bg-white`}><MpIcon size={20} /></span>;
  if (kind === 'wa') return <span className={box} style={{ background: WA_GREEN, color: 'white' }}><WhatsAppGlyph size={16} /></span>;
  if (kind === 'cash') return <span className={`${box} bg-emerald-400/15 text-emerald-300`}><Banknote size={16} /></span>;
  if (kind === 'transfer') return <span className={`${box} bg-sky-400/15 text-sky-300`}><Landmark size={16} /></span>;
  return <span className={`${box} bg-orange/20 text-orange`}><Bell size={16} /></span>;
}

function LiveFeed() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 2600);
    return () => clearInterval(t);
  }, []);
  // Los 4 eventos más recientes, el último arriba
  const visible = Array.from({ length: 4 }, (_, i) => {
    const n = tick - i;
    return { ...LIVE_EVENTS[((n % LIVE_EVENTS.length) + LIVE_EVENTS.length) % LIVE_EVENTS.length], key: n };
  });
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-white/80">Actividad del negocio</span>
        <span className="flex items-center gap-1.5 text-emerald-300">
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          en vivo
        </span>
      </div>
      {/* Alto fijo (4 filas de h-14 + 3 huecos de 8px) y salida en popLayout: la fila que sale no ocupa lugar,
          así la lista nunca cambia de tamaño ni empuja el contenido de abajo */}
      <ul className="relative m-0 flex h-[248px] list-none flex-col gap-2 overflow-hidden p-0">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map(e => (
            <motion.li key={e.key} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
              className="flex h-14 flex-shrink-0 items-center gap-3 rounded-lg bg-white/[0.04] px-3">
              <LiveIcon kind={e.icon} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-white">{e.text}</div>
                <div className="text-xs text-white/50">{e.where}</div>
              </div>
              {e.amount && <span className="font-mono text-sm tabular-nums text-white">{e.amount}</span>}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function DevicesView() {
  return (
    <div className="relative grid grid-cols-[1fr_auto] items-end gap-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-white/60"><Laptop size={14} /> Caja 1 · Compu del mostrador</div>
        <div className="space-y-1.5 rounded-lg bg-[#0f1a1c] p-3 font-mono text-[11px] text-white/70">
          <div className="flex justify-between"><span>Yerba Taragüi 1 kg</span><span>4.850</span></div>
          <div className="flex justify-between"><span>Coca-Cola 2,25 L ×2</span><span>6.400</span></div>
          <div className="flex justify-between border-t border-white/10 pt-1.5 text-white"><span>TOTAL</span><span>11.250</span></div>
        </div>
      </div>
      <div className="w-28 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        <div className="mb-1.5 flex items-center gap-1 text-[10px] text-white/60"><Smartphone size={11} /> Caja 2</div>
        <div className="space-y-1 rounded-lg bg-[#0f1a1c] p-2 font-mono text-[10px] text-white/70">
          <div>Pan 0,750 kg</div>
          <div className="text-white">$ 2.250</div>
          <div className="mt-1 rounded bg-emerald-400/20 px-1 py-0.5 text-center text-emerald-300">Cobrado</div>
        </div>
      </div>
    </div>
  );
}

const VOICE_LINES: [string, string][] = [
  ['agregame 3 Coca Cola', 'Agregado: 3 × Coca-Cola 2,25 L · $ 9.600'],
  ['¿cuánto sale la yerba?', 'Yerba Taragüi 1 kg: $ 4.850 · quedan 14'],
  ['fiar a María González', 'Venta a cuenta de María G. · total $ 7.700'],
  ['cobrar en efectivo', 'Cobrado $ 11.250 en efectivo · vuelto $ 750'],
];

function VoiceConsole() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % VOICE_LINES.length), 3400);
    return () => clearInterval(t);
  }, []);
  const [said, result] = VOICE_LINES[i];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange text-ink">
          <Mic size={20} />
          <motion.span animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="absolute inset-0 rounded-full border-2 border-orange" />
        </div>
        <div className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 32 }, (_, k) => (
            <motion.span key={k} className="w-[3px] flex-1 rounded-full bg-teal-soft/70" style={{ height: 6 + ((k * 37) % 28) }}
              animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 1 + (k % 5) * 0.15, repeat: Infinity, delay: (k % 7) * 0.08 }} />
          ))}
        </div>
      </div>
      {/* El alto mínimo va en un contenedor fijo: con mode="wait" hay un instante sin contenido y no debe achicarse */}
      <div className="mt-5 min-h-[136px] sm:min-h-[104px]">
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="space-y-3">
          <p className="m-0 text-lg text-white"><span className="text-white/50">"Gesto,</span> {said}<span className="text-white/50">"</span></p>
          <p className="m-0 flex items-center gap-2 rounded-lg bg-emerald-400/10 px-3 py-2 font-mono text-sm text-emerald-200">
            <Check size={15} className="flex-shrink-0" /> {result}
          </p>
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Página ── */

export function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromApp = Boolean((location.state as { fromApp?: boolean } | null)?.fromApp);
  const [voiceOn, setVoiceOn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const spokenRef = useRef(new Set<string>());

  // La voz solo suena si la persona la activa: presentación + una narración por sección al llegar a ella
  const toggleVoice = () => {
    window.speechSynthesis?.cancel();
    if (voiceOn) { setVoiceOn(false); return; }
    setVoiceOn(true);
    speak(INTRO_SPEECH, 1.15, 'male');
  };

  useEffect(() => {
    if (!voiceOn) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const id = (e.target as HTMLElement).id;
        if (e.isIntersecting && SECTION_SPEECH[id] && !spokenRef.current.has(id)) {
          spokenRef.current.add(id);
          window.speechSynthesis?.cancel();
          speak(SECTION_SPEECH[id], 1.15, 'male');
        }
      });
    }, { threshold: 0.35 });
    Object.keys(SECTION_SPEECH).forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [voiceOn]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Ir a una sección desde el menú: se vuelve a montar su contenido y la animación de entrada se repite
  const [replay, setReplay] = useState<Record<string, number>>({});
  const goTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setReplay(r => ({ ...r, [id]: (r[id] ?? 0) + 1 }));
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <ReplayContext.Provider value={replay}>
    <MotionConfig reducedMotion="user">
      {/* overflow-x-clip (no hidden): hidden rompe el position: sticky del navbar */}
      <div className="min-h-screen overflow-x-clip bg-paper text-ink">

        {/* ── NAV ── */}
        <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              {isFromApp && (
                <button onClick={() => navigate(-1)} className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-paper-2 cursor-pointer bg-transparent">
                  ← Volver
                </button>
              )}
              <a href="#top" className="flex items-center gap-2 no-underline">
                <motion.img src="/imgs/Logo-Gesto.png" alt="" className="h-8 w-8 object-contain"
                  initial={{ opacity: 0, scale: 0.6, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.6, ease: EASE }} />
                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
                  className="font-display text-xl font-bold text-ink">Gesto</motion.span>
              </a>
            </div>
            <ul className="hidden lg:flex items-center gap-6 list-none m-0 p-0 text-sm font-medium">
              {[['producto', 'Producto'], ['fiados', 'Fiados'], ['en-vivo', 'En vivo'], ['voz', 'Voz e IA'], ['planes', 'Planes'], ['preguntas', 'Preguntas']].map(([id, label]) => (
                <li key={id}><a href={`#${id}`} onClick={e => goTo(e, id)} className="text-ink-2 no-underline hover:text-ink">{label}</a></li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <button onClick={toggleVoice} aria-pressed={voiceOn} title={voiceOn ? 'Silenciar a Gesto' : 'Escuchar a Gesto'}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium cursor-pointer transition-colors ${voiceOn ? 'border-teal bg-teal-soft text-teal-dark' : 'border-line bg-white text-ink-2 hover:text-ink'}`}>
                {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span className="hidden lg:inline">{voiceOn ? 'Voz activada' : 'Voz'}</span>
              </button>
              <a href={APP_LOGIN_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:inline px-3 py-2 text-sm font-medium text-ink-2 no-underline hover:text-ink">Ingresar</a>
              <PrimaryButton className="px-4 py-2 text-sm">Probar gratis</PrimaryButton>
            </div>
          </nav>
        </header>

        <main id="top">

          {/* ── HERO ── (anima al cargar, no al hacer scroll) */}
          <div className="relative">
          <div aria-hidden="true" className="bg-aurora"><span className="a1" /><span className="a2" /><span className="a3" /></div>
          <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 lg:grid-cols-[1.05fr_1fr]">
            <Reveal group onLoad>
              <Item>
                <h1 className="font-display font-extrabold tracking-tight text-ink leading-[1.02] text-[2.6rem] sm:text-6xl">
                  El mostrador de tu negocio, <span className="text-teal">en orden.</span>
                </h1>
              </Item>
              <Item>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
                  Vendé y cobrá con efectivo, QR, transferencia o fiado. Llevá la caja y el stock al día, y mandá lo que te deben por WhatsApp con un clic. Desde la compu o el celular.
                </p>
              </Item>
              <Item className="mt-8 flex flex-wrap items-center gap-3">
                <PrimaryButton>Probar 60 días gratis <ArrowRight size={18} /></PrimaryButton>
                <a href={MANUAL_URL} download="gesto-manual-de-uso.pdf" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 font-semibold text-ink no-underline hover:bg-paper-2">
                  <Download size={18} /> Manual de uso
                </a>
              </Item>
              <Item><p className="mt-4 text-sm text-ink-3">Sin tarjeta. Apenas entrás, Gesto te guía paso a paso.</p></Item>
              <Item className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5 text-sm text-ink-2">
                <span className="text-ink-3">Cobrá con</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-ink"><MpIcon size={22} /> Mercado Pago</span>
                <span className="inline-flex items-center gap-1.5"><Landmark size={16} className="text-teal" /> Transferencia</span>
                <span className="inline-flex items-center gap-1.5"><Banknote size={16} className="text-teal" /> Efectivo</span>
                <span className="inline-flex items-center gap-1.5"><WhatsAppGlyph size={15} className="text-[#25D366]" /> Fiados por WhatsApp</span>
              </Item>
              <Item>
                <button onClick={toggleVoice} className="mt-5 inline-flex items-center gap-2 bg-transparent border-none p-0 text-sm font-medium text-teal cursor-pointer hover:text-teal-dark">
                  {voiceOn ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  {voiceOn ? 'Silenciar a Gesto' : 'Escuchar a Gesto mientras recorrés la página'}
                </button>
              </Item>
            </Reveal>
            <motion.div initial={{ opacity: 0, x: 40, rotate: 1.5 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: 0.8, delay: 0.25, ease: EASE }}>
              <PosScreen />
            </motion.div>
          </section>
          </div>

          {/* ── RUBROS ── */}
          <section className="border-y border-line bg-paper-2/60">
            <Reveal group className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6 py-5 text-sm">
              <Item className="font-semibold text-ink">Pensado para</Item>
              {RUBROS.map(r => <Item key={r} className="text-ink-2">{r}</Item>)}
            </Reveal>
          </section>

          {/* ── PRODUCTO ── */}
          <section id="producto" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 scroll-mt-16">
            <Replay id="producto">
            <Reveal group className="max-w-2xl mb-16">
              <Item><Eyebrow>Lo que hace Gesto</Eyebrow></Item>
              <Item><H2>Todo lo del día a día, en una sola pantalla.</H2></Item>
            </Reveal>

            <div className="space-y-20 sm:space-y-28">
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <Reveal group>
                  <Item><h3 className="font-display text-2xl font-bold mb-3">Cobrá como te paguen</h3></Item>
                  <Item><p className="text-ink-2 leading-relaxed mb-5">Escaneás, elegís el medio de pago y listo. Si el cliente paga una parte en efectivo y otra por QR, también.</p></Item>
                  <ul className="m-0 list-none space-y-3 p-0 text-ink">
                    {([
                      [<MpIcon key="mp" size={22} />, 'QR de Mercado Pago por venta o fijo en el mostrador, con aviso al instante'],
                      [<Landmark key="t" size={18} className="text-teal" />, 'Transferencia directa a tu CBU o alias, sin comisión'],
                      [<Banknote key="e" size={18} className="text-teal" />, 'Efectivo con vuelto calculado'],
                      [<Split key="s" size={18} className="text-teal" />, 'Pago dividido: una parte en efectivo y el resto por QR'],
                      [<PauseCircle key="p" size={18} className="text-teal" />, 'Ventas en espera: atendés a otro y volvés sin perder nada'],
                    ] as [React.ReactNode, string][]).map(([icon, t]) => (
                      <ItemLi key={t} className="flex items-start gap-3"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">{icon}</span>{t}</ItemLi>
                    ))}
                  </ul>
                </Reveal>
                <Reveal group className="grid grid-cols-2 gap-3 lg:ml-8">
                  {([
                    [ScanBarcode, 'Lector USB', 'o la cámara del celular'],
                    [Scale, 'Por peso', 'verdura, fiambre, carne'],
                    [MonitorSmartphone, 'Varias cajas', 'cada una en su equipo'],
                    [NotebookPen, 'Fiado', 'con límite por cliente'],
                  ] as const).map(([Icon, a, b]) => (
                    <Item key={a} className="rounded-xl border border-line bg-white p-4 transition-shadow hover:shadow-md">
                      <Icon size={22} className="mb-3 text-orange" />
                      <div className="font-semibold text-ink">{a}</div>
                      <div className="text-sm text-ink-3">{b}</div>
                    </Item>
                  ))}
                </Reveal>
              </div>

              <div className="grid items-center gap-10 lg:grid-cols-2">
                <Reveal group className="lg:order-2">
                  <Item><h3 className="font-display text-2xl font-bold mb-3">La caja cierra, y sabés por qué</h3></Item>
                  <Item><p className="text-ink-2 leading-relaxed mb-5">Abrís con el monto inicial, cargás ingresos y retiros, y al cerrar contás los billetes con el contador. Gesto te dice cuánto debería haber y cuánto entró por cada medio.</p></Item>
                  <Item><p className="text-sm text-ink-3">Con el plan Profesional: cierre a ciegas (quien cuenta no ve el total esperado) e historial de cierres en PDF.</p></Item>
                </Reveal>
                <Reveal className="lg:order-1 lg:mr-8"><CashScreen /></Reveal>
              </div>

              <div className="grid items-center gap-10 lg:grid-cols-2">
                <Reveal group>
                  <Item><h3 className="font-display text-2xl font-bold mb-3">Stock sin cuaderno</h3></Item>
                  <Item><p className="text-ink-2 leading-relaxed mb-5">Escaneás un código y, si está entre los más de 37.000 productos que Gesto ya conoce, se completan nombre y marca. Vos ponés precio y cantidad. Se descuenta solo con cada venta, por unidad o por kilo.</p></Item>
                  <Item><p className="text-ink-2 leading-relaxed">Definís un mínimo por producto y te avisa antes de que se termine.</p></Item>
                </Reveal>
                <Reveal className="lg:ml-8"><StockScreen /></Reveal>
              </div>
            </div>
            </Replay>
          </section>

          {/* ── FIADOS ── */}
          <section id="fiados" className="bg-teal-soft/60 scroll-mt-16">
            <Replay id="fiados">
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 py-20 sm:py-28 lg:grid-cols-2">
              <Reveal group>
                <Item>
                  <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#128C7E' }}>
                    <WhatsAppGlyph size={18} /> Fiados por WhatsApp
                  </p>
                </Item>
                <Item><H2>Lo que te deben, claro y por WhatsApp.</H2></Item>
                <Item><p className="mt-5 text-lg text-ink-2 leading-relaxed">Cada cliente tiene su cuenta con lo que llevó y lo que pagó. Con un clic, Gesto arma el mensaje con el detalle y el total, y abre WhatsApp listo para mandar.</p></Item>
                <ul className="m-0 mt-6 list-none space-y-2.5 p-0">
                  {['Límite de crédito por cliente', 'Aviso de deudas con más de 30 días', 'Cuando paga, queda registrado y le podés confirmar'].map(t => (
                    <ItemLi key={t} className="flex gap-3"><Check size={18} className="mt-0.5 flex-shrink-0 text-teal" />{t}</ItemLi>
                  ))}
                </ul>
              </Reveal>
              <Reveal><WhatsAppMessage /></Reveal>
            </div>
            </Replay>
          </section>

          {/* ── EN VIVO + VOZ E IA (bloque oscuro) ── */}
          <div className="relative bg-ink text-white">
            <div aria-hidden="true" className="bg-glow"><span className="g1" /><span className="g2" /></div>
            <div aria-hidden="true" className="bg-dots" />

            <section id="en-vivo" className="relative scroll-mt-16">
              <Replay id="en-vivo">
              <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 py-20 sm:py-28 lg:grid-cols-2">
                <Reveal group>
                  <Item><p className="mb-3 text-sm font-semibold text-teal-soft/80">En tiempo real</p></Item>
                  <Item><H2 className="text-white">Varias cajas, una sola cuenta.</H2></Item>
                  <Item><p className="mt-5 text-lg leading-relaxed text-white/70">Abrí una caja en la compu del mostrador y otra en el celular. Cada venta, cada pago y cada movimiento de stock se ve al instante en todos lados.</p></Item>
                  <ul className="m-0 mt-6 list-none space-y-3 p-0 text-white/85">
                    <ItemLi className="flex items-start gap-3"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-white"><MpIcon size={18} /></span>Cuando Mercado Pago aprueba un QR, la caja lo marca cobrado sola.</ItemLi>
                    <ItemLi className="flex items-start gap-3"><MonitorSmartphone size={20} className="mt-0.5 flex-shrink-0 text-teal-soft" />Funciona en el navegador: no hay que instalar nada.</ItemLi>
                    <ItemLi className="flex items-start gap-3"><Bell size={20} className="mt-0.5 flex-shrink-0 text-orange" />Avisos de stock bajo y de fiados atrasados en el inicio.</ItemLi>
                  </ul>
                </Reveal>
                <Reveal group className="space-y-4">
                  <Item><DevicesView /></Item>
                  <Item><LiveFeed /></Item>
                </Reveal>
              </div>
              </Replay>
            </section>

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6"><div className="h-px bg-white/10" /></div>

            <section id="voz" className="relative scroll-mt-16">
              <Replay id="voz">
              <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 py-20 sm:py-28 lg:grid-cols-2">
                <Reveal group>
                  <Item><p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-orange"><Mic size={16} /> Comandos de voz</p></Item>
                  <Item><H2 className="mb-5 text-white">Con las manos ocupadas, hablale.</H2></Item>
                  <Item><p className="mb-6 leading-relaxed text-white/70">Decís "Gesto" y le pedís lo que necesitás: agregar al carrito, cobrar, fiar, cargar un producto o consultar un precio.</p></Item>
                  <Item><VoiceConsole /></Item>
                </Reveal>
                <Reveal group>
                  <Item><p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-soft/80"><Sparkles size={16} /> Chat con IA</p></Item>
                  <Item><H2 className="mb-5 text-white">Preguntale a tu negocio.</H2></Item>
                  <Item><p className="mb-6 leading-relaxed text-white/70">Responde con tus números reales: qué se vende más, qué no sale, cuánto entró por cada medio y quién te debe.</p></Item>
                  {/* Las burbujas del chat entran de a una, como una conversación */}
                  <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.45, delayChildren: 0.4 } } }}
                    className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm">
                    <Item className="ml-auto w-fit max-w-[85%] rounded-lg bg-teal px-3 py-2 text-white">¿Cuánto me deben en fiados y quién hace más que no paga?</Item>
                    <Item className="max-w-[92%] rounded-lg bg-white/[0.06] px-3 py-2.5 leading-relaxed text-white/80">
                      Tenés <strong className="text-white">$ 48.200</strong> en fiados. De eso, <strong className="text-orange">$ 12.800</strong> tiene más de 30 días y es de 3 clientes; el más atrasado es Carlos R. (42 días). Este mes ya recuperaste <strong className="text-emerald-300">$ 31.500</strong>.
                    </Item>
                    <Item className="ml-auto w-fit max-w-[85%] rounded-lg bg-teal px-3 py-2 text-white">¿Qué productos no se están vendiendo?</Item>
                    <Item className="max-w-[92%] rounded-lg bg-white/[0.06] px-3 py-2.5 leading-relaxed text-white/80">
                      En los últimos 30 días no salieron 9 productos. Los que más plata tienen parada: aceite de oliva 500 ml (12 u) y café molido 250 g (8 u).
                    </Item>
                  </motion.div>
                  <Item><p className="mt-4 text-sm text-white/50">Voz y chat con IA incluidos en la prueba gratis y en el plan Profesional.</p></Item>
                </Reveal>
              </div>
              </Replay>
            </section>
          </div>

          {/* ── PRIMEROS PASOS ── */}
          <section id="primeros-pasos" className="border-t border-line bg-paper-2/60 scroll-mt-16">
            <Replay id="primeros-pasos">
            <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 py-20 sm:py-28 lg:grid-cols-[1fr_1.3fr]">
              <Reveal group>
                <Item><Eyebrow>Primeros pasos</Eyebrow></Item>
                <Item><H2>No arrancás solo.</H2></Item>
                <Item><p className="mt-5 text-ink-2 leading-relaxed">Apenas entrás, Gesto te lleva a cada pantalla y te marca qué tocar. Si querés, te lo explica en voz alta. Tu avance queda guardado: si cortás, seguís donde quedaste.</p></Item>
                <Item>
                  <a href={MANUAL_URL} download="gesto-manual-de-uso.pdf" className="mt-6 inline-flex items-center gap-2 font-semibold text-teal no-underline hover:text-teal-dark">
                    <Download size={18} /> Descargar el manual de uso (PDF)
                  </a>
                </Item>
              </Reveal>
              <Reveal group>
                <ol className="list-none m-0 p-0">
                  {GUIDE_STEPS.map(([title, desc], i) => (
                    <ItemLi key={title} className="flex gap-5 border-b border-line py-5 last:border-b-0">
                      <span className="font-display text-2xl font-bold text-orange tabular-nums w-6 flex-shrink-0">{i + 1}</span>
                      <div>
                        <div className="font-semibold text-ink">{title}</div>
                        <div className="text-ink-2 text-[0.95rem] leading-relaxed">{desc}</div>
                      </div>
                    </ItemLi>
                  ))}
                </ol>
              </Reveal>
            </div>
            </Replay>
          </section>

          {/* ── PLANES ── */}
          <section id="planes" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 scroll-mt-16">
            <Replay id="planes">
            <Reveal group className="max-w-2xl mb-12">
              <Item><Eyebrow>Planes</Eyebrow></Item>
              <Item><H2>Probalo 60 días. Después, pagás mes a mes.</H2></Item>
              <Item><p className="mt-4 text-ink-2">Sin contrato ni permanencia. Pagás con Mercado Pago y cambiás de plan cuando quieras.</p></Item>
            </Reveal>
            <Reveal group className="grid gap-5 md:grid-cols-3">
              {PLANS.map(plan => (
                <Item key={plan.name} className="h-full">
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                    className={`flex h-full flex-col rounded-xl border bg-white p-6 transition-shadow hover:shadow-lg ${plan.featured ? 'border-teal ring-1 ring-teal' : 'border-line'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                      {plan.featured && <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-dark">Recomendado</span>}
                    </div>
                    <p className="mt-1 text-sm text-ink-3">{plan.note}</p>
                    <p className="mt-5 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold tabular-nums">{typeof plan.price === 'number' ? priceFormatter.format(plan.price) : plan.price}</span>
                      <span className="text-sm text-ink-3">{plan.period}</span>
                    </p>
                    <ul className="mt-5 flex-1 space-y-2.5 text-[0.95rem]">
                      {plan.features.map(f => (
                        <li key={f} className="flex gap-2.5"><Check size={17} className="mt-0.5 flex-shrink-0 text-teal" />{f}</li>
                      ))}
                    </ul>
                    <a href={APP_LOGIN_URL} target="_blank" rel="noopener noreferrer"
                      className={`mt-6 rounded-lg px-4 py-2.5 text-center font-semibold no-underline transition-colors ${plan.featured ? 'bg-teal text-white hover:bg-teal-dark' : 'border border-line text-ink hover:bg-paper-2'}`}>
                      {plan.cta}
                    </a>
                  </motion.div>
                </Item>
              ))}
            </Reveal>
            <Reveal>
              <p className="mt-6 text-sm text-ink-3">
                Próximamente: <strong className="font-semibold text-ink-2">IA + GPS Integral</strong> ({priceFormatter.format(50000)}/mes) con hasta 5 cajas, tu comercio en el mapa y recomendaciones de precios por email.
              </p>
            </Reveal>
            </Replay>
          </section>

          {/* ── PREGUNTAS ── */}
          <section id="preguntas" className="border-t border-line scroll-mt-16">
            <Replay id="preguntas">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 py-20 sm:py-28 lg:grid-cols-[1fr_1.6fr]">
              <Reveal group>
                <Item><H2>Preguntas frecuentes</H2></Item>
                <Item><p className="mt-4 text-ink-2">¿Te quedó alguna duda? Escribinos por WhatsApp y te respondemos nosotros, no un bot.</p></Item>
                <Item>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-semibold text-teal no-underline hover:text-teal-dark">
                    <WhatsAppGlyph size={18} /> 2622 51-7454
                  </a>
                </Item>
              </Reveal>
              <Reveal group className="divide-y divide-line border-y border-line">
                {FAQ.map(([q, a], i) => {
                  const open = openFaq === i;
                  return (
                    <Item key={q}>
                      <button onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}
                        className="flex w-full items-center justify-between gap-4 bg-transparent border-none py-4 text-left font-semibold text-ink cursor-pointer">
                        {q}
                        <ChevronDown size={18} className={`flex-shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                            <p className="m-0 pb-5 pr-8 text-ink-2 leading-relaxed">{a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Item>
                  );
                })}
              </Reveal>
            </div>
            </Replay>
          </section>

          {/* ── CTA FINAL ── */}
          <section className="bg-ink text-white">
            <Reveal group className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 py-16 sm:py-20 md:flex-row md:items-center md:justify-between">
              <Item>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Probalo en tu mostrador.</h2>
                <p className="mt-2 text-white/70">60 días gratis, sin tarjeta. Si no te sirve, no pagás nada.</p>
              </Item>
              <Item>
                <a href={APP_LOGIN_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 font-semibold text-ink no-underline hover:brightness-105">
                  Crear mi cuenta <ArrowRight size={18} />
                </a>
              </Item>
            </Reveal>
          </section>
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 py-8 text-sm text-ink-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <img src="/imgs/Logo-Gesto.png" alt="" className="h-6 w-6 object-contain" />
              <span className="font-display font-bold text-ink">Gesto</span>
              <span>· © {new Date().getFullYear()}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink-2 no-underline hover:text-ink"><WhatsAppGlyph size={14} /> 2622 51-7454</a>
              <a href="mailto:ortizmichel390@gmail.com" className="text-ink-2 no-underline hover:text-ink">ortizmichel390@gmail.com</a>
              <a href="https://www.clarusrock.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-ink-3 no-underline hover:text-ink-2">
                Sitio por <img src="/imgs/clarus_rock_logotipo_black_version.svg" alt="Clarus Rock" className="h-6 w-auto" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
    </ReplayContext.Provider>
  );
}
