import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getLaunchChecklist } from '@/lib/launch-checklist';
import { isSmtpConfigured } from '@/lib/mailer';
import { isStripeConfigured, isStripeWebhookConfigured } from '@/lib/payment-mode';
import { absoluteUrl } from '@/lib/site';
import { store } from '@/lib/store';

// État des branchements techniques et contrôle de mise en ligne, affichés dans l'administration.
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [settings, emailLogs, checklist] = await Promise.all([
    store.getPublicSettings(),
    store.getEmailLogs(),
    getLaunchChecklist(),
  ]);

  return NextResponse.json({
    paymentMode: settings.paymentMode,
    stripeConfigured: isStripeConfigured(),
    stripeWebhookConfigured: isStripeWebhookConfigured(),
    stripeWebhookUrl: absoluteUrl('/api/stripe/webhook'),
    smtpConfigured: isSmtpConfigured(),
    emailLogs: emailLogs.slice(0, 40),
    checklist,
  });
}
