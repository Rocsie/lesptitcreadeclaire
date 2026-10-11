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
  ShieldCheck,
  Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OctopusLogo from '@/components/brand/OctopusLogo';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
    { label: 'Commandes', href: '/admin/commandes', icon: ShoppingBag },
    { label: 'Produits', href: '/admin/produits', icon: Package },
    { label: 'Catégories & Collections', href: '/admin/categories', icon: Layers },
    { label: 'Gestion des Stocks', href: '/admin/stocks', icon: AlertTriangle },
    { label: 'Clients', href: '/admin/clients', icon: Users },
    { label: 'Codes Promotionnels', href: '/admin/promos', icon: Tag },
    { label: 'Contenu du Site (CMS)', href: '/admin/cms', icon: FileText },
    { label: 'Horaires de l\'Atelier', href: '/admin/horaires', icon: Clock },
    { label: 'Statistiques & Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Paramètres & Emails', href: '/admin/parametres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] flex flex-col lg:flex-row font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 min-h-screen justify-between">
        <div>
          {/* Logo & Marque */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <OctopusLogo size={34} variant="plum" />
              <div>
                <span className="font-serif font-bold text-sm text-plum block leading-tight">
                  Claire Admin
                </span>
                <span className="text-[10px] tracking-wider uppercase text-gray-500 font-semibold">
                  Les P&apos;tites Créa
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-plum text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar : Aller vers la boutique & Déconnexion */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-plum" />
            <span>Voir la boutique en ligne</span>
          </Link>

          <button
            onClick={() => {
              logout();
              router.push('/connexion');
            }}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Topbar Mobile */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <OctopusLogo size={30} variant="plum" />
          <span className="font-serif font-bold text-sm text-plum">Administration</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 active:scale-95 rounded-xl transition-all"
          aria-label="Ouvrir le menu administration"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Drawer Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" />
          <div className="relative w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="font-serif font-bold text-sm text-plum">Menu Administration</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 active:scale-95 transition-all"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all"
                  >
                    <item.icon className="w-4 h-4 text-plum shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="block text-center py-3 bg-gray-100 active:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl mb-2 transition-all"
              >
                Retour boutique
              </Link>
            </div>
          </div>
        </div>
      )}


      {/* Zone de contenu principal Admin */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Admin */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-3.5">
          <div className="text-xs text-gray-500 font-medium">
            Boutique L&apos;Atelier • Port-la-Nouvelle | Panneau d&apos;administration v2.0
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Boutique en ligne active
            </span>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-plum text-white font-bold text-xs flex items-center justify-center">
                C
              </div>
              <span className="text-xs font-bold text-gray-800">Claire</span>
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-sand flex items-center justify-center text-sm font-serif text-warm-gray">Chargement de l'administration...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </React.Suspense>
  );
}

