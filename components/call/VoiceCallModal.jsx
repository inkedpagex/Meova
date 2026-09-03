'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Volume1, Loader2, Lock } from '@/lib/icons';
import { getUserAvatarUrl } from '../../utils/avatar';
import { startIncomingRingtone, startOutgoingRingtone, playConnectedSound, stopRingtone } from '../../lib/ringtone';
import { toast } from '../../lib/toast';

// TURN + STUN — required for audio behind NAT / college WiFi
const ICE_SERVERS = {
  iceServers: [
    // STUN (public IP discovery)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // OpenRelay TURN (correct hostname: openrelay.metered.ca)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:80?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
  },
  video: false,
};

export default function VoiceCallModal({
  isOpen,
  mode, // 'outgoing' | 'incoming'
  peerUser,
  currentUserId,
  channel,
  roomId,
  onClose,
}) {
  const [callState, setCallState] = useState(mode === 'incoming' ? 'incoming' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [audioOutput, setAudioOutput] = useState('speaker');
  const [isPeerMuted, setIsPeerMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isCancelledRef = useRef(false);
  const remoteStreamRef = useRef(null);

  // ── Duration Timer ──────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // ── Ringtone ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (callState === 'incoming') {
      startIncomingRingtone();
      navigator.vibrate?.([500, 250, 500, 250, 500]);
    } else if (callState === 'calling') {
      startOutgoingRingtone();
    }
    return () => stopRingtone();
  }, [isOpen, callState]);

  // ── Attach audio to <audio> element ────────────────────────────
  const attachAudio = (stream) => {
    if (!stream) return;
    remoteStreamRef.current = stream;
    const el = remoteAudioRef.current;
    if (!el) return;
    el.srcObject = stream;
    el.muted = false;
    el.volume = 1.0;
    el.play().catch(err => {
      console.warn('[Audio autoplay blocked, retrying in 600ms]', err.message);
      setTimeout(() => {
        if (remoteAudioRef.current && remoteStreamRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
          remoteAudioRef.current.play().catch(() => {});
        }
      }, 600);
    });
  };

  // ── Add local mic track to PeerConnection ──────────────────────
  const addLocalTrack = (stream, pc) => {
    if (!stream || !pc || pc.signalingState === 'closed') return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    const existingSender = pc.getSenders().find(s => s.track?.kind === 'audio');
    if (existingSender) {
      existingSender.replaceTrack(track).catch(() => {});
    } else {
      pc.addTrack(track, stream);
    }
  };

  // ── Cleanup ─────────────────────────────────────────────────────
  const cleanup = () => {
    stopRingtone();
    isCancelledRef.current = true;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (pcRef.current) {
      try { if (pcRef.current.signalingState !== 'closed') pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
  };

  // ── Flush pending ICE candidates ───────────────────────────────
  const flushPendingCandidates = async (pc) => {
    while (pendingCandidatesRef.current.length > 0) {
      const c = pendingCandidatesRef.current.shift();
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
  };

  // ── Main WebRTC + Signaling Effect ──────────────────────────────
  useEffect(() => {
    if (!isOpen || !channel) return;

    isCancelledRef.current = false;
    pendingCandidatesRef.current = [];

    let pc = null;
    const offerCreatingRef = { current: false };
    const offerCreatedRef = { current: false };
    const answerSetRef = { current: false };

    // Event buffers — events may arrive BEFORE PC is ready (async ICE fetch)
    let bufferedCallReady = false;
    let bufferedCallOffer = null;
    let bufferedCallAccept = null;

    // ── Helpers (defined before listeners so they can be used in both) ──

    const createAndSendOffer = async () => {
      if (!pc || isCancelledRef.current || pc.signalingState === 'closed') return;
      if (offerCreatingRef.current || offerCreatedRef.current) {
        // Already creating or created — just resend if we have it
        if (offerCreatedRef.current && pc.localDescription) {
          console.log('[WebRTC] Caller: resending offer');
          channel.send({ type: 'broadcast', event: 'call-offer',
            payload: { offer: pc.localDescription, callerId: currentUserId, roomId },
          }).catch(() => {});
        }
        return;
      }
      offerCreatingRef.current = true;
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        if (isCancelledRef.current || pc.signalingState === 'closed') return;
        await pc.setLocalDescription(offer);
        offerCreatedRef.current = true;
        console.log('[WebRTC] Caller: offer created, sending');
        channel.send({ type: 'broadcast', event: 'call-offer',
          payload: { offer: pc.localDescription, callerId: currentUserId, roomId },
        }).catch(() => {});
      } catch (err) {
        offerCreatingRef.current = false;
        console.error('[WebRTC] createOffer error:', err.message);
      }
    };

    const handleOffer = async (offerSDP) => {
      if (!pc || isCancelledRef.current || pc.signalingState === 'closed') return;
      console.log('[WebRTC] Receiver: handleOffer, state=', pc.signalingState);
      try {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
          if (isCancelledRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
          localStreamRef.current = stream;
          addLocalTrack(stream, pc);
        } else {
          addLocalTrack(localStreamRef.current, pc);
        }
        if (isCancelledRef.current || pc.signalingState === 'closed') return;
        await pc.setRemoteDescription(new RTCSessionDescription(offerSDP));
        await flushPendingCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] Receiver: answer sent');
        channel.send({ type: 'broadcast', event: 'call-accept',
          payload: { answer, responderId: currentUserId, roomId },
        }).catch(() => {});
      } catch (err) {
        console.error('[WebRTC] handleOffer error:', err.message);
      }
    };

    const processCallAccept = async (answer) => {
      if (!pc || isCancelledRef.current || answerSetRef.current) return;
      if (pc.signalingState !== 'have-local-offer') {
        console.warn('[WebRTC] call-accept: bad state=', pc.signalingState, '(offer may not be sent yet)');
        return;
      }
      answerSetRef.current = true;
      try {
        console.log('[WebRTC] Caller: setting remote answer');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(pc);
        stopRingtone();
        playConnectedSound();
        setCallState('connected');
      } catch (e) {
        answerSetRef.current = false;
        console.error('[WebRTC] setRemoteDescription(answer) error:', e.message);
      }
    };

    // ── Register ALL channel listeners SYNCHRONOUSLY (before async init) ──
    // This ensures we never miss events due to ICE fetch delay

    channel.on('broadcast', { event: 'call-ready' }, async () => {
      if (mode !== 'outgoing' || isCancelledRef.current) return;
      console.log('[WebRTC] call-ready received');
      if (pc) {
        await createAndSendOffer();
      } else {
        bufferedCallReady = true; // PC not ready yet, buffer it
        console.log('[WebRTC] call-ready buffered (PC not ready)');
      }
    });

    channel.on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
      if (mode !== 'incoming' || !payload?.offer || isCancelledRef.current) return;
      console.log('[WebRTC] call-offer received');
      if (pc) {
        await handleOffer(payload.offer);
      } else {
        bufferedCallOffer = payload.offer; // buffer
        console.log('[WebRTC] call-offer buffered (PC not ready)');
      }
    });

    channel.on('broadcast', { event: 'call-accept' }, async ({ payload }) => {
      if (mode !== 'outgoing' || !payload?.answer || isCancelledRef.current) return;
      console.log('[WebRTC] call-accept received, state=', pc?.signalingState);
      if (pc && pc.signalingState === 'have-local-offer') {
        await processCallAccept(payload.answer);
      } else if (!pc || pc.signalingState !== 'have-local-offer') {
        bufferedCallAccept = payload.answer; // buffer — may arrive before offer completes
        console.log('[WebRTC] call-accept buffered');
      }
    });

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload?.senderId === currentUserId || isCancelledRef.current || !payload?.candidate) return;
      if (pc?.remoteDescription?.type) {
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
      } else {
        pendingCandidatesRef.current.push(payload.candidate);
      }
    });

    channel.on('broadcast', { event: 'call-reject' }, () => endCall());
    channel.on('broadcast', { event: 'call-end' }, () => endCall());
    channel.on('broadcast', { event: 'peer-mute' }, ({ payload }) => {
      if (payload?.senderId !== currentUserId) setIsPeerMuted(!!payload.muted);
    });

    // ── NOW do the async init (listeners are already registered above) ──
    const initPeerConnection = async () => {
      let iceConfig = ICE_SERVERS;
      try {
        const r = await fetch('/api/calls/ice-servers');
        if (r.ok) {
          const d = await r.json();
          if (d.iceServers?.length > 0) iceConfig = { iceServers: d.iceServers, iceCandidatePoolSize: 10 };
        }
      } catch (e) {
        console.warn('[ICE] Using fallback:', e.message);
      }

      if (isCancelledRef.current) return;
      console.log('[WebRTC] ICE servers:', iceConfig.iceServers.length);

      pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (isCancelledRef.current) return;
        console.log('[WebRTC] ontrack fired ✓');
        const stream = event.streams?.[0] ?? new MediaStream([event.track]);
        attachAudio(stream);
        stopRingtone();
        playConnectedSound();
        setCallState('connected');
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate && channel && !isCancelledRef.current) {
          channel.send({ type: 'broadcast', event: 'ice-candidate',
            payload: { candidate, senderId: currentUserId },
          }).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] connectionState:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          if (remoteStreamRef.current && remoteAudioRef.current) attachAudio(remoteStreamRef.current);
          stopRingtone();
          playConnectedSound();
          setCallState('connected');
        } else if (pc.connectionState === 'failed') {
          console.error('[WebRTC] Connection failed — ICE/TURN issue');
          endCall();
        }
      };

      pc.oniceconnectionstatechange = () => console.log('[WebRTC] iceState:', pc.iceConnectionState);

      // Caller: get mic ready
      if (mode === 'outgoing') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
          if (isCancelledRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
          localStreamRef.current = stream;
          addLocalTrack(stream, pc);
          console.log('[WebRTC] Caller: mic ready ✓');
        } catch (err) {
          console.error('[WebRTC] Mic error:', err.message);
          toast.error('Microphone permission required');
          endCall();
          return;
        }
      }

      // ── Process any buffered events that arrived during async init ──
      if (bufferedCallReady && mode === 'outgoing') {
        console.log('[WebRTC] Processing buffered call-ready');
        bufferedCallReady = false;
        await createAndSendOffer();
      }
      if (bufferedCallOffer && mode === 'incoming') {
        console.log('[WebRTC] Processing buffered call-offer');
        const offer = bufferedCallOffer;
        bufferedCallOffer = null;
        await handleOffer(offer);
      }
      // Buffered answer: process AFTER offer is created (via createAndSendOffer above)
      if (bufferedCallAccept && mode === 'outgoing' && offerCreatedRef.current) {
        console.log('[WebRTC] Processing buffered call-accept');
        const answer = bufferedCallAccept;
        bufferedCallAccept = null;
        await processCallAccept(answer);
      }
    };

    initPeerConnection();

    return () => {
      isCancelledRef.current = true;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, channel]);

  // ── Accept incoming call ─────────────────────────────────────────
  const handleAcceptCall = async () => {
    setCallState('connecting');
    stopRingtone();

    try {
      // MUST unlock audio on user gesture (browser autoplay policy)
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
      }

      // Get mic on accept
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      localStreamRef.current = stream;
      const pc = pcRef.current;
      if (pc && pc.signalingState !== 'closed') {
        addLocalTrack(stream, pc);
      }

      // Tell caller we're ready — they will send the offer
      if (channel) {
        const sendReady = () => channel.send({
          type: 'broadcast',
          event: 'call-ready',
          payload: { responderId: currentUserId, roomId },
        }).catch(() => {});

        sendReady();
        setTimeout(sendReady, 600); // backup pulse
        setTimeout(sendReady, 1500); // second backup for slow networks
      }
    } catch {
      toast.error('Microphone permission required');
      handleDeclineCall();
    }
  };

  const handleDeclineCall = () => {
    stopRingtone();
    channel?.send({
      type: 'broadcast',
      event: 'call-reject',
      payload: { responderId: currentUserId, roomId },
    }).catch(() => {});
    endCall();
  };

  const handleEndCall = () => {
    stopRingtone();
    channel?.send({
      type: 'broadcast',
      event: 'call-end',
      payload: { senderId: currentUserId, roomId },
    }).catch(() => {});
    cleanup();
    setCallState('ended');
    setTimeout(onClose, 1000);
  };

  const endCall = () => {
    cleanup();
    setCallState('ended');
    setTimeout(onClose, 1000);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    pcRef.current?.getSenders().forEach(s => {
      if (s.track?.kind === 'audio') s.track.enabled = !next;
    });
    channel?.send({
      type: 'broadcast',
      event: 'peer-mute',
      payload: { senderId: currentUserId, muted: next },
    }).catch(() => {});
  };

  const toggleSpeaker = async () => {
    const next = audioOutput === 'speaker' ? 'earpiece' : 'speaker';
    setAudioOutput(next);
    const el = remoteAudioRef.current;
    if (!el) return;
    if (typeof el.setSinkId === 'function') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        const target = next === 'speaker'
          ? outputs.find(d => d.label.toLowerCase().includes('speaker') || d.deviceId.includes('speaker'))
          : outputs.find(d => d.label.toLowerCase().includes('earpiece') || d.deviceId === 'default');
        if (target?.deviceId) await el.setSinkId(target.deviceId);
      } catch (e) { console.warn('[AudioSink]', e.message); }
    }
    el.muted = false;
    el.volume = next === 'speaker' ? 1.0 : 0.6;
    toast.success(next === 'speaker' ? '🔊 Loudspeaker' : '🎧 Earpiece');
  };

  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!isOpen) return null;

  const peerName = peerUser?.name || 'Campus Student';
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(peerName)}&background=F05A00&color=ffffff&size=256&bold=true&format=png`;
  const avatar = peerUser?.photo || getUserAvatarUrl(peerUser) || fallback;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#1C1917] flex flex-col justify-between items-center text-white select-none overflow-hidden pb-8 pt-10 px-6 anim-fade-in">

      {/* Hidden audio element — MUST be in DOM always, not muted */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img src={avatar} alt="" className="w-full h-full object-cover opacity-15 blur-3xl scale-125"
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/90 to-zinc-950" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#6D28D9]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-emerald-400 text-[11px] font-bold uppercase tracking-wider shadow-sm">
          <Lock size={12} strokeWidth={2.5} />
          <span>End-to-End Encrypted Voice</span>
        </div>
      </div>

      {/* Center hero */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-6">
        <div className="relative flex items-center justify-center mb-8">
          {(callState === 'calling' || callState === 'incoming') && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-[#6D28D9]/20 animate-ping opacity-40" />
              <div className="absolute w-52 h-52 rounded-full border border-[#6D28D9]/30 animate-pulse" />
            </>
          )}
          {callState === 'connected' && (
            <>
              <div className="absolute w-40 h-40 rounded-full border-2 border-emerald-500/40 animate-pulse" />
              <div className="absolute w-48 h-48 rounded-full border border-emerald-500/20" />
            </>
          )}
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white/20 bg-[#1C1917] relative z-10 shadow-2xl ring-4 ring-[#6D28D9]/20">
            <img src={avatar} alt="" className="w-full h-full object-cover"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }} />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 truncate max-w-[320px]">{peerName}</h2>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
          {callState === 'calling' && <><span className="w-2.5 h-2.5 rounded-full bg-[#6D28D9] animate-ping" /><span className="text-sm font-bold text-[#A8A29E]">Calling...</span></>}
          {callState === 'incoming' && <><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-sm font-bold text-emerald-400">Incoming Voice Call</span></>}
          {callState === 'connecting' && <><Loader2 size={14} className="animate-spin text-[#6D28D9]" /><span className="text-sm font-bold text-[#A8A29E]">Connecting Audio...</span></>}
          {callState === 'connected' && <><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-base font-bold text-emerald-400 tracking-wider">{formatDuration(duration)}</span></>}
          {callState === 'ended' && <span className="text-sm font-bold text-[#A8A29E]">Call Ended</span>}
        </div>

        {callState === 'connected' && isPeerMuted && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
            <MicOff size={13} /><span>{peerName} is muted</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {callState === 'incoming' ? (
          <div className="w-full flex items-center justify-around px-4">
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={handleDeclineCall}
                className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 active:scale-90 transition-all cursor-pointer ring-4 ring-rose-600/30">
                <PhoneOff size={28} />
              </button>
              <span className="text-xs font-bold text-[#A8A29E]">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={handleAcceptCall}
                className="w-18 h-18 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 active:scale-90 transition-all cursor-pointer ring-4 ring-emerald-500/30 animate-bounce">
                <Phone size={28} />
              </button>
              <span className="text-xs font-bold text-emerald-400">Accept</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6 p-4 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl">
            <div className="flex flex-col items-center gap-1.5">
              <button type="button" onClick={toggleMute}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${isMuted ? 'bg-rose-600 text-white ring-2 ring-rose-400' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}>
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <span className="text-[11px] font-bold text-[#A8A29E]">{isMuted ? 'Unmute' : 'Mute'}</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button type="button" onClick={toggleSpeaker}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${audioOutput === 'speaker' ? 'bg-[#6D28D9] text-white ring-2 ring-[#E4D9F7]/50' : 'bg-white/15 text-white border border-white/20 hover:bg-white/25'}`}>
                {audioOutput === 'speaker' ? <Volume2 size={22} /> : <Volume1 size={22} />}
              </button>
              <span className="text-[11px] font-bold text-[#A8A29E]">{audioOutput === 'speaker' ? 'Speaker' : 'Earpiece'}</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button type="button" onClick={handleEndCall}
                className="w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer ring-2 ring-rose-500/30">
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
