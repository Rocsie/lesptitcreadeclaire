import nodemailer, { type Transporter } from 'nodemailer';
import { store } from './store';
import { SITE_NAME, absoluteUrl, escapeHtml as esc } from './site';
import { formatPrice } from './paths';
import type { ContactMessage, Order, OrderStatus } from './types';

// Envoi des emails transactionnels.
// Sans SMTP configuré dans le .env, rien n'est envoyé : chaque email est quand même
// inscrit dans le journal (Administration > Paramètres) avec le statut "non envoyé".

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass || pass.startsWith('votre_')) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  return { host, port, user, pass };
}

export function isSmtpConfigured(): boolean {
  return smtpConfig() !== null;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const config = smtpConfig();
  if (!config) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

function fromAddress(): string {
  return process.env.SMTP_FROM || `"${SITE_NAME}" <${process.env.SMTP_USER}>`;
}

async function adminRecipient(): Promise<string | null> {
  const fromEnv = process.env.ADMIN_EMAIL;
  if (fromEnv && fromEnv.includes('@')) return fromEnv;
  const cms = await store.getCmsSettings();
  return cms.contact_email || null;
}

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  replyTo?: string;
}

/** Envoie un email et l'inscrit au journal. Ne lève jamais d'erreur. */
async function send(mail: Mail): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    await store.addEmailLog({
      recipient: mail.to,
      subject: mail.subject,
      template: mail.template,
      status: 'NOT_CONFIGURED',
    });
    return;
  }
  try {
    await transport.sendMail({
      from: fromAddress(),
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo,
    });
    await store.addEmailLog({ recipient: mail.to, subject: mail.subject, template: mail.template, status: 'SENT' });
  } catch (err) {
    console.error(`[mail] échec de l'envoi "${mail.subject}"`, err);
    await store.addEmailLog({
      recipient: mail.to,
      subject: mail.subject,
      template: mail.template,
      status: 'FAILED',
      error: err instanceof Error ? err.message.slice(0, 300) : 'Erreur inconnue',
    });
  }
}

// ---------------------------------------------------------------------------
// Mise en page commune
// ---------------------------------------------------------------------------

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:24px 12px;background:#FAF6F0;font-family:Helvetica,Arial,sans-serif;color:#2D2327;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #F3D8DA;border-radius:16px;">
    <tr>
      <td style="padding:24px 28px 8px;border-bottom:2px solid #6E2D4A;">
        <div style="font-size:18px;font-weight:bold;color:#6E2D4A;">${esc(SITE_NAME)}</div>
        <div style="font-size:12px;color:#695D62;padding-bottom:12px;">Boutique L'Atelier, Port-la-Nouvelle</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;font-size:14px;line-height:1.6;">
        <h1 style="font-size:20px;margin:0 0 16px;color:#2D2327;">${esc(title)}</h1>
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 24px;font-size:12px;color:#695D62;border-top:1px solid #F3D8DA;">
        ${esc(SITE_NAME)} · <a href="${esc(absoluteUrl('/'))}" style="color:#6E2D4A;">${esc(absoluteUrl('/').replace(/^https?:\/\//, ''))}</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #F3ECE1;">
          <strong>${esc(item.productName)}</strong>${item.variantTitle ? `<br><span style="color:#C87D88;font-size:12px;">${esc(item.variantTitle)}</span>` : ''}
        </td>
        <td style="padding:8px;border-bottom:1px solid #F3ECE1;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #F3ECE1;text-align:right;white-space:nowrap;">${esc(formatPrice(item.totalPrice))}</td>
      </tr>`
    )
    .join('');

  const line = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;${bold ? 'font-weight:bold;' : 'color:#695D62;'}">${esc(label)}</td><td style="padding:4px 0;text-align:right;white-space:nowrap;${bold ? 'font-weight:bold;color:#6E2D4A;' : ''}">${esc(value)}</td></tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin:12px 0;">
    ${rows}
    ${line('Sous-total', formatPrice(order.subtotal))}
    ${order.discountAmount > 0 ? line(`Réduction${order.promoCode ? ` (${order.promoCode})` : ''}`, `-${formatPrice(order.discountAmount)}`) : ''}
    ${line('Livraison', order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Offerte')}
    ${line('Total TTC', formatPrice(order.total), true)}
  </table>`;
}

function itemsText(order: Order): string {
  const lines = order.items.map(
    (item) =>
      `- ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''} x ${item.quantity} : ${formatPrice(item.totalPrice)}`
  );
  if (order.discountAmount > 0) lines.push(`Réduction : -${formatPrice(order.discountAmount)}`);
  lines.push(`Livraison : ${order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'offerte'}`);
  lines.push(`Total TTC : ${formatPrice(order.total)}`);
  return lines.join('\n');
}

function deliveryHtml(order: Order): string {
  if (order.shippingMethod === 'pickup') {
    return `<p style="margin:12px 0;"><strong>Retrait en boutique</strong><br>Boutique L'Atelier, 11210 Port-la-Nouvelle. Vous recevrez un email dès que votre commande sera prête.</p>`;
  }
  const a = order.shippingAddress || {};
  return `<p style="margin:12px 0;"><strong>Livraison Colissimo</strong><br>
    ${esc(a.name || `${order.customerFirstName} ${order.customerLastName}`)}<br>
    ${esc(a.address1 || '')}${a.address2 ? `<br>${esc(a.address2)}` : ''}<br>
    ${esc(a.postalCode || '')} ${esc(a.city || '')}</p>`;
}

function deliveryText(order: Order): string {
  if (order.shippingMethod === 'pickup') {
    return "Retrait en boutique : Boutique L'Atelier, 11210 Port-la-Nouvelle.";
  }
  const a = order.shippingAddress || {};
  return `Livraison Colissimo : ${a.address1 || ''}${a.address2 ? `, ${a.address2}` : ''}, ${a.postalCode || ''} ${a.city || ''}`;
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

/** Confirmation à la cliente + avis de nouvelle commande à la boutique. */
export async function sendOrderEmails(order: Order): Promise<void> {
  const simulated = order.paymentMethod === 'simulation';
  const note = simulated
    ? '<p style="margin:12px 0;padding:10px 12px;background:#FAF4E5;border-radius:8px;font-size:12px;">Commande passée en mode démonstration : aucun paiement n\'a été prélevé.</p>'
    : '';

  await send({
    to: order.customerEmail,
    template: 'ORDER_CONFIRMATION',
    subject: `Confirmation de votre commande ${order.orderNumber}`,
    html: layout(
      `Merci ${order.customerFirstName}, votre commande est enregistrée`,
      `<p style="margin:0 0 12px;">Commande <strong>${esc(order.orderNumber)}</strong> du ${esc(new Date(order.createdAt).toLocaleDateString('fr-FR'))}.</p>
       ${itemsTable(order)}${deliveryHtml(order)}${note}
       <p style="margin:16px 0 0;">À très bientôt,<br>Claire</p>`
    ),
    text: `Bonjour ${order.customerFirstName},\n\nVotre commande ${order.orderNumber} est enregistrée.\n\n${itemsText(order)}\n\n${deliveryText(order)}\n\nÀ très bientôt,\nClaire`,
  });

  const admin = await adminRecipient();
  if (!admin) return;
  await send({
    to: admin,
    template: 'ORDER_NOTIFICATION',
    replyTo: order.customerEmail,
    subject: `Nouvelle commande ${order.orderNumber} (${formatPrice(order.total)})`,
    html: layout(
      `Nouvelle commande ${order.orderNumber}`,
      `<p style="margin:0 0 12px;"><strong>${esc(order.customerFirstName)} ${esc(order.customerLastName)}</strong><br>
        ${esc(order.customerEmail)}${order.customerPhone ? `<br>${esc(order.customerPhone)}` : ''}</p>
       ${itemsTable(order)}${deliveryHtml(order)}
       ${order.customerNote ? `<p style="margin:12px 0;"><strong>Note de la cliente :</strong> ${esc(order.customerNote)}</p>` : ''}
       ${note}
       <p style="margin:16px 0 0;"><a href="${esc(absoluteUrl('/admin/commandes'))}" style="color:#6E2D4A;font-weight:bold;">Ouvrir les commandes</a></p>`
    ),
    text: `Nouvelle commande ${order.orderNumber}\n\n${order.customerFirstName} ${order.customerLastName}\n${order.customerEmail}\n${order.customerPhone || ''}\n\n${itemsText(order)}\n\n${deliveryText(order)}\n\n${absoluteUrl('/admin/commandes')}`,
  });
}

const STATUS_MAILS: Partial<Record<OrderStatus, { template: string; subject: (o: Order) => string; title: string; body: (o: Order) => string }>> = {
  CONFIRMED: {
    template: 'ORDER_CONFIRMED',
    subject: (o) => `Votre commande ${o.orderNumber} est validée`,
    title: 'Votre commande est validée',
    body: () => 'Claire a bien pris en charge votre commande et la prépare avec soin.',
  },
  READY_FOR_PICKUP: {
    template: 'ORDER_READY_FOR_PICKUP',
    subject: (o) => `Votre commande ${o.orderNumber} est prête à la boutique`,
    title: 'Votre commande vous attend',
    body: () => "Vous pouvez venir la retirer à la boutique L'Atelier, 11210 Port-la-Nouvelle, aux horaires d'ouverture.",
  },
  SHIPPED: {
    template: 'ORDER_SHIPPED',
    subject: (o) => `Votre commande ${o.orderNumber} est expédiée`,
    title: 'Votre colis est en route',
    body: (o) =>
      o.trackingNumber
        ? `Votre colis a été confié à Colissimo. Numéro de suivi : ${o.trackingNumber}.`
        : 'Votre colis a été confié à Colissimo.',
  },
  CANCELLED: {
    template: 'ORDER_CANCELLED',
    subject: (o) => `Votre commande ${o.orderNumber} est annulée`,
    title: 'Votre commande est annulée',
    body: () => 'Votre commande a été annulée. Pour toute question, répondez simplement à cet email.',
  },
  REFUNDED: {
    template: 'ORDER_REFUNDED',
    subject: (o) => `Votre commande ${o.orderNumber} est remboursée`,
    title: 'Votre commande est remboursée',
    body: () => 'Le remboursement de votre commande a été effectué. Il apparaîtra sur votre compte sous quelques jours.',
  },
};

/** Email envoyé à la cliente quand la boutique change le statut de sa commande. */
export async function sendOrderStatusEmail(order: Order): Promise<void> {
  const mail = STATUS_MAILS[order.status];
  if (!mail) return;
  const body = mail.body(order);
  const tracking =
    order.status === 'SHIPPED' && order.trackingNumber
      ? `<p style="margin:12px 0;"><a href="https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(order.trackingNumber)}" style="color:#6E2D4A;font-weight:bold;">Suivre mon colis</a></p>`
      : '';
  await send({
    to: order.customerEmail,
    template: mail.template,
    subject: mail.subject(order),
    html: layout(
      mail.title,
      `<p style="margin:0 0 12px;">Bonjour ${esc(order.customerFirstName)},</p>
       <p style="margin:0 0 12px;">${esc(body)}</p>${tracking}
       <p style="margin:0 0 12px;color:#695D62;">Commande ${esc(order.orderNumber)} · ${esc(formatPrice(order.total))}</p>
       <p style="margin:16px 0 0;">À très bientôt,<br>Claire</p>`
    ),
    text: `Bonjour ${order.customerFirstName},\n\n${body}\n\nCommande ${order.orderNumber} · ${formatPrice(order.total)}\n\nÀ très bientôt,\nClaire`,
  });
}

/** Transmet à la boutique un message du formulaire de contact. */
export async function sendContactEmail(message: ContactMessage): Promise<void> {
  const admin = await adminRecipient();
  if (!admin) return;
  await send({
    to: admin,
    template: 'CONTACT_MESSAGE',
    replyTo: message.email,
    subject: `Message du site : ${message.subject}`,
    html: layout(
      message.subject,
      `<p style="margin:0 0 12px;"><strong>${esc(message.name)}</strong><br>${esc(message.email)}${message.phone ? `<br>${esc(message.phone)}` : ''}</p>
       <p style="margin:0;white-space:pre-wrap;">${esc(message.message)}</p>`
    ),
    text: `${message.name}\n${message.email}\n${message.phone || ''}\n\n${message.message}`,
  });
}

/** Lien de réinitialisation du mot de passe, valable une heure. */
export async function sendPasswordResetEmail(to: string, firstName: string, token: string): Promise<void> {
  const link = `${absoluteUrl('/reinitialisation')}?jeton=${token}`;
  await send({
    to,
    template: 'PASSWORD_RESET',
    subject: 'Réinitialisation de votre mot de passe',
    html: layout(
      'Choisir un nouveau mot de passe',
      `<p style="margin:0 0 12px;">Bonjour ${esc(firstName)},</p>
       <p style="margin:0 0 12px;">Vous avez demandé à réinitialiser le mot de passe de votre compte. Ce lien est valable une heure :</p>
       <p style="margin:16px 0;"><a href="${esc(link)}" style="display:inline-block;padding:12px 22px;background:#6E2D4A;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:bold;">Choisir un nouveau mot de passe</a></p>
       <p style="margin:0;color:#695D62;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : votre mot de passe reste inchangé.</p>`
    ),
    text: `Bonjour ${firstName},

Pour choisir un nouveau mot de passe (lien valable une heure) :
${link}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  });
}
