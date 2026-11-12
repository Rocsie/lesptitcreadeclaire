import { readFile } from 'fs/promises';
import path from 'path';
import { MIME_BY_EXT, UPLOAD_DIR, isSafeFileName } from '@/lib/uploads';

// Sert les photos ajoutées après la mise en production :
// "next start" ne connaît que les fichiers de public/ présents au moment du build.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path || [];
  const name = segments.length === 1 ? segments[0] : '';
  const contentType = MIME_BY_EXT[path.extname(name).toLowerCase()];

  if (!isSafeFileName(name) || !contentType) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const file = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
