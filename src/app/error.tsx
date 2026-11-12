'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="max-w-md text-center space-y-5">
        <h1 className="font-serif text-3xl font-bold text-dark">Un incident est survenu</h1>
        <p className="text-sm text-muted">
          La page n&apos;a pas pu s&apos;afficher. Réessayez : si le problème continue, contactez la boutique.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 min-h-[44px] inline-flex items-center justify-center rounded-full bg-plum hover:bg-plum-dark text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
