// Fabrique les icônes du site et l'image de partage sur les réseaux à partir du logo.
// À relancer uniquement si le logo ou la photo d'accueil changent :
//   node scripts/generate-brand-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const PLUM = '#6E2D4A';
const ROSE = '#E8B4B8';
const GOLD = '#D4AF37';
const CREAM = '#FDFBF7';

// Même dessin que le composant OctopusLogo.
const octopus = (stroke) => `
  <line x1="28" y1="28" x2="20" y2="24" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
  <line x1="72" y1="28" x2="80" y2="24" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
  <line x1="50" y1="12" x2="50" y2="6" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
  <path d="M 50 18 C 30 18 26 34 26 48 C 26 55 30 62 36 64 C 40 65 44 65 50 65 C 56 65 60 65 64 64 C 70 62 74 55 74 48 C 74 34 70 18 50 18 Z" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M 39 42 Q 43 45 47 42" stroke="${stroke}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M 53 42 Q 57 45 61 42" stroke="${stroke}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M 50 49 C 48 46 44 47 44 50 C 44 53 50 56 50 56 C 50 56 56 53 56 50 C 56 47 52 46 50 49 Z" fill="${ROSE}" stroke="${stroke}" stroke-width="1.2"/>
  <path d="M 28 58 C 22 62 16 70 18 78 C 20 84 27 82 26 76 C 25 71 32 68 36 67" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <path d="M 36 65 C 32 72 30 82 36 86 C 41 89 45 82 43 76 C 42 70 45 67 48 66" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <path d="M 64 65 C 68 72 70 82 64 86 C 59 89 55 82 57 76 C 58 70 55 67 52 66" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <path d="M 72 58 C 78 62 84 70 82 78 C 80 84 73 82 74 76 C 75 71 68 68 64 67" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;

// Icône : la pieuvre sur un fond crème arrondi, lisible même en 16 pixels.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="${CREAM}"/>
  <g transform="translate(50 50) scale(1.08) translate(-50 -47)">${octopus(PLUM)}</g>
</svg>`;

const write = (rel, data) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log(`${rel} (${Math.round(data.length / 1024)} Ko)`);
};

const png = (size) => sharp(Buffer.from(iconSvg), { density: 600 }).resize(size, size).png().toBuffer();

// Un .ico peut contenir directement des images PNG : en-tête, table, puis les fichiers.
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

write('src/app/icon.svg', Buffer.from(iconSvg));
write('src/app/apple-icon.png', await png(180));
write('public/images/icone-512.png', await png(512));
write(
  'src/app/favicon.ico',
  buildIco([
    { size: 16, data: await png(16) },
    { size: 32, data: await png(32) },
    { size: 48, data: await png(48) },
  ])
);

// Image de partage (1200 x 630) : la photo d'accueil, un voile prune et le nom de la boutique.
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="voile" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4E1B32" stop-opacity="0.94"/>
      <stop offset="0.55" stop-color="#6E2D4A" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#6E2D4A" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#voile)"/>
  <g transform="translate(70 70) scale(1.5)">${octopus('#FDFBF7')}</g>
  <text x="80" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="#FDFBF7">Les P'tites Créa de Claire</text>
  <text x="80" y="400" font-family="Georgia, 'Times New Roman', serif" font-size="38" fill="#F8E8EA">Bijoux artisanaux faits main</text>
  <rect x="80" y="440" width="120" height="4" rx="2" fill="${GOLD}"/>
  <text x="80" y="510" font-family="Arial, Helvetica, sans-serif" font-size="28" letter-spacing="6" fill="#FDFBF7">BOUTIQUE L'ATELIER · PORT-LA-NOUVELLE</text>
</svg>`;

const share = await sharp(path.join(root, 'public/images/hero-atelier.jpg'))
  .resize(1200, 630, { fit: 'cover', position: 'right' })
  .composite([{ input: Buffer.from(overlay) }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer();
write('public/images/partage.jpg', share);
