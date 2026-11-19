'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from './api';
import type { Cart, User } from './types';

type Toast = { id: number; message: string; kind: 'success' | 'error' };

type Store = {
  user: User | null;
  /** false until the stored token has been checked, so guards don't redirect too early. */
  ready: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (u: User) => void;
  cartCount: number;
  refreshCart: () => Promise<void>;
  setCart: (c: Cart) => void;
  toast: (message: string, kind?: Toast['kind']) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!tokenStore.get()) return setCartCount(0);
    try {
      const cart = await api.get<Cart>('/cart');
      setCartCount(cart.itemCount);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api
      .get<User>('/auth/me')
      .then((u) => {
        setUser(u);
        refreshCart();
      })
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, [refreshCart]);

  const login = (token: string, u: User) => {
    tokenStore.set(token);
    setUser(u);
    refreshCart();
  };

  const logout = () => {
    tokenStore.set(null);
    setUser(null);
    setCartCount(0);
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        ready,
        login,
        logout,
        setUser,
        cartCount,
        refreshCart,
        setCart: (c) => setCartCount(c.itemCount),
        toast,
      }}
    >
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-full px-5 py-2.5 text-sm shadow-[0_8px_30px_rgb(0_0_0/0.18)] backdrop-blur-xl ${
              t.kind === 'error' ? 'bg-danger/95 text-white' : 'bg-ink/90 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
