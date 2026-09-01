'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2, ShieldCheck, Lock } from 'lucide-react';
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

// ── WebRTC Audio Constraints (Acoustic Echo Cancellation, Noise Suppression, Auto Gain) ──
const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    googEchoCancellation: { ideal: true },
    googAutoGainControl: { ideal: true },
    googNoiseSuppression: { ideal: true },
    googHighpassFilter: { ideal: true },
    channelCount: { ideal: 1 },
  },
  video: false,
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

    let isCancelled = false;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && channel && !isCancelled) {
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
        if (isCancelled || !pc || pc.signalingState === 'closed') return;
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        if (isCancelled || pc.signalingState === 'closed') return;
        await pc.setLocalDescription(offer);
        if (isCancelled || !channel) return;
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
        if (isCancelled || !pc || pc.signalingState === 'closed' || !offerPayload) return;
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
          if (isCancelled || !pc || pc.signalingState === 'closed') {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          localStreamRef.current = stream;
          stream.getTracks().forEach(track => {
            if (pc && pc.signalingState !== 'closed') {
              pc.addTrack(track, stream);
            }
          });
        }
        if (isCancelled || pc.signalingState === 'closed') return;
        await pc.setRemoteDescription(new RTCSessionDescription(offerPayload));
        if (isCancelled || pc.signalingState === 'closed') return;
        const answer = await pc.createAnswer();
        if (isCancelled || pc.signalingState === 'closed') return;
        await pc.setLocalDescription(answer);
        if (isCancelled || !channel) return;
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
      if (mode === 'outgoing' && !isCancelled) {
        await sendOffer();
      }
    });

    // When caller receives answer from receiver
    channel.on('broadcast', { event: 'call-accept' }, async ({ payload }) => {
      if (payload.answer && pc && pc.signalingState !== 'closed' && !isCancelled) {
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
      if (payload.offer && mode === 'incoming' && !isCancelled) {
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
      if (payload.senderId !== currentUserId && payload.candidate && pc && pc.remoteDescription && pc.signalingState !== 'closed' && !isCancelled) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error('[WebRTC] addIceCandidate error:', e);
        }
      }
    });

    // If caller, get user media with echo cancellation immediately
    if (mode === 'outgoing') {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
          if (isCancelled || !pc || pc.signalingState === 'closed') {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          localStreamRef.current = stream;
          stream.getTracks().forEach(track => {
            if (pc && pc.signalingState !== 'closed') {
              pc.addTrack(track, stream);
            }
          });

          // Send initial offer
          if (pc && pc.signalingState !== 'closed') {
            await sendOffer();
          }
        } catch (err) {
          if (isCancelled || pc?.signalingState === 'closed') return;
          console.error('[WebRTC] getUserMedia error:', err);
          toast.error('Microphone permission required for voice calls');
          endCall('Microphone permission denied');
        }
      })();
    }

    return () => {
      isCancelled = true;
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
      try {
        if (peerConnectionRef.current.signalingState !== 'closed') {
          peerConnectionRef.current.close();
        }
      } catch {}
      peerConnectionRef.current = null;
    }
  };

  const handleAcceptCall = async () => {
    setCallState('connecting');
    stopRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState === 'closed') {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => {
        if (pc && pc.signalingState !== 'closed') {
          pc.addTrack(track, stream);
        }
      });

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
    // Broadcast call-end to peer before cleanup
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'call-end',
        payload: { senderId: currentUserId, roomId },
      }).catch(() => {});
    }
    // Cleanup streams locally and close modal after short delay
    cleanupStreams();
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const endCall = (msg) => {
    cleanupStreams();
    setCallState('ended');
    // Modal shows 'Call Ended' state
    setTimeout(() => {
      onClose();
    }, 1000);
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

  const toggleSpeaker = () => {
    setIsSpeaker(prev => !prev);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  const avatar = peerUser?.photo || getUserAvatarUrl(peerUser) || getCartoonAvatar(peerUser?.name || 'Student');

  return (
    <div className="fixed inset-0 z-[999999] bg-zinc-950 flex flex-col justify-between items-center text-white select-none overflow-hidden pb-8 pt-10 px-6 anim-fade-in">
      {/* Hidden audio element for remote WebRTC stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Ambient Blurred Background of Caller Avatar */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={avatar}
          alt=""
          className="w-full h-full object-cover opacity-15 blur-3xl scale-125"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getCartoonAvatar(peerUser?.name || 'user');
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/90 to-zinc-950" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F05A00]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* TOP HEADER: Privacy and Encryption indicator */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-emerald-400 text-[11px] font-black uppercase tracking-wider shadow-sm">
          <Lock size={12} strokeWidth={2.5} />
          <span>End-to-End Encrypted Voice</span>
        </div>
      </div>

      {/* CENTER HERO AREA: Giant Avatar, Ripple Waves, Name & Status */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-6">
        
        {/* Pulsing Concentric Ripple Rings */}
        <div className="relative flex items-center justify-center mb-8">
          {(callState === 'calling' || callState === 'incoming') && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-[#F05A00]/20 animate-ping opacity-40" />
              <div className="absolute w-52 h-52 rounded-full border border-[#F05A00]/30 animate-pulse" />
              <div className="absolute w-60 h-60 rounded-full border border-[#F05A00]/15" />
            </>
          )}
          {callState === 'connected' && (
            <>
              <div className="absolute w-40 h-40 rounded-full border-2 border-emerald-500/40 animate-pulse" />
              <div className="absolute w-48 h-48 rounded-full border border-emerald-500/20" />
            </>
          )}

          {/* Caller Avatar */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white/20 bg-zinc-800 relative z-10 shadow-2xl shadow-black/80 ring-4 ring-[#F05A00]/20">
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

        {/* Peer Name */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 truncate max-w-[320px] drop-shadow-md">
          {peerUser?.name || 'Campus Student'}
        </h2>

        {/* Live Call Status / Timer */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
          {callState === 'calling' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F05A00] animate-ping" />
              <span className="text-sm font-bold text-zinc-300">Calling...</span>
            </>
          )}
          {callState === 'incoming' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Incoming Voice Call</span>
            </>
          )}
          {callState === 'connecting' && (
            <>
              <Loader2 size={14} className="animate-spin text-[#F05A00]" />
              <span className="text-sm font-bold text-zinc-300">Connecting Audio...</span>
            </>
          )}
          {callState === 'connected' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-base font-black text-emerald-400 tracking-wider">
                {formatDuration(duration)}
              </span>
            </>
          )}
          {callState === 'ended' && (
            <span className="text-sm font-bold text-zinc-400">Call Ended</span>
          )}
        </div>
      </div>

      {/* BOTTOM ACTION CONTROLS: WhatsApp Style */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {callState === 'incoming' ? (
          /* Incoming Call Controls: Big Accept and Decline Buttons */
          <div className="w-full flex items-center justify-around px-4">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleDeclineCall}
                className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 active:scale-90 transition-all cursor-pointer ring-4 ring-rose-600/30"
                title="Decline Call"
              >
                <PhoneOff size={28} />
              </button>
              <span className="text-xs font-bold text-zinc-400">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptCall}
                className="w-18 h-18 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 active:scale-90 transition-all cursor-pointer ring-4 ring-emerald-500/30 animate-bounce"
                title="Accept Call"
              >
                <Phone size={28} />
              </button>
              <span className="text-xs font-bold text-emerald-400">Accept</span>
            </div>
          </div>
        ) : (
          /* Active / Outgoing Controls: Mute, Speaker, End Call */
          <div className="flex items-center justify-center gap-6 p-4 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80">
            {/* Mute Toggle */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isMuted 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' 
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <span className="text-[11px] font-bold text-zinc-300">{isMuted ? 'Unmute' : 'Mute'}</span>
            </div>

            {/* Speaker Toggle */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSpeaker}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isSpeaker 
                    ? 'bg-white/20 text-white border border-white/20 shadow-md' 
                    : 'bg-white/10 text-zinc-400 border border-white/10'
                }`}
                title={isSpeaker ? 'Speaker On' : 'Speaker Off'}
              >
                {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>
              <span className="text-[11px] font-bold text-zinc-300">Speaker</span>
            </div>

            {/* End Call Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={handleEndCall}
                className="w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 active:scale-95 transition-all cursor-pointer ring-2 ring-rose-500/30"
                title="End Call"
              >
                <PhoneOff size={22} />
              </button>
              <span className="text-[11px] font-bold text-rose-400">End</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
