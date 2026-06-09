import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { speak } from '../services/speechService';
import { Footer } from '../components/Footer';
import { useServicePlan } from '../hooks';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.6, delay }} className={className}>
      {children}
    </motion.div>
  );
}

const TAG: Record<string, string> = {
  blue:   'text-blue-400 border-blue-400/30 bg-blue-400/[0.08]',
  cyan:   'text-cyan-400 border-cyan-400/30 bg-cyan-400/[0.08]',
  green:  'text-emerald-400 border-emerald-400/30 bg-emerald-400/[0.08]',
  purple: 'text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/[0.08]',
  orange: 'text-amber-400 border-amber-400/30 bg-amber-400/[0.08]',
  pink:   'text-rose-400 border-rose-400/30 bg-rose-400/[0.08]',
};

function Tag({ label, color }: { label: string; color: string }) {
  return <span className={`text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-full border ${TAG[color] ?? TAG.blue}`}>{label}</span>;
}

function Card({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' } : undefined}
      className={`rounded-2xl border border-white/[0.07] bg-gray-800/40 backdrop-blur-sm transition-all ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ tag, title, desc, tagColor = 'text-cyan-400' }: { tag: string; title: React.ReactNode; desc?: string; tagColor?: string }) {
  return (
    <div className="text-center mb-10 sm:mb-14">
      <div className={`text-[0.7rem] font-bold uppercase tracking-[0.18em] ${tagColor} mb-3`}>{tag}</div>
      <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black tracking-tight text-white leading-tight">{title}</h2>
      {desc && <p className="mt-3 text-slate-400 text-[0.9rem] sm:text-[0.95rem] max-w-lg mx-auto leading-relaxed">{desc}</p>}
    </div>
  );
}

function Divider() {
  return <div className="max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />;
}

const sectionScripts: Record<string, string> = {
  features: 'Yo tengo todo lo que necesitás en un solo lugar, punto de venta, inventario, cobros por WhatsApp, comandos de voz, y soy tu asistente de inteligencia artificial. Todo lo que necesitás para laburar tranquilo y sin vueltas.',
  whatsapp: '¿Cuánta plata perdés porque no podés cobrarle a los clientes a tiempo? Yo genero el mensaje de cobro en un clic y lo mandamos por WhatsApp al toque, tu cliente ve exactamente lo que debe, y vos cobrás más rápido. Así de simple.',
  voice: 'Imaginá manejar tu negocio entero sin tocar una sola tecla. Solo decime Gesto, y yo me encargo del resto, agregá productos, cobrá, creá stock y navegá entre secciones, todo con tu voz. Re cómodo para cuando tenés las manos ocupadas.',
  ai: 'No hace falta que seas contador ni que entiendas de marketing. Preguntame cualquier cosa sobre tus ventas, tu stock o tus deudas, y te doy el análisis al toque. Soy tu analista de negocios, disponible las veinticuatro horas.',
  inventory: 'Te doy control total del stock, productos por unidad o por peso, y te aviso cuando te quedás sin mercadería. Tengo más de treinta y siete mil productos listos para escanear. Nunca más te va a faltar nada en el mostrador.',
  pos: 'Con mi punto de venta cobrás al toque. Escaneás el código, elegís cómo cobrar y listo, efectivo, Mercado Pago, QR o fiado. Me adapto a como laburás vos, no al revés.',
  plans: 'Podés arrancar gratis hoy mismo, sin tarjeta ni compromisos. Y a medida que tu negocio crezca, yo crezco con vos.',
  cta: 'Dale, ¿qué esperás? Registrate ahora y empezá a gestionar tu comercio conmigo. Te aseguro que no te voy a fallar.',
};

export function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isFromApp = Boolean((location.state as { fromApp?: boolean } | null)?.fromApp);
  const { palette } = useServicePlan();

  // Canvas particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, animFrame: number;
    interface P { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }
    let particles: P[] = [];
    function resize() { W = canvas!.width = window.innerWidth; H = canvas!.height = window.innerHeight; }
    function mkP(): P { return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.2 + 0.4, alpha: Math.random() * 0.35 + 0.05, color: Math.random() > 0.5 ? '96,165,250' : '34,211,238' }; }
    function init() { particles = Array.from({ length: 80 }, mkP); }
    function loop() {
      ctx!.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) Object.assign(p, mkP());
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.color},${p.alpha})`; ctx!.fill();
      });
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) { ctx!.beginPath(); ctx!.moveTo(particles[i].x, particles[i].y); ctx!.lineTo(particles[j].x, particles[j].y); ctx!.strokeStyle = `rgba(96,165,250,${0.04 * (1 - d / 90)})`; ctx!.lineWidth = 0.5; ctx!.stroke(); }
      }
      animFrame = requestAnimationFrame(loop);
    }
    const onResize = () => { resize(); init(); };
    resize(); init(); loop();
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', onResize); };
  }, []);

  // Voice transcript
  useEffect(() => {
    const lines: [string, string][] = [
      ['Gesto, ', 'agregame 3 Coca Cola'],
      ['Gesto, ', 'cobrar en efectivo'],
      ['Gesto, ', 'fiar a María González'],
      ['Gesto, ', 'nuevo producto Yerba Taragüi'],
      ['Gesto, ', '¿cuánto sale el asado?'],
    ];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % lines.length;
      if (transcriptRef.current) {
        const [pre, hl] = lines[i];
        transcriptRef.current.innerHTML = `"${pre}<span style="color:#22d3ee;font-style:normal;font-weight:600">${hl}</span>"`;
      }
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (sectionScripts[id]) {
      window.speechSynthesis?.cancel();
      setTimeout(() => speak(sectionScripts[id], 1.22, 'male'), 600);
    }
  };

  // Narración introductoria al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      speak('Hola, soy Gesto. El sistema de gestión que tu comercio necesitaba. Estoy acá para que labures menos y vendas más, para que tengas todo controlado desde un solo lugar, y nunca más pierdas plata por no tener el inventario al día. Dale, mirá todo lo que puedo hacer por vos.', 1.22, 'male');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Narración por sección al hacer scroll
  useEffect(() => {
    const scripts = sectionScripts;

    const spoken = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const id = (e.target as HTMLElement).id;
        if (e.isIntersecting && id && scripts[id] && !spoken.has(id)) {
          spoken.add(id);
          window.speechSynthesis?.cancel();
          setTimeout(() => speak(scripts[id], 1.22, 'male'), 400);
        }
      });
    }, { threshold: 0.4 });

    const ids = Object.keys(scripts);
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(160deg,#0f172a 0%,#0c1a2e 40%,#0f172a 100%)', color: '#e2e8f0', fontFamily: "'Segoe UI',system-ui,-apple-system,sans-serif" }}>

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-60" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(96,165,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,1) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 lg:px-10 xl:px-12 py-3 border-b border-white/[0.06]"
        style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          {isFromApp && (
            <motion.button onClick={() => navigate(-1)} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-semibold border cursor-pointer border-blue-500/40 text-blue-400"
              style={{ background: 'rgba(59,130,246,0.1)' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11L4 7l5-4" /></svg>
              Volver
            </motion.button>
          )}
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br ${palette.logoGradient} rounded-xl flex items-center justify-center shadow-lg`}
            >
              <img src="/imgs/Logo-Gesto.png" alt="Gesto" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold text-shimmer">Gesto</h1>
              <p className="text-xs text-slate-200">e-Commerce Interno</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-shimmer">Gesto</h1>
            </div>
          </div>
        </div>

        <ul className="hidden lg:flex gap-6 xl:gap-8 list-none m-0 p-0 items-center">
          {[['features','Funciones'],['whatsapp','WhatsApp'],['voice','Voz & IA'],['pos','POS'],['plans','Planes']].map(([id, label]) => (
            <li key={id}><button onClick={() => scrollTo(id)} className="text-slate-400 hover:text-white text-[0.85rem] font-medium transition-colors bg-transparent border-none cursor-pointer">{label}</button></li>
          ))}
          <li>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate('/admin-login')}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white border border-blue-500/40"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
              Empezar ahora
            </motion.button>
          </li>
        </ul>

        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin-login')}
          className="lg:hidden px-4 py-1.5 rounded-xl text-[0.8rem] font-semibold text-white border border-blue-500/40"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
          Empezar
        </motion.button>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-5 sm:px-8 lg:px-12 xl:px-16 pt-24 sm:pt-32 pb-16">
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(29,78,216,0.18) 0%,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(8,145,178,0.15) 0%,transparent 70%)', filter: 'blur(60px)' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-wider mb-6 border border-blue-500/30 text-blue-300"
          style={{ background: 'rgba(29,78,216,0.12)' }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="hidden sm:inline">Sistema de gestión inteligente para comercios</span>
          <span className="sm:hidden">Gestión inteligente para comercios</span>
        </motion.div>

        <motion.img
          src="/imgs/Logo-Gesto.png"
          alt="Gesto"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="object-contain mb-4 drop-shadow-2xl"
          style={{ width: 'clamp(80px,12vw,130px)', height: 'clamp(80px,12vw,130px)' }}
        />

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="font-black leading-[1.05] tracking-tight mb-5" style={{ fontSize: 'clamp(2.5rem,7vw,5.5rem)' }}>
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">El comercio</span><br />
          <span className="text-white">del futuro,</span><br />
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">hoy.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 max-w-xl leading-relaxed mb-8 text-[0.95rem] sm:text-base lg:text-lg">
          Gesto transforma cualquier negocio en una operación de alto rendimiento. Punto de venta, inventario inteligente, cobranzas por WhatsApp, voz y asistente de IA — todo en una sola plataforma.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="flex gap-3 flex-wrap justify-center mb-12">
          <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(29,78,216,0.5)' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/admin-login')}
            className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base text-white border-none cursor-pointer shadow-lg"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
            Comenzar gratis
          </motion.button>
          <motion.button whileHover={{ borderColor: 'rgba(96,165,250,0.5)', color: '#93c5fd' }} onClick={() => scrollTo('features')}
            className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-slate-300 bg-transparent border border-white/10 cursor-pointer transition-colors">
            Ver funciones
          </motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          {[['4','Métodos de pago'],['∞','Productos'],['IA','Asistente incluido'],['0%','Código requerido']].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{num}</div>
              <div className="text-[0.7rem] text-slate-500 uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-24">
        <Reveal>
          <SectionTitle tag="Todo en uno" title={<>Cada herramienta que<br />tu negocio <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">necesita</span></>} desc="Diseñado para comercios reales: almacenes, verdulerías, carnicerías, panaderías y más." />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Mercado Pago — ancho col-span-2 */}
          <Reveal className="sm:col-span-2 lg:col-span-2">
            <Card className="p-6 sm:p-8 h-full border-sky-500/20">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/40 backdrop-blur-sm border border-white/30 p-2">
                  <img src="/imgs/Logotipo_de_Mercado_Pago_alternativo.webp" alt="Mercado Pago" className="w-full object-contain" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white mb-2">Mercado Pago Integrado</div>
                  <div className="text-[0.88rem] text-slate-400 leading-relaxed mb-4">QR dinámico por transacción, QR estático imprimible y cobro por efectivo. Confirmación de pago en tiempo real sin salir de Gesto.</div>
                  <div className="flex flex-wrap gap-1.5">{[['QR dinámico','blue'],['QR estático','cyan'],['Efectivo','green']].map(([t,c]) => <Tag key={t} label={t} color={c} />)}</div>
                </div>
              </div>
            </Card>
          </Reveal>

          {/* Asistente IA — tall row-span-2 */}
          <Reveal className="sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <Card className="p-6 sm:p-7 h-full border-fuchsia-500/20 flex flex-col">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 bg-fuchsia-900/40 border border-fuchsia-700/30">🤖</div>
              <div className="text-lg font-bold text-white mb-3">Asistente de IA</div>
              <div className="text-[0.88rem] text-slate-400 leading-relaxed flex-1 mb-5">La IA que conoce tu negocio. Hoy todos usan IA, pero ninguna sabe el día a día de tu comercio. Gesto sí. Tu contador, analista de marketing e inventarista en uno. Hacé preguntas en lenguaje natural sobre ventas, deudas, stock y tendencias. Disponible las 24 horas.</div>
              <div className="flex flex-wrap gap-1.5">{[['Groq AI','purple'],['Análisis','cyan'],['Marketing','green'],['Contador','blue']].map(([t,c]) => <Tag key={t} label={t} color={c} />)}</div>
            </Card>
          </Reveal>

          {/* WhatsApp — ancho col-span-2 */}
          <Reveal className="sm:col-span-2 lg:col-span-2">
            <Card className="p-6 sm:p-8 h-full border-emerald-500/20">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/20 backdrop-blur-sm border border-white/20">
                  <WhatsAppIcon sx={{ fontSize: 32, color: '#22c55e' }} />
                </div>
                <div>
                  <div className="text-lg font-bold text-white mb-2">Cobros por WhatsApp</div>
                  <div className="text-[0.88rem] text-slate-400 leading-relaxed mb-4">Generá automáticamente mensajes de cobro con resumen de deuda e historial de pagos. Un solo clic y el mensaje llega directo al cliente.</div>
                  <div className="flex flex-wrap gap-1.5">{[['Auto-mensaje','green'],['Historial','blue'],['1 click','cyan']].map(([t,c]) => <Tag key={t} label={t} color={c} />)}</div>
                </div>
              </div>
            </Card>
          </Reveal>

          {/* Cards normales */}
          {[
            { icon: '🛒', title: 'Punto de Venta Ultrarrápido', desc: 'Procesá ventas con escáner láser, cámara QR o búsqueda por nombre. Carrito inteligente en tiempo real.', tags: [['Escáner','cyan'],['Cámara QR','blue'],['Tiempo real','green']] },
            { icon: '📦', title: 'Inventario Inteligente', desc: 'Control de stock por unidad o por peso. Alertas de stock mínimo y secciones especializadas.', tags: [['Peso / unidad','green'],['Alertas','orange'],['Secciones','blue']] },
            { icon: '🎤', title: 'Control por Voz', desc: 'Decí "Gesto" y manejá carrito, inventario, cobros y navegación completamente manos libres.', tags: [['Manos libres','cyan'],['Pro / Enterprise','purple']] },
            { icon: '📊', title: 'Dashboard en Tiempo Real', desc: 'Ventas del día, caja, deudas vencidas, stock bajo y recupero de fiados de un vistazo.', tags: [['Diario','orange'],['Fiados','cyan'],['Alertas','green']] },
            { icon: '⏸️', title: 'Ventas en Espera', desc: 'Pausá la venta, atendé otro cliente y volvé. Guardado automático para no perder nada.', tags: [['Multipago','blue'],['Auto-guardado','green']] },
          ].map(({ icon, title, desc, tags }, i) => (
            <Reveal key={title} delay={i * 0.04}>
              <Card className="p-5 sm:p-6 h-full">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-blue-900/40 border border-blue-700/30">{icon}</div>
                <div className="text-base font-bold text-white mb-2">{title}</div>
                <div className="text-[0.83rem] text-slate-400 leading-relaxed mb-4">{desc}</div>
                <div className="flex flex-wrap gap-1.5">{tags.map(([t, c]) => <Tag key={t} label={t} color={c} />)}</div>
              </Card>
            </Reveal>
          ))}

          {/* Próximamente */}
          <Reveal>
            <Card className="p-5 sm:p-6 h-full border-amber-500/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[0.6rem] font-extrabold uppercase tracking-wider text-gray-900 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400">Próximamente</div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-amber-900/30 border border-amber-700/30">🧾</div>
              <div className="text-base font-bold text-white mb-2">Mis Compras & Facturas</div>
              <div className="text-[0.83rem] text-slate-400 leading-relaxed mb-4">Escaneá facturas de proveedores y Gesto actualiza el stock con OCR. Sin carga manual.</div>
              <div className="flex flex-wrap gap-1.5">{[['OCR','orange'],['Stock auto','orange'],['Proveedores','blue']].map(([t, c]) => <Tag key={t} label={t} color={c} />)}</div>
            </Card>
          </Reveal>

        </div>
      </section>

      <Divider />

      {/* ── WHATSAPP ── */}
      <section id="whatsapp" className="relative z-10 px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-24">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal className="flex justify-center order-first lg:order-none">
            <div className="w-[260px] sm:w-[280px] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl" style={{ background: '#0d1117' }}>
              <div className="flex justify-between px-5 pt-3 pb-1.5 text-[0.62rem] text-slate-500 bg-slate-900/80"><span>9:41</span><span>▮▮▮ 📶 🔋</span></div>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#075e54]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-700 text-sm flex-shrink-0">👤</div>
                <div><div className="text-[0.82rem] font-semibold text-white">María González</div><div className="text-[0.62rem] text-emerald-200/70">en línea</div></div>
              </div>
              <div className="px-3 py-3 flex flex-col gap-2.5 min-h-[320px] bg-[#0b1a17]">
                <div className="rounded-xl rounded-bl-sm p-3 max-w-[90%] text-[0.7rem] leading-relaxed text-white/85 border-l-[2px] border-emerald-500 bg-[#1a3a30]">
                  <div className="flex items-center gap-1 text-[0.62rem] font-bold text-emerald-400 mb-1"><WhatsAppIcon sx={{ fontSize: 11 }} /> Gesto — Resumen de cuenta</div>
                  <div className="font-bold text-white text-[0.78rem] mb-1">Hola María 👋</div>
                  <div className="text-[0.65rem] text-white/50 mb-2">Estado de cuenta actualizado:</div>
                  {[['05 May','$2.800',false],['12 May','$1.500',false],['18 May Pago','-$2.000',true],['28 May','$3.200',false]].map(([d,v,paid]) => (
                    <div key={String(d)} className="flex justify-between py-0.5 border-b border-white/[0.05] text-[0.65rem]"><span className="text-white/60">{String(d)}</span><span style={{ color: paid ? '#34d399' : '#f87171', fontWeight: 700 }}>{String(v)}</span></div>
                  ))}
                  <div className="flex justify-between mt-1.5 text-[0.68rem] font-bold text-white"><span>Total adeudado:</span><span className="text-red-400">$5.500</span></div>
                  <div className="text-right text-[0.58rem] text-white/30 mt-1">10:32 ✓✓</div>
                </div>
                <div className="self-end rounded-xl rounded-br-sm px-3 py-2 max-w-[80%] text-[0.7rem] text-white/85 bg-[#005c4b]">
                  Gracias! Paso mañana 😊<div className="text-right text-[0.58rem] text-white/30 mt-0.5">10:45 ✓✓</div>
                </div>
                <div className="rounded-xl rounded-bl-sm p-3 max-w-[90%] text-[0.7rem] text-white/85 border-l-[2px] border-emerald-500 bg-[#1a3a30]">
                  <div className="flex items-center gap-1 text-[0.62rem] font-bold text-emerald-400 mb-1"><WhatsAppIcon sx={{ fontSize: 11 }} /> Pago registrado</div>
                  Pago de <span className="text-emerald-400 font-bold">$5.500</span> recibido. Cuenta al día ✅
                  <div className="text-right text-[0.58rem] text-white/30 mt-1">16:20 ✓✓</div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-5 mb-5">
              <motion.div
                animate={{ boxShadow: ['0 0 20px rgba(34,197,94,0.3)','0 0 50px rgba(34,197,94,0.7)','0 0 20px rgba(34,197,94,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center flex-shrink-0 border border-emerald-500/30"
                style={{ background: 'linear-gradient(135deg,rgba(21,128,61,0.3),rgba(5,46,22,0.5))' }}
              >
                <WhatsAppIcon sx={{ fontSize: 52, color: '#22c55e' }} />
              </motion.div>
              <div>
                <div className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-emerald-400 mb-2">WhatsApp Integrado</div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Cobros que<br /><span className="text-emerald-400">funcionan</span></h2>
              </div>
            </div>
            <p className="text-slate-400 text-[0.9rem] leading-relaxed mb-5">Olvidáte de las anotaciones en cuaderno. Gesto genera automáticamente el mensaje de cobro perfecto con toda la información que el cliente necesita ver.</p>
            <ul className="flex flex-col gap-3">
              {[['Resumen detallado de deuda','Cada compra fiada con fecha, descripción y monto.'],['Historial de pagos','Muestra lo que ya pagó el cliente, generando confianza.'],['Total adeudado destacado','Sin ambigüedades, en un solo vistazo.'],['Un solo clic','El link de WhatsApp se abre con el mensaje listo para enviar.'],['Confirmación de pago','Cuando el cliente paga, podés avisarle automáticamente.'],['Límite de crédito','Definí cuánto puede deber cada persona.']].map(([b, r]) => (
                <li key={b} className="flex items-start gap-3 text-[0.88rem] text-slate-400">
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[0.62rem] text-emerald-400 flex-shrink-0 border border-emerald-500/30 bg-emerald-900/30">✓</div>
                  <div><strong className="text-slate-200">{b}</strong> — {r}</div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <Divider />

      {/* ── VOICE ── */}
      <section id="voice" className="relative z-10 max-w-[1100px] lg:max-w-[1200px] xl:max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal>
            <Card className="p-6 sm:p-8" hover={false}>
              <motion.div animate={{ boxShadow: ['0 0 15px rgba(34,211,238,0.3)','0 0 35px rgba(34,211,238,0.6)','0 0 15px rgba(34,211,238,0.3)'] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl sm:text-3xl relative bg-gradient-to-br from-blue-900/60 to-cyan-900/60 border border-cyan-500/30">
                🎤
                <motion.div animate={{ scale: [1,1.12,1], opacity: [0.3,0.08,0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-[-8px] rounded-full border border-cyan-400/20" />
                <motion.div animate={{ scale: [1,1.12,1], opacity: [0.2,0.05,0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute inset-[-18px] rounded-full border border-cyan-400/10" />
              </motion.div>
              <div className="flex justify-center items-center gap-1 h-8 mb-5">
                {[10,20,30,24,36,28,16,12,24,30].map((h, i) => (
                  <motion.div key={i} className="w-[3px] rounded-full bg-gradient-to-b from-blue-400 to-cyan-500" style={{ height: h }}
                    animate={{ scaleY: [0.35,1,0.35], opacity: [0.4,1,0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }} />
                ))}
              </div>
              <div ref={transcriptRef} className="text-center text-[0.82rem] text-slate-500 italic mb-5">
                "Gesto, <span style={{ color: '#22d3ee', fontStyle: 'normal', fontWeight: 600 }}>agregame 3 Coca Cola</span>"
              </div>
              <div className="flex flex-col gap-2">
                {[['"Gesto"',', sacame el pan'],['"Cobrar"',' en efectivo'],['"Fiar"',' a cliente'],['"Nuevo producto"',', Leche La Serenísima'],['"¿Cuánto sale"',' la harina?']].map(([kw, rest]) => (
                  <div key={String(kw)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.78rem] bg-blue-900/20 border border-blue-700/20">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0 bg-cyan-900/40 border border-cyan-700/30">🎤</div>
                    <span className="text-slate-400"><strong className="text-cyan-400">{kw}</strong>{rest}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-cyan-400 mb-3">Control por Voz</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-5">Trabajá con<br />las manos <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">libres</span></h2>
            <p className="text-slate-400 text-[0.9rem] leading-relaxed mb-7">La palabra "Gesto" activa el asistente. Operá el punto de venta, creá productos, navegá entre secciones y consultá precios — todo sin tocar la pantalla.</p>
            <div className="grid grid-cols-2 gap-3">
              {[['🛒','Carrito','Agregar, quitar y cobrar'],['📦','Inventario','Crear productos por voz'],['🗺️','Navegación','Moverse entre módulos'],['💰','Cobros','Efectivo, QR, fiado']].map(([icon, name, desc]) => (
                <motion.div key={String(name)} whileHover={{ borderColor: 'rgba(34,211,238,0.25)', background: 'rgba(14,116,144,0.12)' }} className="text-center p-3 sm:p-4 rounded-xl border border-white/[0.06] bg-slate-800/30 transition-all">
                  <div className="text-xl sm:text-2xl mb-1.5">{icon}</div>
                  <div className="text-[0.78rem] font-bold text-slate-200">{name}</div>
                  <div className="text-[0.68rem] text-slate-500 mt-1">{desc}</div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Divider />

      {/* ── AI ── */}
      <section id="ai" className="relative z-10 px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-24" style={{ background: 'linear-gradient(180deg,transparent,rgba(88,28,135,0.06),transparent)' }}>
        <div className="max-w-[1100px] lg:max-w-[1200px] xl:max-w-[1400px] mx-auto">
          <Reveal>
            <SectionTitle tag="Inteligencia Artificial" tagColor="text-fuchsia-400"
              title={<>Tu negocio,<br /><span className="bg-gradient-to-r from-fuchsia-400 to-blue-400 bg-clip-text text-transparent">más inteligente</span></>}
              desc="El asistente de IA de Gesto no es un chatbot genérico. Conoce tu inventario, tus ventas y tus clientes en tiempo real." />
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-start">
            <Reveal className="grid grid-cols-2 gap-3">
              {[['📦','Inventarista','Consultas de stock, disponibilidad y ubicación por sección.'],['🧮','Contador','Análisis de ventas, ingresos, deudas y métodos de pago.'],['📈','Marketing','Productos más vendidos, stock muerto y tendencias.'],['🏪','General','Salud global del negocio y resúmenes ejecutivos.']].map(([icon, name, desc]) => (
                <Card key={String(name)} className="p-4 sm:p-5">
                  <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
                  <div className="text-[0.85rem] font-bold text-white mb-1">{name}</div>
                  <div className="text-[0.75rem] text-slate-500 leading-relaxed">{desc}</div>
                </Card>
              ))}
            </Reveal>
            <Reveal delay={0.1}>
              <Card className="overflow-hidden" hover={false}>
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/[0.06] bg-fuchsia-900/20">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-fuchsia-600 to-blue-600 flex-shrink-0">✨</div>
                  <div><div className="text-[0.88rem] font-bold text-white">Gesto IA</div><div className="text-[0.65rem] text-emerald-400">● En línea</div></div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  <div className="self-end max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2.5 text-[0.78rem] text-white/85 bg-fuchsia-900/30 border border-fuchsia-700/25">¿Cuáles fueron mis productos más vendidos esta semana?</div>
                  <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2.5 text-[0.78rem] text-slate-300 leading-relaxed bg-blue-900/20 border border-blue-700/20">
                    <div className="text-[0.6rem] font-bold uppercase tracking-wider text-fuchsia-400 mb-1.5">📈 Modo Marketing</div>
                    Top 3 de la semana:<br /><br />
                    <span className="text-cyan-400 font-bold">1.</span> Coca-Cola 2L — 47 uds<br />
                    <span className="text-cyan-400 font-bold">2.</span> Pan lactal — 38 uds<br />
                    <span className="text-cyan-400 font-bold">3.</span> Yerba Taragüi — 29 uds<br /><br />
                    Bebidas = 34% del total 💡
                  </div>
                  <div className="self-end max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2.5 text-[0.78rem] text-white/85 bg-fuchsia-900/30 border border-fuchsia-700/25">¿Cuánto me deben en fiados?</div>
                  <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2.5 text-[0.78rem] text-slate-300 leading-relaxed bg-blue-900/20 border border-blue-700/20">
                    <div className="text-[0.6rem] font-bold uppercase tracking-wider text-fuchsia-400 mb-1.5">🧮 Modo Contador</div>
                    Deuda activa: <strong className="text-rose-400">$48.200</strong><br />
                    Vencida +30d: <strong className="text-amber-400">$12.800</strong> — 3 clientes<br />
                    Recupero del mes: <strong className="text-emerald-400">$31.500</strong> ✅
                  </div>
                </div>
                <div className="px-4 sm:px-5 py-3 border-t border-white/[0.06] flex items-center gap-2.5">
                  <div className="flex-1 rounded-xl px-3 py-2 text-[0.75rem] text-slate-600 border border-white/[0.06] bg-slate-800/30">Preguntá lo que quieras...</div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs bg-gradient-to-br from-fuchsia-600 to-blue-600 flex-shrink-0">➤</div>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── INVENTORY ── */}
      <section id="inventory" className="relative z-10 max-w-[1100px] lg:max-w-[1200px] xl:max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-24">
        <Reveal>
          <SectionTitle tag="Inventario" tagColor="text-emerald-400"
            title={<>Control total de<br />tu <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">stock</span></>}
            desc="Desde unidades simples hasta productos al peso con secciones especializadas." />
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
          <Reveal className="flex flex-col gap-3.5">
            {[['⚖️','Productos al Peso','Soporte nativo para verdulería, carnicería y panadería. Stock en gramos o kilos.'],['🏷️','Base de +37.000 productos','Escaneá el código de barras y los datos se completan solos. Solo agregás precio y stock.'],['🔔','Alertas de Stock Mínimo','Definí el umbral por producto. El dashboard te avisa antes de quedarte sin stock.'],['🎤','Carga por Voz','Dictale los datos del producto: nombre, sección, costo, precio y stock.']].map(([icon, title, desc]) => (
              <motion.div key={String(title)} whileHover={{ x: 4, borderColor: 'rgba(52,211,153,0.2)' }} className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-gray-800/30 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-emerald-900/40 border border-emerald-700/30">{icon}</div>
                <div><div className="text-[0.88rem] font-bold text-slate-200 mb-1">{title}</div><div className="text-[0.78rem] text-slate-500 leading-relaxed">{desc}</div></div>
              </motion.div>
            ))}
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="p-5 relative" hover={false}>
              <div className="absolute -top-3 right-4 text-[0.62rem] font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full bg-gradient-to-r from-blue-700 to-cyan-700">IA Integrada</div>
              <div className="text-[0.68rem] text-slate-600 uppercase tracking-widest mb-3">Stock actual</div>
              <div className="flex flex-col gap-2">
                {[['🥤','Coca-Cola 2.25L','48 ud','ok'],['🍞','Pan lactal Bimbo','⚠ 6 ud','low'],['🥩','Asado c/hueso','3.8 kg','ok'],['🥛','Leche La Serenísima','🔴 2 ud','critical'],['🌿','Verdura de hoja x kg','12.4 kg','ok'],['🧀','Queso cremoso x kg','⚠ 1.2 kg','low']].map(([emoji, name, stock, level]) => (
                  <div key={String(name)} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-slate-700/50">{emoji}</div>
                    <div className="flex-1 text-slate-300 text-[0.75rem] truncate">{name}</div>
                    <span className="text-[0.7rem] font-bold flex-shrink-0" style={{ color: level === 'ok' ? '#34d399' : level === 'low' ? '#fbbf24' : '#f87171' }}>{stock}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <Divider />

      {/* ── POS ── */}
      <section id="pos" className="relative z-10 max-w-[1200px] lg:max-w-[1400px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-24">
        <Reveal>
          <SectionTitle tag="Punto de Venta"
            title={<>Cobrar nunca fue<br />tan <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">rápido</span></>}
            desc="Un POS diseñado para la velocidad real de un comercio." />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[['⚡','Escáner instantáneo','Compatible con lectores láser USB y cámara del dispositivo.'],['💵','Efectivo','Cobro en efectivo con cálculo de vuelto automático y cierre de caja.'],['mp-qr','QR Dinámico','QR de Mercado Pago por transacción. Confirmación al instante.'],['mp-static','QR Estático','QR permanente imprimible para tu mostrador.'],['📝','Fiado / Crédito','Vendé a cuenta con límite por cliente y seguimiento de vencimientos.'],['🔄','Múltiples Cajas','Varias terminales desde una sola cuenta con contexto por caja.']].map(([icon, title, desc], i) => (
            <Reveal key={String(title)} delay={i * 0.04}>
              <Card className="p-5 sm:p-6 flex flex-col gap-3 h-full">
                <div className="text-3xl">
                  {icon === 'mp-qr' || icon === 'mp-static'
                    ? <img src="/imgs/logo-mercadopago-blanco.png" alt="Mercado Pago" className="h-6 object-contain" />
                    : icon}
                </div>
                <div className="text-base font-bold text-white">{title}</div>
                <div className="text-[0.82rem] text-slate-400 leading-relaxed">{desc}</div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── PLANS ── */}
      <section id="plans" className="relative z-10 px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-24" style={{ background: 'linear-gradient(180deg,transparent,rgba(29,78,216,0.05),transparent)' }}>
        <Reveal>
          <SectionTitle tag="Planes"
            title={<>Empezá gratis,<br />crecé sin <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">límites</span></>}
            desc="Desde el primer mostrador hasta la cadena de locales." />
        </Reveal>
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              name: 'Plan Gratuito',
              badge: 'Para empezar',
              accentClass: 'from-emerald-500 to-green-600',
              featured: false,
              soon: false,
              features: ['2 cajas abiertas concurrentes','1 tienda / local','Soporte por email','Gesto IA: Asistente de voz en POS e Inventario','Chat IA: Ventas · Contador · Inventario · General'],
            },
            {
              name: 'Plan Esencial',
              badge: 'Acceso rápido',
              accentClass: 'from-sky-500 to-blue-600',
              featured: false,
              soon: false,
              features: ['2 cajas abiertas concurrentes','1 tienda / local','Acceso al panel','Gestión básica del negocio'],
            },
            {
              name: 'Plan Profesional',
              badge: 'Recomendado',
              accentClass: 'from-cyan-500 to-teal-600',
              featured: true,
              soon: false,
              features: ['Todo lo del plan anterior','Gesto IA: Asistente de voz en POS e Inventario','Chat IA: Ventas · Contador · Inventario · General','Gestión centralizada','Cobro online seguro'],
            },
            {
              name: 'Plan IA + GPS Integral',
              badge: 'IA + GPS',
              accentClass: 'from-indigo-500 to-violet-600',
              featured: false,
              soon: true,
              features: ['Todo lo del plan anterior','Asistente IA de Voz completo','Comercio visible en mapa global','Recomendaciones de precios por email'],
            },
          ].map(({ name, badge, accentClass, featured, soon, features }) => (
            <Reveal key={name}>
              {soon ? (
                <motion.div whileHover={{ y: -4 }} className="relative flex flex-col rounded-2xl border border-indigo-500/20 bg-slate-800/40 p-5 sm:p-6 h-full overflow-hidden">
                  <div className="flex justify-end mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
                      <Sparkles size={11} /> Próximamente
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-4 gap-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
                      <Sparkles size={28} className="text-white" />
                    </div>
                    <p className="text-center text-xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent leading-tight">
                      IA GLOBAL<br />Y MAPA
                    </p>
                    <p className="text-center text-xs text-slate-500 max-w-[180px]">Comercio visible en mapa global con recomendaciones de precios y stock por IA.</p>
                  </div>
                  <div className={`mt-auto rounded-xl bg-gradient-to-r ${accentClass} px-4 py-3 text-center text-sm font-bold text-white opacity-50`}>
                    Próximamente disponible
                  </div>
                </motion.div>
              ) : (
                <motion.div whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                  className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 h-full transition-all bg-slate-800/40 ${featured ? 'border-cyan-500/40' : 'border-white/[0.08]'}`}>
                  {featured && (
                    <div className="-mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-4 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-[11px] font-black uppercase tracking-widest py-2 rounded-t-2xl">
                      <CheckCircle2 size={12} /> {badge}
                    </div>
                  )}
                  {name === 'Plan Gratuito' && (
                    <div className="-mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-4 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[11px] font-black uppercase tracking-widest py-2 rounded-t-2xl">
                      <CheckCircle2 size={12} /> Plan inicial 60 días
                    </div>
                  )}
                  {!featured && name !== 'Plan Gratuito' && (
                    <span className="self-start mb-3 rounded-xl bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-300">{badge}</span>
                  )}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{name}</h3>
                  <div className="flex-1 space-y-2 mb-5">
                    {features.map(f => (
                      <div key={f} className="flex items-start gap-2 text-[0.78rem] sm:text-sm text-slate-300">
                        <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-auto rounded-xl bg-gradient-to-r ${accentClass} px-4 py-3 text-center text-sm font-bold text-white`}>
                    {name === 'Plan Gratuito' ? 'Empezar gratis' : `Elegir ${name}`}
                  </div>
                </motion.div>
              )}
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="relative z-10 px-5 sm:px-8 lg:px-12 xl:px-16 py-20 sm:py-28 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse,rgba(29,78,216,0.12) 0%,transparent 70%)', filter: 'blur(40px)' }} />
        <Reveal>
          <h2 className="font-black leading-tight tracking-tight text-white mb-5" style={{ fontSize: 'clamp(2rem,5vw,3.8rem)' }}>
            ¿Listo para el<br />
            <span className="inline-block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent pr-1">próximo nivel?</span>
          </h2>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed mb-10 text-[0.9rem] sm:text-base">Gesto es la herramienta que tu comercio necesitaba. Empezá gratis hoy y transformá la forma en que trabajás.</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(29,78,216,0.5)' }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/admin-login')}
              className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base text-white cursor-pointer shadow-lg border-none"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
              Empezar gratis
            </motion.button>
            <motion.button whileHover={{ borderColor: 'rgba(96,165,250,0.5)', color: '#93c5fd' }} onClick={() => scrollTo('features')}
              className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-slate-400 bg-transparent border border-white/10 cursor-pointer transition-colors">
              Ver funciones
            </motion.button>
          </div>
        </Reveal>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
