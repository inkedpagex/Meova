'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2, ShieldCheck } from 'lucide-react';
import { getUserAvatarUrl, getCartoonAvatar } from '../../utils/avatar';
import { startIncomingRingtone, startOutgoingRingtone, playConnectedSound, stopRingtone } from '../../lib/ringtone';
import { toast } from '../../lib/toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function VoiceCallModal({
  isOpen,
  mode, // 'outgoing' | 'incoming'
  peerUser, // { id, name, photo }
  currentUserId,
  channel, // Supabase Realtime Channel
  roomId,
  onClose,
}) {
  const [callState, setCallState] = useState(mode === 'incoming' ? 'incoming' : 'calling'); // 'calling' | 'incoming' | 'connecting' | 'connected' | 'ended'
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [duration, setDuration] = useState(0);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Initial ringtone handling
  useEffect(() => {
    if (!isOpen) return;

    if (callState === 'incoming') {
      startIncomingRingtone();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([500, 250, 500, 250, 500, 250, 500]);
      }
    } else if (callState === 'calling') {
      startOutgoingRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [isOpen, callState]);

  // 2. Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // 3. WebRTC Peer Connection & Realtime Signaling
  useEffect(() => {
    if (!isOpen || !channel) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, senderId: currentUserId },
        });
      }
    };

    // Remote Audio Stream handler
    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        stopRingtone();
        playConnectedSound();
        setCallState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        endCall('Call disconnected');
      }
    };

    // Helper: Caller creates and sends offer
    const sendOffer = async () => {
      try {
        if (!pc || pc.signalingState === 'closed') return;
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);
        channel.send({
          type: 'broadcast',
          event: 'call-offer',
          payload: { offer, callerId: currentUserId, roomId },
        });
      } catch (err) {
        console.error('[WebRTC] createOffer error:', err);
      }
    };

    // Helper: Receiver handles offer and sends answer
    const handleOffer = async (offerPayload) => {
      try {
        if (!pc || pc.signalingState === 'closed' || !offerPayload) return;
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offerPayload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({
          type: 'broadcast',
          event: 'call-accept',
          payload: { answer, responderId: currentUserId, roomId },
        });
      } catch (err) {
        console.error('[WebRTC] handleOffer error:', err);
      }
    };

    // ── Realtime Signaling Handlers ──────────────────────────────

    // When receiver is ready, caller generates offer
    channel.on('broadcast', { event: 'call-ready' }, async () => {
      if (mode === 'outgoing') {
        await sendOffer();
      }
    });

    // When caller receives answer from receiver
    channel.on('broadcast', { event: 'call-accept' }, async ({ payload }) => {
      if (payload.answer && pc.signalingState !== 'closed') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          stopRingtone();
          playConnectedSound();
          setCallState('connected');
        } catch (e) {
          console.error('[WebRTC] setRemoteDescription error:', e);
        }
      }
    });

    // When receiver receives offer from caller
    channel.on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
      if (payload.offer && mode === 'incoming') {
        await handleOffer(payload.offer);
      }
    });

    channel.on('broadcast', { event: 'call-reject' }, () => {
      endCall('Call declined by peer');
    });

    channel.on('broadcast', { event: 'call-end' }, () => {
      endCall('Call ended');
    });

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload.senderId !== currentUserId && payload.candidate && pc.remoteDescription && pc.signalingState !== 'closed') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error('[WebRTC] addIceCandidate error:', e);
        }
      }
    });

    // If caller, get user media immediately
    if (mode === 'outgoing') {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          stream.getTracks().forEach(track => pc.addTrack(track, stream));

          // Send initial offer
          await sendOffer();
        } catch (err) {
          console.error('[WebRTC] getUserMedia error:', err);
          toast.error('Microphone permission required for voice calls');
          endCall('Microphone permission denied');
        }
      })();
    }

    return () => {
      cleanupStreams();
    };
  }, [isOpen, channel, mode, currentUserId, roomId]);

  const cleanupStreams = () => {
    stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleAcceptCall = async () => {
    setCallState('connecting');
    stopRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = peerConnectionRef.current;
      if (pc) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      }

      // Send call-ready signal to tell caller to send/resend offer
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'call-ready',
          payload: { responderId: currentUserId, roomId },
        });
      }
    } catch {
      toast.error('Microphone permission required');
      handleDeclineCall();
    }
  };

  const handleDeclineCall = () => {
    stopRingtone();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'call-reject',
        payload: { responderId: currentUserId, roomId },
      });
    }
    endCall('Call declined');
  };

  const handleEndCall = () => {
    stopRingtone();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'call-end',
        payload: { senderId: currentUserId, roomId },
      });
    }
    endCall('Call ended');
  };

  const endCall = (msg) => {
    cleanupStreams();
    setCallState('ended');
    if (msg) toast(msg);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  const avatar = peerUser?.photo || getUserAvatarUrl(peerUser) || getCartoonAvatar(peerUser?.name || 'Student');

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950/85 backdrop-blur-xl flex items-center justify-center p-4 anim-fade-in">
      {/* Hidden audio element for remote WebRTC stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="w-full max-w-sm rounded-[36px] bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Decorative ambient glowing ring */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#F05A00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Privacy Verified Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-6">
          <ShieldCheck size={12} />
          <span>Privacy Protected Voice</span>
        </div>

        {/* Avatar with Pulsing Rings */}
        <div className="relative mb-6">
          {(callState === 'calling' || callState === 'incoming') && (
            <>
              <div className="absolute inset-0 rounded-full bg-[#F05A00] animate-ping opacity-25" />
              <div className="absolute -inset-3 rounded-full border border-[#F05A00]/40 animate-pulse" />
            </>
          )}
          {callState === 'connected' && (
            <div className="absolute -inset-2 rounded-full border-2 border-emerald-500/50 animate-pulse" />
          )}

          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-800 relative z-10 shadow-xl">
            <img
              src={avatar}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getCartoonAvatar(peerUser?.name || 'user');
              }}
            />
          </div>
        </div>

        {/* Peer Name & Status */}
        <h3 className="text-xl font-black text-white tracking-tight mb-1 truncate max-w-[240px]">
          {peerUser?.name || 'Campus Student'}
        </h3>
        
        <p className="text-xs font-bold text-zinc-400 mb-8 flex items-center gap-1.5">
          {callState === 'calling' && <><span className="w-2 h-2 rounded-full bg-[#F05A00] animate-ping" /> Calling...</>}
          {callState === 'incoming' && <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Incoming Voice Call</>}
          {callState === 'connecting' && <><Loader2 size={12} className="animate-spin text-[#F05A00]" /> Connecting Audio...</>}
          {callState === 'connected' && (
            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {formatDuration(duration)}
            </span>
          )}
          {callState === 'ended' && <span className="text-zinc-500">Call Ended</span>}
        </p>

        {/* Action Controls */}
        {callState === 'incoming' ? (
          <div className="flex items-center gap-8 pt-4">
            <button
              onClick={handleDeclineCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Decline Call"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={handleAcceptCall}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer animate-bounce"
              title="Accept Call"
            >
              <Phone size={24} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 pt-2">
            {callState === 'connected' && (
              <>
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    !isSpeaker ? 'bg-white/5 text-zinc-500' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="Speaker"
                >
                  {isSpeaker ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </>
            )}

            <button
              onClick={handleEndCall}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <PhoneOff size={16} />
              <span>{callState === 'connected' ? 'End Call' : 'Cancel'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
