import { NextResponse } from 'next/server';
import { mkdir, readdir, stat, unlink, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/paths';
import { IMAGE_TYPES, MIME_BY_EXT, UPLOAD_DIR, isSafeFileName, sniffImageType } from '@/lib/uploads';

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const formData = await request.formData();
    const files = formData.getAll('file').filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier sélectionné.' }, { status: 400 });
    }
    if (files.length > 12) {
      return NextResponse.json({ error: 'Envoyez 12 photos au maximum à la fois.' }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `La photo ${file.name} est trop lourde (10 Mo maximum).` },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      // Le format est lu dans le fichier lui-même : un fichier renommé en .jpg ne passe pas.
      const type = sniffImageType(buffer);
      if (!type || !IMAGE_TYPES[type]) {
        return NextResponse.json(
          { error: `Le fichier ${file.name} n'est pas une image JPG, PNG, WEBP, GIF ou AVIF.` },
          { status: 400 }
        );
      }

      const base = slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 40) || 'photo';
      const fileName = `${base}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}${IMAGE_TYPES[type].ext}`;
      await writeFile(path.join(UPLOAD_DIR, fileName), buffer);
      uploadedUrls.push(`/uploads/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error('[upload] envoi impossible', error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de la photo." }, { status: 500 });
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const names = await readdir(UPLOAD_DIR);
    const files: Array<{ name: string; url: string; size: number; updatedAt: string }> = [];
    for (const name of names) {
      if (!MIME_BY_EXT[path.extname(name).toLowerCase()]) continue;
      try {
        const info = await stat(path.join(UPLOAD_DIR, name));
        files.push({ name, url: `/uploads/${name}`, size: info.size, updatedAt: info.mtime.toISOString() });
      } catch {
        // fichier supprimé entre-temps
      }
    }
    files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return NextResponse.json({ files, urls: files.map((f) => f.url) });
  } catch (error) {
    console.error('[upload] lecture du dossier impossible', error);
    return NextResponse.json({ error: 'Erreur de lecture des photos.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const name = new URL(request.url).searchParams.get('name') || '';
  if (!isSafeFileName(name) || !MIME_BY_EXT[path.extname(name).toLowerCase()]) {
    return NextResponse.json({ error: 'Nom de fichier invalide.' }, { status: 400 });
  }
  try {
    await unlink(path.join(UPLOAD_DIR, name));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });
  }
}
