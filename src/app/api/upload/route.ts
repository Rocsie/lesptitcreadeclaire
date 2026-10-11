import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier sélectionné' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Vérification du type de fichier
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé : ${file.type}. Veuillez utiliser des images JPG, PNG, WEBP ou GIF.` },
          { status: 400 }
        );
      }

      // Limite 10 Mo
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Le fichier ${file.name} est trop volumineux (maximum 10 Mo).` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extension et nom propre
      const ext = path.extname(file.name) || '.jpg';
      const cleanBaseName = file.name
        .replace(ext, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);
      const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const fileName = `${cleanBaseName || 'bijou'}-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (error: any) {
    console.error('Erreur upload image:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement de l\'image: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { readdir, stat } = await import('fs/promises');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filenames = await readdir(uploadDir);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'];

    const imageFiles = [];
    for (const name of filenames) {
      const ext = path.extname(name).toLowerCase();
      if (validExtensions.includes(ext)) {
        try {
          const fileStat = await stat(path.join(uploadDir, name));
          imageFiles.push({
            name,
            url: `/uploads/${name}`,
            size: fileStat.size,
            updatedAt: fileStat.mtime.toISOString(),
          });
        } catch (e) {
          imageFiles.push({
            name,
            url: `/uploads/${name}`,
            size: 0,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Trier du plus récent au plus ancien
    imageFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      files: imageFiles,
      urls: imageFiles.map((f) => f.url),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lecture dossier upload' }, { status: 500 });
  }
}

