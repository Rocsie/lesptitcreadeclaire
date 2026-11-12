import Link from 'next/link';
import OctopusLogo from '@/components/brand/OctopusLogo';

export default function ShopNotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <OctopusLogo size={64} variant="plum" className="justify-center" />
      <h1 className="font-serif text-3xl font-bold text-dark">Cette page est introuvable</h1>
      <p className="text-sm text-muted">
        La création a peut-être été vendue ou retirée de la boutique, ou l&apos;adresse est incorrecte.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/boutique"
          className="px-8 py-3 min-h-[44px] inline-flex items-center justify-center rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Voir la boutique
        </Link>
        <Link
          href="/"
          className="px-8 py-3 min-h-[44px] inline-flex items-center justify-center rounded-full bg-rose-light hover:bg-rose-powder/40 text-plum text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
