import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AccountClient from './AccountClient';
import { getSessionUser } from '@/lib/auth';
import { store } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Mon compte',
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/connexion?retour=/compte');

  // Uniquement les commandes de la personne connectée, sans les champs internes.
  const orders = (await store.getOrdersForUser(user)).map((order) => ({
    ...order,
    accessToken: undefined,
    adminNotes: undefined,
    paymentReference: undefined,
  }));

  return <AccountClient orders={orders} />;
}
