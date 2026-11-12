import React from 'react';
import OcDigitalLogo from './OcDigitalLogo';
import { SITE_MAKER } from '@/lib/site';

interface MadeByOcDigitalProps {
  /** Couleur du fond sous la signature (liseré du logo). */
  background?: string;
  /** Hauteur du logo, en pixels. */
  height?: number;
  className?: string;
}

// Signature du studio qui a réalisé le site : « Site réalisé par » suivi de son logo, avec un lien vers son site.
// Le lien garde l'origine de la visite (pas de "noreferrer") pour que le studio sache d'où elle vient.
export default function MadeByOcDigital({ background, height = 20, className = '' }: MadeByOcDigitalProps) {
  return (
    <a
      href={SITE_MAKER.url}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-2 transition-opacity hover:opacity-75 ${className}`}
    >
      <span>Site réalisé par</span>
      <OcDigitalLogo height={height} background={background} />
      <span className="sr-only">{SITE_MAKER.name} (nouvel onglet)</span>
    </a>
  );
}
