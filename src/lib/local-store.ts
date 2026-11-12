import { useSyncExternalStore } from 'react';

// Petit magasin synchronisé avec localStorage, lisible via useSyncExternalStore.
// Côté serveur et pendant l'hydratation, la valeur par défaut est utilisée :
// pas d'écart entre le HTML du serveur et le premier rendu du navigateur.

export interface LocalStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T | ((prev: T) => T)) => void;
}

export function createLocalStore<T>(key: string, fallback: T, sanitize: (raw: unknown) => T): LocalStore<T> {
  let value = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === 'undefined') return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      value = raw ? sanitize(JSON.parse(raw)) : fallback;
    } catch {
      value = fallback;
    }
  };

  const emit = () => listeners.forEach((listener) => listener());

  // Un changement fait dans un autre onglet est repris ici.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    loaded = false;
    load();
    emit();
  };

  return {
    subscribe(listener) {
      load();
      if (listeners.size === 0) window.addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot() {
      load();
      return value;
    },
    getServerSnapshot() {
      return fallback;
    },
    set(next) {
      load();
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // stockage plein ou navigation privée : la valeur reste en mémoire
      }
      emit();
    },
  };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

const noopSubscribe = () => () => {};

/** Faux côté serveur et pendant l'hydratation, vrai ensuite. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
