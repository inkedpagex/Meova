'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useUserContext } from './UserProvider';
import VoiceCallModal from '../call/VoiceCallModal';

const VoiceCallContext = createContext({
  startCall: () => {},
});

export function VoiceCallProvider({ children }) {
  const { user } = useUserContext();
  const currentUserId = user?.id || user?.uid;

  const [activeCall, setActiveCall] = useState(null); // { mode, peerUser, roomId, callType }
  const [activeChannel, setActiveChannel] = useState(null);
  const activeChannelRef = useRef(null);
  // Track whether we're already in a call to prevent double-invites
  const inCallRef = useRef(false);

  // ── Listen to personal incoming call channel ──────────────────────────────
  useEffect(() => {
    if (!currentUserId || !supabase) return;

    const userChannel = supabase.channel(`call-user-${currentUserId}`);

    userChannel.on('broadcast', { event: 'call-invite' }, ({ payload }) => {
      // Only accept if not already in a call
      if (inCallRef.current) return;

      const callRoomChannel = supabase.channel(payload.roomId, {
        config: { broadcast: { self: false } },
      });
      callRoomChannel.subscribe();
      activeChannelRef.current = callRoomChannel;
      setActiveChannel(callRoomChannel);
      inCallRef.current = true;

      setActiveCall({
        mode: 'incoming',
        callType: payload.callType || 'voice',
        peerUser: {
          id: payload.callerId,
          name: payload.callerName,
          photo: payload.callerPhoto,
        },
        roomId: payload.roomId,
      });
    });

    // Also listen for call-end on user channel (in case room channel isn't subscribed yet)
    userChannel.on('broadcast', { event: 'call-end' }, () => {
      if (inCallRef.current) {
        handleCloseCall();
      }
    });

    userChannel.subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // ── Cleanup active call channel on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      if (activeChannelRef.current) {
        supabase.removeChannel(activeChannelRef.current);
        activeChannelRef.current = null;
      }
    };
  }, []);

  const startCall = useCallback(
    async ({
      targetUserId,
      targetName,
      targetPhoto,
      bookingId,
      location,
      callType = 'voice',
    }) => {
      if (!currentUserId || !targetUserId) return;
      if (inCallRef.current) return;

      const roomId = `call_${bookingId || `${currentUserId}_${targetUserId}_${Date.now()}`}`;

      // 1. Create WebRTC Room Channel
      const roomChannel = supabase.channel(roomId);

      await new Promise((resolve) => {
        roomChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') resolve();
        });
        setTimeout(resolve, 3000);
      });

      activeChannelRef.current = roomChannel;
      setActiveChannel(roomChannel);
      inCallRef.current = true;

      // 2. Broadcast call-invite to target user's personal channel
      const targetChannel = supabase.channel(`call-user-${targetUserId}`);
      targetChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          targetChannel
            .send({
              type: 'broadcast',
              event: 'call-invite',
              payload: {
                callerId: currentUserId,
                callerName: user?.full_name || 'Campus Student',
                callerPhoto: user?.photo_url || '',
                roomId,
                bookingId,
                callType,
              },
            })
            .then(() => {
              setTimeout(() => supabase.removeChannel(targetChannel), 2000);
            });
        }
      });

      // 3. Send Web Push / FCM to wake background device
      fetch('/api/calls/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          bookingId,
          location,
          callType,
          callerName: user?.full_name || 'Campus Student',
          callerPhoto: user?.photo_url || '',
        }),
      }).catch(() => {});

      setActiveCall({
        mode: 'outgoing',
        callType,
        peerUser: {
          id: targetUserId,
          name: targetName || 'Campus Student',
          photo: targetPhoto || '',
        },
        roomId,
      });
    },
    [currentUserId, user]
  );

  const handleCloseCall = useCallback(() => {
    inCallRef.current = false;

    if (activeChannelRef.current) {
      try {
        activeChannelRef.current
          .send({
            type: 'broadcast',
            event: 'call-end',
            payload: { senderId: currentUserId },
          })
          .catch(() => {});
      } catch {}

      setTimeout(() => {
        if (activeChannelRef.current) {
          supabase.removeChannel(activeChannelRef.current);
          activeChannelRef.current = null;
        }
      }, 500);
    }

    setActiveChannel(null);
    setActiveCall(null);
  }, [currentUserId]);

  return (
    <VoiceCallContext.Provider value={{ startCall }}>
      {children}
      {activeCall && (
        <VoiceCallModal
          isOpen={Boolean(activeCall)}
          mode={activeCall.mode}
          callType={activeCall.callType || 'voice'}
          peerUser={activeCall.peerUser}
          currentUserId={currentUserId}
          channel={activeChannel}
          roomId={activeCall.roomId}
          onClose={handleCloseCall}
        />
      )}
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  return useContext(VoiceCallContext);
}

export function useCall() {
  return useContext(VoiceCallContext);
}
