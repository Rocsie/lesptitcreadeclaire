import path from 'path';

// Les photos envoyées depuis l'administration sont rangées dans public/uploads.
export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Formats acceptés. Le SVG est exclu : il peut contenir du script.
export const IMAGE_TYPES: Record<string, { ext: string; mime: string }> = {
  'image/jpeg': { ext: '.jpg', mime: 'image/jpeg' },
  'image/png': { ext: '.png', mime: 'image/png' },
  'image/webp': { ext: '.webp', mime: 'image/webp' },
  'image/gif': { ext: '.gif', mime: 'image/gif' },
  'image/avif': { ext: '.avif', mime: 'image/avif' },
};

export const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

/** Reconnaît le vrai format d'un fichier à ses premiers octets, quel que soit son nom. */
export function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  const head = buffer.subarray(0, 4).toString('latin1');
  if (head === 'GIF8') return 'image/gif';
  if (head === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (buffer.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('latin1');
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
}

/** Nom de fichier sûr : pas de dossier, pas de caractère spécial. */
export function isSafeFileName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{0,120}$/i.test(name) && !name.includes('..');
}
