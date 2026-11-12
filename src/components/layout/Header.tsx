'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X, Sparkles, MapPin } from 'lucide-react';
import OctopusLogo from '@/components/brand/OctopusLogo';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, formatPrice } from '@/lib/paths';
import ShopImage from '@/components/ui/ShopImage';
import type { Product } from '@/lib/types';

const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'Nouveautés', href: '/boutique?filtre=nouveautes' },
  { label: 'Collections', href: '/collections' },
  { label: "L'Atelier & Claire", href: '/a-propos' },
  { label: 'Contact & Horaires', href: '/contact' },
];

export default function Header({ announcement }: { announcement?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalItems, openCart } = useCart();
  const { count: favoritesCount } = useFavorites();
  const { user, isAdmin } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Recherche en direct, avec un court délai pour ne pas interroger le serveur à chaque touche.
  const query = searchQuery.trim();
  useEffect(() => {
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      apiFetch(`/api/products?search=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchResults(data.slice(0, 5));
            setSearchedQuery(query);
          }
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!searchOpen && !mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, mobileMenuOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const showResults = query.length >= 2 && searchedQuery === query;
  const accountHref = user ? (isAdmin ? '/admin' : '/compte') : '/connexion';
  const onNouveautes = pathname === '/boutique' && searchParams.get('filtre') === 'nouveautes';

  const isActive = (href: string) => {
    if (href === '/boutique?filtre=nouveautes') return onNouveautes;
    if (href === '/boutique') return pathname === '/boutique' && !onNouveautes;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Bannière d'annonce, modifiable dans Administration > Contenu du site */}
      {announcement && (
        <div className="bg-gradient-to-r from-plum-dark via-plum to-plum-dark text-white text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden="true" />
          <span>{announcement}</span>
        </div>
      )}

      {/* Barre de navigation principale */}
      <div
        className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-cream/95 backdrop-blur-md shadow-sm border-b border-rose-powder/30 py-2.5'
            : 'bg-cream border-b border-rose-powder/20 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0" aria-label="Les P'tites Créa de Claire, accueil">
            <OctopusLogo size={isScrolled ? 38 : 46} variant="plum" />
            <div className="flex flex-col">
              <span className="font-script text-2xl sm:text-3xl text-plum leading-none group-hover:text-plum-dark transition-colors">
                L&apos;Atelier
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.2em] leading-tight uppercase font-semibold text-dark/80 mt-0.5">
                Les P&apos;tites Créa de Claire
              </span>
              <span className="text-[9px] tracking-[0.15em] text-eucalyptus uppercase font-medium flex items-center gap-0.5 whitespace-nowrap">
                <MapPin className="w-2.5 h-2.5 inline text-gold" aria-hidden="true" /> Port-la-Nouvelle
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                    active ? 'text-plum font-semibold' : 'text-dark/80 hover:text-plum'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-old to-plum rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-dark/70 hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all"
              aria-label="Rechercher une création"
              aria-expanded={searchOpen}
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href={accountHref}
              className="hidden sm:flex min-w-11 h-11 px-2 rounded-xl items-center justify-center gap-1.5 text-dark/70 hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all"
              aria-label={user ? (isAdmin ? 'Administration' : 'Mon compte') : 'Se connecter'}
            >
              <User className="w-5 h-5" />
              {isAdmin && (
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider bg-plum text-white px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </Link>

            <Link
              href="/compte/favoris"
              className="hidden sm:flex w-11 h-11 rounded-xl items-center justify-center text-dark/70 hover:text-plum hover:bg-rose-powder/20 active:bg-rose-powder/40 active:scale-95 transition-all relative"
              aria-label={`Mes favoris${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`}
            >
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-0.5 bg-rose-old text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {favoritesCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="min-w-[44px] min-h-[44px] p-2.5 bg-rose-powder/35 hover:bg-rose-powder/55 text-plum rounded-full active:scale-95 transition-all relative flex items-center justify-center group shadow-xs"
              aria-label={`Ouvrir le panier${totalItems > 0 ? ` (${totalItems} article${totalItems > 1 ? 's' : ''})` : ''}`}
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-plum text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Recherche instantanée */}
        {searchOpen && (
          <div className="border-t border-rose-powder/20 bg-cream-warm mt-2.5 py-4 px-4 sm:px-8 animate-in slide-in-from-top-2">
            <div className="max-w-2xl mx-auto relative">
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full border border-rose-powder/40 shadow-sm">
                <Search className="w-4 h-4 text-plum/70 shrink-0" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="search"
                  aria-label="Rechercher une création"
                  placeholder="Rechercher des boucles, bagues, broches, cristaux..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-dark placeholder:text-muted/60 focus:outline-none"
                />
                <button type="button" onClick={closeSearch} className="text-xs text-muted hover:text-dark shrink-0">
                  Fermer
                </button>
              </div>

              {showResults && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-rose-powder/30 overflow-hidden z-50">
                  {searchResults.length === 0 ? (
                    <p className="p-4 text-xs text-muted text-center">
                      Aucune création ne correspond à « {query} ».
                    </p>
                  ) : (
                    <div className="p-2 divide-y divide-rose-powder/10">
                      {searchResults.map((item) => (
                        <Link
                          key={item.id}
                          href={`/produit/${item.slug}`}
                          onClick={closeSearch}
                          className="flex items-center gap-3 p-2.5 hover:bg-cream-warm rounded-xl transition-colors"
                        >
                          <ShopImage
                            src={item.images?.[0]?.url}
                            alt=""
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover border border-rose-powder/20"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark truncate">{item.name}</p>
                            <p className="text-xs text-plum font-medium">{formatPrice(item.price)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in"
          />

          <div className="relative w-4/5 max-w-sm bg-cream h-full p-6 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto animate-in slide-in-from-left">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-rose-powder/20">
                <OctopusLogo size={36} showText variant="plum" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-powder/20 text-dark/80 hover:text-plum active:scale-95 transition-all"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-2 mt-6" aria-label="Navigation mobile">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={`text-base font-semibold py-3 px-3 rounded-xl hover:bg-rose-powder/15 active:bg-rose-powder/30 transition-all ${
                      isActive(link.href) ? 'text-plum bg-rose-powder/15' : 'text-dark hover:text-plum'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/compte/favoris"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold py-3 px-3 rounded-xl text-dark hover:text-plum hover:bg-rose-powder/15 active:bg-rose-powder/30 transition-all flex items-center justify-between"
                >
                  <span>Mes favoris</span>
                  {favoritesCount > 0 && (
                    <span className="min-w-6 h-6 px-1.5 bg-rose-old text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {favoritesCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-rose-powder/20 flex flex-col gap-3">
              <Link
                href={accountHref}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3.5 rounded-full bg-plum text-white font-semibold text-sm active:scale-98 shadow-sm hover:bg-plum-dark transition-all"
              >
                {user
                  ? isAdmin
                    ? 'Administration'
                    : `Mon compte (${user.firstName || 'Cliente'})`
                  : "Se connecter / S'inscrire"}
              </Link>
              <div className="text-center text-xs text-muted flex items-center justify-center gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> Port-la-Nouvelle (Aude)
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
