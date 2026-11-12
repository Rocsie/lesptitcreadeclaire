'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  AlertTriangle,
  Users,
  Tag,
  FileText,
  BarChart3,
  Settings,
  Store,
  LogOut,
  Clock,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import OctopusLogo from '@/components/brand/OctopusLogo';
import MadeByOcDigital from '@/components/brand/MadeByOcDigital';

const NAV_ITEMS = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Commandes', href: '/admin/commandes', icon: ShoppingBag },
  { label: 'Produits', href: '/admin/produits', icon: Package },
  { label: 'Catégories & Collections', href: '/admin/categories', icon: Layers },
  { label: 'Gestion des stocks', href: '/admin/stocks', icon: AlertTriangle },
  { label: 'Clientes', href: '/admin/clients', icon: Users },
  { label: 'Messages reçus', href: '/admin/messages', icon: MessageSquare },
  { label: 'Codes promotionnels', href: '/admin/promos', icon: Tag },
  { label: 'Contenu du site', href: '/admin/cms', icon: FileText },
  { label: "Horaires de l'atelier", href: '/admin/horaires', icon: Clock },
  { label: 'Statistiques', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Paramètres & emails', href: '/admin/parametres', icon: Settings },
];

const PAYMENT_BADGES = {
  stripe: { label: 'Paiement par carte actif', dot: 'bg-emerald-500', box: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  simulation: { label: 'Mode démonstration : aucun paiement réel', dot: 'bg-amber-500', box: 'text-amber-800 bg-amber-50 border-amber-200' },
  disabled: { label: 'Commande en ligne fermée', dot: 'bg-red-500', box: 'text-red-700 bg-red-50 border-red-200' },
};

export default function AdminShell({
  userName,
  unreadMessages,
  children,
}: {
  userName: string;
  unreadMessages: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { paymentMode } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const badge = PAYMENT_BADGES[paymentMode];

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    router.push('/connexion');
    router.refresh();
  };

  const navLinks = (mobile: boolean) =>
    NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;
      const count = item.href === '/admin/messages' ? unreadMessages : 0;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex items-center gap-3 px-3.5 rounded-xl text-xs font-semibold transition-colors ${
            mobile ? 'py-3 min-h-[44px]' : 'py-2.5'
          } ${isActive ? 'bg-plum text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : mobile ? 'text-plum' : 'text-gray-400'}`} aria-hidden="true" />
          <span className="flex-1">{item.label}</span>
          {count > 0 && (
            <span className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? 'bg-white text-plum' : 'bg-plum text-white'}`}>
              {count}
            </span>
          )}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] flex flex-col lg:flex-row font-sans">
      {/* Menu latéral (ordinateur) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 min-h-screen justify-between">
        <div>
          <div className="p-5 border-b border-gray-100">
            <Link href="/admin" className="flex items-center gap-2.5">
              <OctopusLogo size={34} variant="plum" />
              <div>
                <span className="font-serif font-bold text-sm text-plum block leading-tight">Administration</span>
                <span className="text-[10px] tracking-wider uppercase text-gray-500 font-semibold">
                  Les P&apos;tites Créa
                </span>
              </div>
            </Link>
          </div>
          <nav className="p-3 space-y-1" aria-label="Menu d'administration">
            {navLinks(false)}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-plum" aria-hidden="true" />
            <span>Voir la boutique en ligne</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
          <MadeByOcDigital background="#FFFFFF" height={18} className="w-full justify-center pt-2 text-[10px] text-gray-500" />
        </div>
      </aside>

      {/* Barre du haut (mobile) */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <OctopusLogo size={30} variant="plum" />
          <span className="font-serif font-bold text-sm text-plum">Administration</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 active:scale-95 rounded-xl transition-all relative"
          aria-label="Ouvrir le menu d'administration"
        >
          <Menu className="w-6 h-6" />
          {unreadMessages > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-plum" />}
        </button>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Menu d'administration">
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in" />
          <div className="relative w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="font-serif font-bold text-sm text-plum">Menu</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 active:scale-95 transition-all"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1" aria-label="Menu d'administration">
                {navLinks(true)}
              </nav>
            </div>
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-3 bg-gray-100 active:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-all min-h-[44px]"
              >
                <Store className="w-4 h-4 text-plum" aria-hidden="true" />
                <span>Voir la boutique</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-red-600 active:bg-red-50 text-xs font-semibold rounded-xl transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Déconnexion</span>
              </button>
              <MadeByOcDigital background="#FFFFFF" height={18} className="w-full justify-center pt-2 text-[10px] text-gray-500" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-3.5">
          <div className="text-xs text-gray-500 font-medium">Boutique L&apos;Atelier • Port-la-Nouvelle</div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/parametres"
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${badge.box}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {badge.label}
            </Link>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-plum text-white font-bold text-xs flex items-center justify-center">
                {(userName || 'C')[0].toUpperCase()}
              </div>
              <span className="text-xs font-bold text-gray-800">{userName}</span>
            </div>
          </div>
        </div>

        {paymentMode !== 'stripe' && (
          <p className={`lg:hidden text-[11px] font-semibold px-4 py-2 border-b ${badge.box}`}>{badge.label}</p>
        )}

        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
