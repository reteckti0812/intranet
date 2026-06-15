// Emoji por departamento — dá o "jeitão" colorido do Re-Teck AI Hub.
// Primeiro tenta por palavra-chave do nome; senão, escolhe um da lista por código/hash.
const KEYWORD_EMOJI: [RegExp, string][] = [
  [/compra|suprim|aquisi/i, "🛒"],
  [/financ|cont[áa]bil|fiscal|custo|tesour/i, "💰"],
  [/\brh\b|recursos human|pessoa|gente|depto pessoal/i, "👥"],
  [/qualidade|sgi|\biso\b/i, "✅"],
  [/\bti\b|tecnolog|sistema|inform[áa]tica|software/i, "💻"],
  [/produ[çc]|f[áa]brica|manufat|opera[çc]/i, "🏭"],
  [/log[íi]st|expedi|armaz|estoq|almox/i, "📦"],
  [/comercial|vendas|cliente/i, "🤝"],
  [/marketing|comunica[çc]/i, "📣"],
  [/jur[íi]d|legal|contrato|complian/i, "⚖️"],
  [/seguran[çc]a|\bsst\b|\bepi\b/i, "🛡️"],
  [/manuten[çc]|mec[âa]nic|el[ée]tric/i, "🔧"],
  [/ambient|sustent|recicl/i, "♻️"],
  [/diretoria|presid|governan|administra[çc]/i, "🏛️"],
  [/engenharia|projeto|t[ée]cnic/i, "📐"],
  [/laborat|an[áa]lise|qu[íi]mic/i, "🧪"],
  [/transp|frota|ve[íi]cul/i, "🚚"],
  [/sa[úu]de|enferm|m[ée]dic|ambulat/i, "🏥"],
  [/trein|capacit|educa[çc]/i, "🎓"],
];

const FALLBACK = ["📁", "📂", "🗂️", "📋", "📊", "🗃️", "📑", "🏢", "🗄️", "📌"];

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function deptEmoji(name: string, code?: string): string {
  const s = String(name || "");
  for (const [re, emoji] of KEYWORD_EMOJI) if (re.test(s)) return emoji;
  const num = parseInt(String(code || "").replace(/\D/g, ""), 10);
  const idx = Number.isFinite(num) ? num % FALLBACK.length : strHash(s) % FALLBACK.length;
  return FALLBACK[idx];
}
