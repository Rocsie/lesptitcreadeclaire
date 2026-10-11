'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X, Sparkles, MapPin } from 'lucide-react';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { count: favoritesCount } = useFavorites();
  const { user, isAdmin } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe SSR/Hydration values to avoid mismatch between server & client localStorage
  const currentUser = mounted ? user : null;
  const currentIsAdmin = mounted ? isAdmin : false;
  const currentFavoritesCount = mounted ? favoritesCount : 0;
  const currentTotalItems = mounted ? totalItems : 0;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Recherche en direct
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchResults(data.slice(0, 4));
          }
        })
        .catch(() => {});
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Boutique', href: '/boutique' },
    { label: 'Nouveautés', href: '/boutique?filtre=nouveautes' },
    { label: 'Collections', href: '/collections' },
    { label: 'L\'Atelier & Claire', href: '/a-propos' },
    { label: 'Contact & Horaires', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Bannière d'annonce supérieure */}
      <div className="bg-gradient-to-r from-plum-dark via-plum to-plum-dark text-white text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse shrink-0" />
        <span>
          Retrait gratuit à la boutique <strong>L&apos;Atelier</strong> à Port-la-Nouvelle • Livraison offerte dès 60€ d&apos;achat !
        </span>
      </div>

      {/* Barre de navigation principale */}
      <div
        className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-cream/95 backdrop-blur-md shadow-sm border-b border-rose-powder/30 py-2.5'
            : 'bg-cream border-b border-rose-powder/20 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Menu Mobile Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all focus:outline-none"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <OctopusLogo size={isScrolled ? 38 : 46} variant="plum" />
            <div className="flex flex-col">
              <span className="font-script text-2xl sm:text-3xl text-plum leading-none group-hover:text-plum-dark transition-colors">
                L&apos;Atelier
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-semibold text-dark/80 mt-0.5">
                Les P&apos;tites Créa de Claire
              </span>
              <span className="text-[9px] tracking-[0.15em] text-eucalyptus uppercase font-medium flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 inline text-gold" /> Port-la-Nouvelle
              </span>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                    isActive ? 'text-plum font-semibold' : 'text-dark/80 hover:text-plum'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-old to-plum rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions à droite : Recherche, Compte, Favoris, Panier */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Recherche trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-dark/70 hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all relative"
              aria-label="Rechercher une création"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Compte client ou Admin */}
            <Link
              href={currentUser ? (currentIsAdmin ? '/admin' : '/compte') : '/connexion'}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-dark/70 hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all relative"
              aria-label="Mon compte"
            >
              <User className="w-5 h-5" />
              {currentIsAdmin && (
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider bg-plum text-white px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </Link>

            {/* Favoris */}
            <Link
              href="/compte/favoris"
              className="w-11 h-11 rounded-xl flex items-center justify-center text-dark/70 hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all relative"
              aria-label="Mes favoris"
            >
              <Heart className="w-5 h-5" />
              {currentFavoritesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-old text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {currentFavoritesCount}
                </span>
              )}
            </Link>

            {/* Panier avec drawer trigger */}
            <button
              onClick={openCart}
              className="min-w-[44px] min-h-[44px] p-2.5 bg-rose-powder/35 hover:bg-rose-powder/55 text-plum rounded-full active:scale-95 transition-all relative flex items-center justify-center group shadow-xs"
              aria-label="Panier d'achats"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {currentTotalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-plum text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                  {currentTotalItems}
                </span>
              )}
            </button>
          </div>
        </div>


        {/* Barre de recherche déroulante instantanée */}
        {searchOpen && (
          <div className="border-t border-rose-powder/20 bg-cream-warm py-4 px-4 sm:px-8 animate-in slide-in-from-top-2">
            <div className="max-w-2xl mx-auto relative">
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full border border-rose-powder/40 shadow-sm">
                <Search className="w-4 h-4 text-plum/70 shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher des boucles, bagues, broches, cristaux..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-sm text-dark placeholder:text-muted/60 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-muted hover:text-dark"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Résultats pendant la frappe */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-rose-powder/30 overflow-hidden z-50">
                  <div className="p-2 divide-y divide-rose-powder/10">
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        href={`/produit/${item.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 p-2.5 hover:bg-cream-warm rounded-xl transition-colors"
                      >
                        <img
                          src={item.images?.[0]?.url || '/images/hero-atelier.jpg'}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-rose-powder/20"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-dark">{item.name}</p>
                          <p className="text-xs text-plum font-medium">{item.price} €</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop avec fermeture immédiate au clic */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="relative w-4/5 max-w-sm bg-cream h-full p-6 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-rose-powder/20">
                <OctopusLogo size={36} showText variant="plum" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-powder/20 text-dark/80 hover:text-plum active:scale-95 transition-all"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-2 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-semibold text-dark hover:text-plum py-3 px-3 rounded-xl hover:bg-rose-powder/15 active:bg-rose-powder/30 transition-all flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-rose-powder/20 flex flex-col gap-3">
              <Link
                href={currentUser ? (currentIsAdmin ? '/admin' : '/compte') : '/connexion'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3.5 rounded-full bg-plum text-white font-semibold text-sm active:scale-98 shadow-sm hover:bg-plum-dark transition-all"
              >
                {currentUser ? `Mon Compte (${currentUser.firstName || 'Client'})` : 'Se connecter / S\'inscrire'}
              </Link>
              <div className="text-center text-xs text-muted flex items-center justify-center gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-gold" /> Port-la-Nouvelle (Aude)
              </div>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
