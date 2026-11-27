const fs = require('fs');
const path = require('path');

/**
 * Generates crisp, realistic-looking vector product preview cards (SVG)
 * in server/uploads/ so seeded items render cleanly out of the box offline.
 */
const SAMPLE_VISUALS = [
  {
    filename: 'sample-airpods.svg',
    bg1: '#eef2ff',
    bg2: '#e0e7ff',
    accent: '#4f46e5',
    label: 'Wireless Earbuds',
    sub: 'White Charging Case',
    shape: `
      <rect x="215" y="105" width="170" height="150" rx="38" fill="#ffffff" stroke="#c7d2fe" stroke-width="6"/>
      <line x1="218" y1="158" x2="382" y2="158" stroke="#cbd5e1" stroke-width="4"/>
      <rect x="278" y="150" width="44" height="14" rx="7" fill="#e2e8f0"/>
      <circle cx="300" cy="196" r="5" fill="#22c55e"/>
    `,
  },
  {
    filename: 'sample-idcard.svg',
    bg1: '#eff6ff',
    bg2: '#dbeafe',
    accent: '#2563eb',
    label: 'Campus ID Card',
    sub: 'B.Tech CSE · Lanyard',
    shape: `
      <path d="M275 55 L300 105 L325 55" fill="none" stroke="#1d4ed8" stroke-width="10" stroke-linecap="round"/>
      <rect x="200" y="105" width="200" height="155" rx="16" fill="#ffffff" stroke="#93c5fd" stroke-width="5"/>
      <rect x="200" y="105" width="200" height="36" rx="14" fill="#1d4ed8"/>
      <circle cx="252" cy="190" r="28" fill="#dbeafe"/>
      <rect x="295" y="168" width="84" height="12" rx="6" fill="#334155"/>
      <rect x="295" y="190" width="64" height="10" rx="5" fill="#94a3b8"/>
      <rect x="295" y="210" width="76" height="10" rx="5" fill="#cbd5e1"/>
    `,
  },
  {
    filename: 'sample-charger.svg',
    bg1: '#f8fafc',
    bg2: '#e2e8f0',
    accent: '#334155',
    label: '65W USB-C Charger',
    sub: 'Laptop Power Adapter',
    shape: `
      <rect x="220" y="110" width="130" height="130" rx="22" fill="#ffffff" stroke="#94a3b8" stroke-width="5"/>
      <rect x="350" y="152" width="42" height="14" rx="5" fill="#64748b"/>
      <rect x="350" y="182" width="42" height="14" rx="5" fill="#64748b"/>
      <path d="M220 175 C165 175 165 250 230 250 L360 250" fill="none" stroke="#475569" stroke-width="9" stroke-linecap="round"/>
      <circle cx="285" cy="175" r="18" fill="#e0e7ff"/>
    `,
  },
  {
    filename: 'sample-wallet.svg',
    bg1: '#fef3c7',
    bg2: '#fde68a',
    accent: '#92400e',
    label: 'Brown Leather Wallet',
    sub: 'Bi-Fold Card Holder',
    shape: `
      <rect x="190" y="115" width="220" height="138" rx="18" fill="#78350f" stroke="#451a03" stroke-width="4"/>
      <rect x="198" y="123" width="204" height="122" rx="13" fill="none" stroke="#b45309" stroke-width="2" stroke-dasharray="8 6"/>
      <rect x="342" y="166" width="72" height="36" rx="10" fill="#92400e" stroke="#451a03" stroke-width="3"/>
      <circle cx="364" cy="184" r="6" fill="#fbbf24"/>
    `,
  },
  {
    filename: 'sample-calculator.svg',
    bg1: '#ecfeff',
    bg2: '#cffafe',
    accent: '#0e7490',
    label: 'Casio fx-991EX',
    sub: 'Scientific Calculator',
    shape: `
      <rect x="225" y="82" width="150" height="196" rx="16" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
      <rect x="242" y="100" width="116" height="44" rx="6" fill="#cbd5e1"/>
      <rect x="244" y="160" width="24" height="18" rx="4" fill="#475569"/>
      <rect x="276" y="160" width="24" height="18" rx="4" fill="#475569"/>
      <rect x="308" y="160" width="24" height="18" rx="4" fill="#475569"/>
      <rect x="338" y="160" width="20" height="18" rx="4" fill="#0ea5e9"/>
      <rect x="244" y="188" width="24" height="18" rx="4" fill="#64748b"/>
      <rect x="276" y="188" width="24" height="18" rx="4" fill="#64748b"/>
      <rect x="308" y="188" width="24" height="18" rx="4" fill="#64748b"/>
      <rect x="338" y="188" width="20" height="18" rx="4" fill="#f97316"/>
      <rect x="244" y="216" width="24" height="18" rx="4" fill="#64748b"/>
      <rect x="276" y="216" width="24" height="18" rx="4" fill="#64748b"/>
      <rect x="308" y="216" width="50" height="18" rx="4" fill="#4f46e5"/>
    `,
  },
  {
    filename: 'sample-book.svg',
    bg1: '#f0fdf4',
    bg2: '#dcfce7',
    accent: '#15803d',
    label: 'DSA Textbook',
    sub: 'Cormen · Highlighted Notes',
    shape: `
      <rect x="208" y="88" width="184" height="186" rx="12" fill="#166534" stroke="#14532d" stroke-width="4"/>
      <rect x="208" y="88" width="28" height="186" rx="6" fill="#14532d"/>
      <rect x="252" y="116" width="118" height="22" rx="6" fill="#dcfce7"/>
      <rect x="252" y="150" width="90" height="12" rx="6" fill="#86efac"/>
      <rect x="252" y="174" width="104" height="12" rx="6" fill="#86efac"/>
      <rect x="252" y="216" width="60" height="28" rx="6" fill="#22c55e"/>
    `,
  },
  {
    filename: 'sample-bottle.svg',
    bg1: '#eef2ff',
    bg2: '#c7d2fe',
    accent: '#3730a3',
    label: 'Insulated Steel Bottle',
    sub: 'Matte Navy · 750ml',
    shape: `
      <rect x="276" y="72" width="48" height="28" rx="8" fill="#1e293b"/>
      <rect x="284" y="98" width="32" height="16" fill="#94a3b8"/>
      <rect x="258" y="112" width="84" height="162" rx="22" fill="#312e81" stroke="#1e1b4b" stroke-width="4"/>
      <rect x="270" y="144" width="12" height="100" rx="6" fill="#4f46e5" opacity="0.6"/>
    `,
  },
  {
    filename: 'sample-glasses.svg',
    bg1: '#fdf2f8',
    bg2: '#fce7f3',
    accent: '#be185d',
    label: 'Eyeglasses in Case',
    sub: 'Black Rectangular Frame',
    shape: `
      <rect x="195" y="146" width="88" height="58" rx="14" fill="#ffffff" fill-opacity="0.7" stroke="#0f172a" stroke-width="7"/>
      <rect x="317" y="146" width="88" height="58" rx="14" fill="#ffffff" fill-opacity="0.7" stroke="#0f172a" stroke-width="7"/>
      <path d="M283 170 Q300 158 317 170" fill="none" stroke="#0f172a" stroke-width="7"/>
      <line x1="175" y1="168" x2="195" y2="168" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <line x1="405" y1="168" x2="425" y2="168" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
    `,
  },
  {
    filename: 'sample-keys.svg',
    bg1: '#fffbeb',
    bg2: '#fef3c7',
    accent: '#b45309',
    label: 'Hostel Room Keys',
    sub: 'Blue Tag · 2 Brass Keys',
    shape: `
      <circle cx="265" cy="148" r="32" fill="none" stroke="#64748b" stroke-width="9"/>
      <rect x="288" y="168" width="96" height="22" rx="6" fill="#d97706"/>
      <rect x="352" y="190" width="10" height="16" fill="#d97706"/>
      <rect x="370" y="190" width="10" height="12" fill="#d97706"/>
      <rect x="215" y="182" width="54" height="72" rx="12" fill="#2563eb"/>
      <circle cx="242" cy="196" r="6" fill="#dbeafe"/>
    `,
  },
  {
    filename: 'sample-powerbank.svg',
    bg1: '#f1f5f9',
    bg2: '#cbd5e1',
    accent: '#0f172a',
    label: '20000mAh Power Bank',
    sub: 'Matte Black · Dual USB',
    shape: `
      <rect x="230" y="84" width="140" height="192" rx="22" fill="#0f172a" stroke="#334155" stroke-width="5"/>
      <circle cx="275" cy="126" r="5" fill="#38bdf8"/>
      <circle cx="292" cy="126" r="5" fill="#38bdf8"/>
      <circle cx="309" cy="126" r="5" fill="#38bdf8"/>
      <circle cx="326" cy="126" r="5" fill="#334155"/>
      <rect x="266" y="218" width="68" height="14" rx="7" fill="#334155"/>
    `,
  },
];

function generateSampleImages(uploadsDir) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const item of SAMPLE_VISUALS) {
    const filePath = path.join(uploadsDir, item.filename);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${item.bg1}" />
      <stop offset="100%" stop-color="${item.bg2}" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)" />
  <circle cx="90" cy="70" r="95" fill="#ffffff" fill-opacity="0.35" />
  <circle cx="520" cy="340" r="120" fill="#ffffff" fill-opacity="0.3" />
  ${item.shape}
  <text x="300" y="325" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="${item.accent}">${item.label}</text>
  <text x="300" y="352" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748b">${item.sub}</text>
</svg>`;
    fs.writeFileSync(filePath, svg, 'utf8');
  }
}

module.exports = { generateSampleImages };

