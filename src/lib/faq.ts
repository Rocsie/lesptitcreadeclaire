import { formatPrice } from './paths';
import type { PublicSettings } from './types';

export interface FaqEntry {
  question: string;
  answer: string;
}

// Questions fréquentes de la boutique. Les réponses reprennent les réglages réels
// (frais de port, seuil de gratuité, retrait) et les conditions générales de vente :
// elles se mettent à jour toutes seules quand l'administration change.
export function buildFaq(settings: PublicSettings): FaqEntry[] {
  const faq: FaqEntry[] = [
    {
      question: 'Où se trouve la boutique, et peut-on venir sur place ?',
      answer:
        "L'atelier-boutique L'Atelier se trouve à Port-la-Nouvelle (11210), dans l'Aude. Vous pouvez y découvrir les créations et échanger avec Claire aux horaires d'ouverture indiqués sur cette page.",
    },
  ];

  if (settings.pickupEnabled) {
    faq.push({
      question: 'Le retrait en boutique est-il gratuit ?',
      answer:
        'Oui. Choisissez « Retrait en boutique » au moment de commander : le retrait est gratuit et un email vous prévient dès que votre commande est prête.',
    });
  }

  faq.push({
    question: 'Quels sont les frais et les délais de livraison ?',
    answer:
      settings.freeShippingThreshold > 0
        ? `Les commandes sont expédiées en Colissimo suivi sous 48 h ouvrées, en France métropolitaine. La livraison coûte ${formatPrice(settings.shippingPrice)} et elle est offerte dès ${formatPrice(settings.freeShippingThreshold)} d'achat.`
        : `Les commandes sont expédiées en Colissimo suivi sous 48 h ouvrées, en France métropolitaine. La livraison coûte ${formatPrice(settings.shippingPrice)}.`,
  });

  if (settings.paymentMode === 'stripe') {
    faq.push({
      question: 'Le paiement en ligne est-il sécurisé ?',
      answer:
        'Le paiement se fait par carte bancaire sur la page sécurisée de Stripe. Vos données bancaires ne passent jamais par notre site.',
    });
  }

  faq.push(
    {
      question: 'Les bijoux sont-ils vraiment faits main ?',
      answer:
        "Oui. Chaque création est imaginée et réalisée à la main par Claire dans son atelier de Port-la-Nouvelle, en pièce unique ou en petite série. De légères nuances d'une pièce à l'autre font partie du travail artisanal.",
    },
    {
      question: 'Peut-on commander une création sur mesure ?',
      answer:
        'Oui, Claire réalise des créations personnalisées. Décrivez votre projet dans le formulaire de contact : couleurs, occasion, budget. Elle vous répondra par email.',
    },
    {
      question: 'Puis-je retourner un bijou ?',
      answer:
        'Vous disposez de 14 jours après réception pour changer d’avis, sauf pour les créations personnalisées réalisées sur mesure. Écrivez-nous depuis cette page pour organiser le retour.',
    },
    {
      question: 'Comment entretenir mes bijoux ?',
      answer:
        "Conservez-les dans leur pochon ou leur écrin, à l'abri de l'humidité. Évitez le contact avec le parfum, l'eau de mer et les produits ménagers pour préserver l'éclat des dorures et des cristaux."
    }
  );

  return faq;
}
