import { NextResponse, after } from 'next/server';
import { errorResponse, readBody } from '@/lib/api';
import { clientIp, rateLimit, requireAdmin } from '@/lib/auth';
import { sendContactEmail } from '@/lib/mailer';
import { store } from '@/lib/store';

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json(await store.getContactMessages());
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);

    // Champ piège invisible : rempli uniquement par les robots. On répond "ok" sans rien enregistrer.
    if (body.honeypot || body.website) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (!rateLimit(`contact:${await clientIp()}`, 5, 60 * 60_000)) {
      return NextResponse.json(
        { error: 'Vous avez déjà envoyé plusieurs messages. Merci de réessayer un peu plus tard.' },
        { status: 429 }
      );
    }

    const created = await store.addContactMessage({
      name: String(body.name || ''),
      email: String(body.email || ''),
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      subject: String(body.subject || ''),
      message: String(body.message || ''),
    });
    after(() => sendContactEmail(created));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Erreur lors de l'envoi du message.");
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readBody(request);
    const ok = await store.setContactMessageRead(String(body.id || ''), Boolean(body.read));
    if (!ok) return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la mise à jour du message.');
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
  const ok = await store.deleteContactMessage(id);
  if (!ok) return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
