'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase/client';

const UserContext = createContext(null);

export function UserProvider({ children, initialUser, initialWallet, initialPeople }) {
  const normalizedInitialUser = initialUser
    ? { ...initialUser, id: initialUser.id || initialUser.uid, uid: initialUser.id || initialUser.uid }
    : null;

  const [user, setUserState] = useState(normalizedInitialUser);
  const [wallet, setWallet] = useState(initialWallet);
  const [people, setPeople] = useState(initialPeople || []);

  const setUser = useCallback((newUser) => {
    if (!newUser) {
      setUserState(null);
      return;
    }
    const normalized = { ...newUser, id: newUser.id || newUser.uid, uid: newUser.id || newUser.uid };
    setUserState(normalized);
  }, []);

  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
    }
    if (initialWallet !== undefined) setWallet(initialWallet);
    if (initialPeople !== undefined) setPeople(initialPeople);
  }, [initialUser, initialWallet, initialPeople, setUser]);

  // Real-time wallet sync
  const refreshWallet = useCallback(async () => {
    const uid = user?.id || user?.uid;
    if (!uid) return;
    try {
      const res = await fetch('/api/wallet', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          setWallet(data.wallet);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wallet-updated', { detail: data.wallet }));
          }
        }
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    const uid = user?.id || user?.uid;
    if (!uid) return;

    // Window focus & refresh request listeners
    const onFocus = () => refreshWallet();
    window.addEventListener('focus', onFocus);
    window.addEventListener('wallet-refresh-request', onFocus);

    // Supabase Realtime subscription on wallets table
    let channel = null;
    if (supabase) {
      channel = supabase
        .channel(`user-wallet-sync-${uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            if (payload.new) {
              setWallet(payload.new);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('wallet-updated', { detail: payload.new }));
              }
            } else {
              refreshWallet();
            }
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('wallet-refresh-request', onFocus);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, refreshWallet]);

  return (
    <UserContext.Provider value={{ user, setUser, wallet, setWallet, people, setPeople, refreshWallet }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
