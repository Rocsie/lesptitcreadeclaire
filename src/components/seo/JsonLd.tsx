import React from 'react';

// Insère des données structurées schema.org dans la page.
// Le caractère "<" est neutralisé pour qu'un texte saisi dans l'administration
// ne puisse jamais fermer la balise script.
export default function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
