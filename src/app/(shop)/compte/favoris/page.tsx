import type { Metadata } from 'next';
import FavoritesClient from './FavoritesClient';
import { store } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Mes favoris',
  robots: { index: false },
};

export default async function FavoritesPage() {
  // Les favoris sont enregistrés dans le navigateur : la page reçoit le catalogue et filtre côté client.
  const products = await store.getVisibleProducts();
  return <FavoritesClient products={products} />;
}
