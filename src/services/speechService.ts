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
