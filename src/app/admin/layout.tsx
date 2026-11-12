import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';
import { getSessionUser } from '@/lib/auth';
import { store } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

// L'accès est vérifié ici, côté serveur, avant d'afficher quoi que ce soit.
// Chaque route /api d'administration refait la même vérification de son côté.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/connexion?retour=/admin');
  if (user.role !== 'ADMIN') redirect('/compte');

  const unreadMessages = (await store.getContactMessages()).filter((m) => !m.read).length;

  return (
    <AdminShell userName={user.firstName} unreadMessages={unreadMessages}>
      {children}
    </AdminShell>
  );
}
