import Link from 'next/link';
import OctopusLogo from '@/components/brand/OctopusLogo';

// Adresse inconnue en dehors de la boutique (les pages boutique ont leur propre version avec en-tête et pied de page).
export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="max-w-md text-center space-y-5">
        <OctopusLogo size={64} variant="plum" className="justify-center" />
        <h1 className="font-serif text-3xl font-bold text-dark">Cette page est introuvable</h1>
        <p className="text-sm text-muted">L&apos;adresse saisie ne correspond à aucune page du site.</p>
        <Link
          href="/"
          className="px-8 py-3 min-h-[44px] inline-flex items-center justify-center rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
