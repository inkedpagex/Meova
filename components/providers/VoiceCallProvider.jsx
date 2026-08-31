'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useUserContext } from './UserProvider';
import VoiceCallModal from '../call/VoiceCallModal';

const VoiceCallContext = createContext({
  startCall: () => {},
});

export function VoiceCallProvider({ children }) {
  const { user } = useUserContext();
  const currentUserId = user?.id || user?.uid;

  const [activeCall, setActiveCall] = useState(null); // { mode, peerUser, roomId }
  const [activeChannel, setActiveChannel] = useState(null);
  const activeChannelRef = useRef(null);

  // Listen to private personal incoming call channel
  useEffect(() => {
    if (!currentUserId || !supabase) return;

    const userChannel = supabase.channel(`call-user-${currentUserId}`, {
      config: { broadcast: { self: false } },
    });

    userChannel.on('broadcast', { event: 'call-invite' }, ({ payload }) => {
      // Incoming call received
      if (!activeCall) {
        const callRoomChannel = supabase.channel(payload.roomId, {
          config: { broadcast: { self: false } },
        });
        callRoomChannel.subscribe();
        activeChannelRef.current = callRoomChannel;
        setActiveChannel(callRoomChannel);

        setActiveCall({
          mode: 'incoming',
          peerUser: {
            id: payload.callerId,
            name: payload.callerName,
            photo: payload.callerPhoto,
          },
          roomId: payload.roomId,
        });
      }
    });

    userChannel.subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      if (activeChannelRef.current) {
        supabase.removeChannel(activeChannelRef.current);
      }
    };
  }, [currentUserId, activeCall]);

  const startCall = async ({ targetUserId, targetName, targetPhoto, bookingId, location }) => {
    if (!currentUserId || !targetUserId) return;

    const roomId = `call_${bookingId || `${currentUserId}_${targetUserId}_${Date.now()}`}`;
    
    // 1. Create WebRTC Room Channel
    const roomChannel = supabase.channel(roomId, {
      config: { broadcast: { self: false } },
    });
    roomChannel.subscribe();
    activeChannelRef.current = roomChannel;
    setActiveChannel(roomChannel);

    // 2. Broadcast call-invite directly to target user's personal channel
    const targetChannel = supabase.channel(`call-user-${targetUserId}`);
    targetChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        targetChannel.send({
          type: 'broadcast',
          event: 'call-invite',
          payload: {
            callerId: currentUserId,
            callerName: user?.full_name || 'Campus Student',
            callerPhoto: user?.photo_url || '',
            roomId,
            bookingId,
          },
        });
      }
    });

    // 3. Send Web Push Notification to Wake Up Locked / Background phone
    fetch('/api/calls/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId,
        bookingId,
        location,
        callerName: user?.full_name || 'Campus Student',
        callerPhoto: user?.photo_url || '',
      }),
    }).catch(() => {});

    setActiveCall({
      mode: 'outgoing',
      peerUser: {
        id: targetUserId,
        name: targetName || 'Campus Student',
        photo: targetPhoto || '',
      },
      roomId,
    });
  };

  const handleCloseCall = () => {
    if (activeChannelRef.current) {
      supabase.removeChannel(activeChannelRef.current);
      activeChannelRef.current = null;
    }
    setActiveChannel(null);
    setActiveCall(null);
  };

  return (
    <VoiceCallContext.Provider value={{ startCall }}>
      {children}
      {activeCall && (
        <VoiceCallModal
          isOpen={Boolean(activeCall)}
          mode={activeCall.mode}
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
