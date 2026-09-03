'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase/client';

const UserContext = createContext(null);

export function UserProvider({ children, initialUser, initialWallet, initialPeople }) {
  const normalizedInitialUser = initialUser
    ? { ...initialUser, id: initialUser.id || initialUser.uid, uid: initialUser.id || initialUser.uid }
    : null;

  const [user, setUserState] = useState(normalizedInitialUser);
  const [wallet, setWallet] = useState(initialWallet);
  const [people, setPeople] = useState(initialPeople || []);

  // ── Real-Time Presence State ────────────────────────────────────────────────
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const [onlinePresenceMap, setOnlinePresenceMap] = useState(() => new Map());

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

  // ── Real-Time Presence Hook via Supabase WebSockets ─────────────────────────
  useEffect(() => {
    const uid = user?.id || user?.uid;
    if (!supabase) return;

    // Join global campus presence room
    const presenceChannel = supabase.channel('meova_campus_presence', {
      config: {
        presence: {
          key: uid ? String(uid) : `guest_${Math.random().toString(36).substring(2, 9)}`,
        },
      },
    });

    const updatePresenceState = () => {
      const state = presenceChannel.presenceState();
      const ids = new Set();
      const map = new Map();

      Object.entries(state).forEach(([key, presences]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const latest = presences[presences.length - 1];
          if (latest?.user_id) {
            ids.add(String(latest.user_id));
            map.set(String(latest.user_id), latest);
          } else if (key && !key.startsWith('guest_')) {
            ids.add(String(key));
          }
        }
      });

      setOnlineUserIds(ids);
      setOnlinePresenceMap(map);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, updatePresenceState)
      .on('presence', { event: 'leave' }, updatePresenceState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && uid) {
          try {
            await presenceChannel.track({
              user_id: uid,
              full_name: user.full_name || '',
              username: user.username || '',
              photo_url: user.photo_url || user.avatar_url || '',
              branch: user.branch || '',
              year: user.year || '',
              online_at: new Date().toISOString(),
            });
          } catch {}
        }
      });

    // Instant disconnect / resume on tab visibility change
    const onVisibilityChange = async () => {
      if (document.hidden) {
        try {
          await presenceChannel.untrack();
        } catch {}
      } else if (uid) {
        try {
          await presenceChannel.track({
            user_id: uid,
            full_name: user.full_name || '',
            username: user.username || '',
            photo_url: user.photo_url || user.avatar_url || '',
            branch: user.branch || '',
            year: user.year || '',
            online_at: new Date().toISOString(),
          });
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (supabase && presenceChannel) {
        try {
          presenceChannel.untrack();
        } catch {}
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [user]);

  // Fast helper function to check if a specific user is currently online
  const isUserOnline = useCallback(
    (targetUserId) => {
      if (!targetUserId) return false;
      return onlineUserIds.has(String(targetUserId));
    },
    [onlineUserIds]
  );

  // Real-time wallet listeners
  useEffect(() => {
    const uid = user?.id || user?.uid;
    if (!uid) return;

    const onFocus = () => refreshWallet();
    window.addEventListener('focus', onFocus);
    window.addEventListener('wallet-refresh-request', onFocus);

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
    <UserContext.Provider
      value={{
        user,
        setUser,
        wallet,
        setWallet,
        people,
        setPeople,
        refreshWallet,
        onlineUserIds,
        onlinePresenceMap,
        isUserOnline,
      }}
    >
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
