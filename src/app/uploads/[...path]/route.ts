import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePathSegments = resolvedParams.path;
    if (!filePathSegments || filePathSegments.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    const requestedPath = path.join(process.cwd(), 'public', 'uploads', ...filePathSegments);

    // Sécurité: empêcher l'accès hors du dossier uploads
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!path.resolve(requestedPath).startsWith(uploadsDir)) {
      return new NextResponse('Access forbidden', { status: 403 });
    }

    if (!existsSync(requestedPath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const fileBuffer = await readFile(requestedPath);
    const ext = path.extname(requestedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Erreur lecture upload:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
