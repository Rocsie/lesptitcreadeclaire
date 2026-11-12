import React from 'react';
import Image from 'next/image';
import { withBase } from '@/lib/paths';

interface ShopImageProps {
  src: string | null | undefined;
  alt: string;
  /** Remplit le conteneur parent (qui doit être en position relative). */
  fill?: boolean;
  width?: number;
  height?: number;
  /** Largeur affichée selon l'écran, pour que le navigateur choisisse la bonne taille de fichier. */
  sizes?: string;
  /** À réserver à la grande image visible dès l'arrivée sur la page. */
  preload?: boolean;
  className?: string;
}

const FALLBACK = '/images/hero-atelier.jpg';

// Toutes les photos de la boutique passent par ce composant :
// - photos du site et photos envoyées depuis l'administration : redimensionnées et converties
//   en AVIF ou WebP par Next.js, chargées seulement quand elles approchent de l'écran ;
// - photos hébergées ailleurs (adresse https collée dans l'administration) : affichées telles quelles.
export default function ShopImage({ src, alt, fill, width, height, sizes, preload, className }: ShopImageProps) {
  const source = src || FALLBACK;

  if (/^https?:\/\//i.test(source)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={source}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={preload ? 'eager' : 'lazy'}
        decoding="async"
        className={fill ? `absolute inset-0 w-full h-full ${className || ''}` : className}
      />
    );
  }

  return (
    <Image
      src={withBase(source)}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      preload={preload}
      className={className}
    />
  );
}
