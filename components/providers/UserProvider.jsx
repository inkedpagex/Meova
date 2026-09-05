'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  // Deduplication & throttle refs
  const isRefreshingWalletRef = useRef(false);
  const lastWalletFetchTimeRef = useRef(0);

  const setUser = useCallback((newUser) => {
    if (!newUser) {
      setUserState(null);
      return;
    }
    const normalized = { ...newUser, id: newUser.id || newUser.uid, uid: newUser.id || newUser.uid };
    setUserState((prev) => {
      if (
        prev &&
        prev.id === normalized.id &&
        prev.role === normalized.role &&
        prev.full_name === normalized.full_name &&
        prev.photo_url === (normalized.photo_url || normalized.avatar_url) &&
        prev.profile_complete === normalized.profile_complete
      ) {
        return prev;
      }
      return normalized;
    });
  }, []);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
    if (initialWallet) {
      setWallet((prev) => {
        if (
          prev &&
          prev.purchased === initialWallet.purchased &&
          prev.bonus === initialWallet.bonus &&
          prev.creator === initialWallet.creator &&
          prev.total_balance === initialWallet.total_balance
        ) {
          return prev;
        }
        return initialWallet;
      });
    }
    if (initialPeople) setPeople(initialPeople);
  }, [initialUser?.id, initialUser?.uid, initialWallet?.updated_at, initialPeople, setUser]);

  // Real-time wallet sync with concurrency guard & 4s throttling
  const refreshWallet = useCallback(async (force = false) => {
    const uid = user?.id || user?.uid;
    if (!uid) return;

    const now = Date.now();
    if (!force && now - lastWalletFetchTimeRef.current < 4000) {
      return;
    }
    if (isRefreshingWalletRef.current) return;

    isRefreshingWalletRef.current = true;
    lastWalletFetchTimeRef.current = now;

    try {
      const res = await fetch('/api/wallet', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          setWallet((prev) => {
            const nw = data.wallet;
            const hasChanged =
              !prev ||
              prev.purchased !== nw.purchased ||
              prev.bonus !== nw.bonus ||
              prev.creator !== nw.creator ||
              prev.total_balance !== nw.total_balance;

            if (hasChanged && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('wallet-updated', { detail: nw }));
            }
            return hasChanged ? nw : prev;
          });
        }
      }
    } catch {
      // silent
    } finally {
      isRefreshingWalletRef.current = false;
    }
  }, [user?.id, user?.uid]);

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

    const onUnload = () => {
      try {
        presenceChannel.untrack();
      } catch {}
      if (uid && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          navigator.sendBeacon('/api/presence/heartbeat', JSON.stringify({ action: 'leave', userId: uid }));
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);

    // Periodic heartbeat every 30 seconds to keep DB timestamp synced
    const heartbeatInterval = setInterval(() => {
      if (uid && typeof document !== 'undefined' && !document.hidden) {
        fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping', userId: uid }),
        }).catch(() => {});
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
      clearInterval(heartbeatInterval);
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

  const onlineUsers = useMemo(() => {
    return Array.from(onlinePresenceMap.values()).sort((a, b) => {
      const timeA = new Date(a.online_at || 0).getTime();
      const timeB = new Date(b.online_at || 0).getTime();
      return timeB - timeA;
    });
  }, [onlinePresenceMap]);

  const onlineCount = useMemo(() => onlineUserIds.size, [onlineUserIds]);

  // Real-time wallet listeners
  useEffect(() => {
    const uid = user?.id || user?.uid;
    if (!uid) return;

    const onFocus = () => refreshWallet(false);
    window.addEventListener('focus', onFocus);
    const onRefreshRequest = () => refreshWallet(true);
    window.addEventListener('wallet-refresh-request', onRefreshRequest);

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
            if (payload.new && typeof payload.new === 'object' && Object.keys(payload.new).length > 0) {
              setWallet((prev) => {
                const nw = payload.new;
                const hasChanged =
                  !prev ||
                  prev.purchased !== nw.purchased ||
                  prev.bonus !== nw.bonus ||
                  prev.creator !== nw.creator ||
                  prev.total_balance !== nw.total_balance;

                if (hasChanged && typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wallet-updated', { detail: nw }));
                }
                return hasChanged ? nw : prev;
              });
            } else {
              refreshWallet(true);
            }
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('wallet-refresh-request', onRefreshRequest);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, user?.uid, refreshWallet]);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    wallet,
    setWallet,
    people,
    setPeople,
    refreshWallet,
    onlineUserIds,
    onlinePresenceMap,
    onlineUsers,
    onlineCount,
    isUserOnline,
  }), [
    user,
    setUser,
    wallet,
    setWallet,
    people,
    setPeople,
    refreshWallet,
    onlineUserIds,
    onlinePresenceMap,
    onlineUsers,
    onlineCount,
    isUserOnline,
  ]);

  return (
    <UserContext.Provider value={contextValue}>
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
