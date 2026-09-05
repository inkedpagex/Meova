'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Volume1,
  Loader2,
  Lock,
  Video,
  VideoOff,
  SwitchCamera,
  Maximize2,
  Minimize2,
} from '@/lib/icons';
import { getUserAvatarUrl } from '../../utils/avatar';
import { startIncomingRingtone, startOutgoingRingtone, playConnectedSound, stopRingtone } from '../../lib/ringtone';
import { toast } from '../../lib/toast';

// TURN + STUN — for reliable NAT & campus Wi-Fi traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
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
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  channelCount: { ideal: 1 },
};

export default function VoiceCallModal({
  isOpen,
  mode, // 'outgoing' | 'incoming'
  callType = 'voice', // 'voice' | 'video'
  peerUser,
  currentUserId,
  channel,
  roomId,
  onClose,
}) {
  const [callState, setCallState] = useState(mode === 'incoming' ? 'incoming' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [audioOutput, setAudioOutput] = useState('speaker');
  const [isPeerMuted, setIsPeerMuted] = useState(false);
  const [isPeerVideoOff, setIsPeerVideoOff] = useState(callType !== 'video');
  const [duration, setDuration] = useState(0);
  const [isPiPMinimized, setIsPiPMinimized] = useState(false);

  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isCancelledRef = useRef(false);
  const remoteStreamRef = useRef(null);

  const isVideoCall = callType === 'video' || isVideoEnabled;

  // ── Duration Timer ──────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
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
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([500, 250, 500, 250, 500]);
      }
    } else if (callState === 'calling') {
      startOutgoingRingtone();
    }
    return () => stopRingtone();
  }, [isOpen, callState]);

  // ── Attach remote media to elements ─────────────────────────────
  const attachRemoteStream = useCallback((stream) => {
    if (!stream) return;
    remoteStreamRef.current = stream;

    // Attach audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch((err) => {
        console.warn('[Remote audio autoplay blocked]', err.message);
        setTimeout(() => {
          if (remoteAudioRef.current && remoteStreamRef.current) {
            remoteAudioRef.current.srcObject = remoteStreamRef.current;
            remoteAudioRef.current.play().catch(() => {});
          }
        }, 500);
      });
    }

    // Attach video if present
    if (remoteVideoRef.current && stream.getVideoTracks().length > 0) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
      setIsPeerVideoOff(false);
    }
  }, []);

  // ── Attach local preview video ──────────────────────────────────
  const attachLocalStream = useCallback((stream) => {
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
  }, []);

  // ── Add local tracks to PeerConnection ──────────────────────────
  const addLocalTracksToPC = useCallback((stream, pc) => {
    if (!stream || !pc || pc.signalingState === 'closed') return;
    stream.getTracks().forEach((track) => {
      const existingSender = pc.getSenders().find((s) => s.track?.kind === track.kind);
      if (existingSender) {
        existingSender.replaceTrack(track).catch(() => {});
      } else {
        try {
          pc.addTrack(track, stream);
        } catch (e) {
          console.warn('[WebRTC addTrack error]', e.message);
        }
      }
    });
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    stopRingtone();
    isCancelledRef.current = true;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      try {
        if (pcRef.current.signalingState !== 'closed') pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
  }, []);

  // ── Flush pending ICE candidates ───────────────────────────────
  const flushPendingCandidates = async (pc) => {
    while (pendingCandidatesRef.current.length > 0) {
      const c = pendingCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {}
    }
  };

  // ── Media acquisition helper ────────────────────────────────────
  const getLocalMedia = async (withVideo = isVideoCall, cameraFacing = facingMode) => {
    const constraints = {
      audio: AUDIO_CONSTRAINTS,
      video: withVideo
        ? {
            facingMode: cameraFacing,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          }
        : false,
    };
    return navigator.mediaDevices.getUserMedia(constraints);
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

    let bufferedCallReady = false;
    let bufferedCallOffer = null;
    let bufferedCallAccept = null;

    const createAndSendOffer = async () => {
      if (!pc || isCancelledRef.current || pc.signalingState === 'closed') return;
      if (offerCreatingRef.current || offerCreatedRef.current) {
        if (offerCreatedRef.current && pc.localDescription) {
          channel
            .send({
              type: 'broadcast',
              event: 'call-offer',
              payload: {
                offer: pc.localDescription,
                callerId: currentUserId,
                roomId,
                callType,
              },
            })
            .catch(() => {});
        }
        return;
      }
      offerCreatingRef.current = true;
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideoCall,
        });
        if (isCancelledRef.current || pc.signalingState === 'closed') return;
        await pc.setLocalDescription(offer);
        offerCreatedRef.current = true;
        channel
          .send({
            type: 'broadcast',
            event: 'call-offer',
            payload: {
              offer: pc.localDescription,
              callerId: currentUserId,
              roomId,
              callType,
            },
          })
          .catch(() => {});
      } catch (err) {
        offerCreatingRef.current = false;
        console.error('[WebRTC] createOffer error:', err.message);
      }
    };

    const handleOffer = async (offerSDP) => {
      if (!pc || isCancelledRef.current || pc.signalingState === 'closed') return;
      try {
        if (!localStreamRef.current) {
          const stream = await getLocalMedia();
          if (isCancelledRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          attachLocalStream(stream);
          addLocalTracksToPC(stream, pc);
        } else {
          addLocalTracksToPC(localStreamRef.current, pc);
        }
        if (isCancelledRef.current || pc.signalingState === 'closed') return;
        await pc.setRemoteDescription(new RTCSessionDescription(offerSDP));
        await flushPendingCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel
          .send({
            type: 'broadcast',
            event: 'call-accept',
            payload: { answer, responderId: currentUserId, roomId },
          })
          .catch(() => {});
      } catch (err) {
        console.error('[WebRTC] handleOffer error:', err.message);
      }
    };

    const processCallAccept = async (answer) => {
      if (!pc || isCancelledRef.current || answerSetRef.current) return;
      if (pc.signalingState !== 'have-local-offer') return;
      answerSetRef.current = true;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(pc);
        stopRingtone();
        playConnectedSound();
        setCallState('connected');
      } catch (e) {
        answerSetRef.current = false;
        console.error('[WebRTC] setRemoteDescription error:', e.message);
      }
    };

    // ── Synchronous Channel Listeners ─────────────────────────────
    channel.on('broadcast', { event: 'call-ready' }, async () => {
      if (mode !== 'outgoing' || isCancelledRef.current) return;
      if (pc) {
        await createAndSendOffer();
      } else {
        bufferedCallReady = true;
      }
    });

    channel.on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
      if (mode !== 'incoming' || !payload?.offer || isCancelledRef.current) return;
      if (pc) {
        await handleOffer(payload.offer);
      } else {
        bufferedCallOffer = payload.offer;
      }
    });

    channel.on('broadcast', { event: 'call-accept' }, async ({ payload }) => {
      if (mode !== 'outgoing' || !payload?.answer || isCancelledRef.current) return;
      if (pc && pc.signalingState === 'have-local-offer') {
        await processCallAccept(payload.answer);
      } else {
        bufferedCallAccept = payload.answer;
      }
    });

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload?.senderId === currentUserId || isCancelledRef.current || !payload?.candidate) return;
      if (pc?.remoteDescription?.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {}
      } else {
        pendingCandidatesRef.current.push(payload.candidate);
      }
    });

    channel.on('broadcast', { event: 'call-reject' }, () => endCall());
    channel.on('broadcast', { event: 'call-end' }, () => endCall());
    channel.on('broadcast', { event: 'peer-mute' }, ({ payload }) => {
      if (payload?.senderId !== currentUserId) setIsPeerMuted(!!payload.muted);
    });
    channel.on('broadcast', { event: 'peer-video-toggle' }, ({ payload }) => {
      if (payload?.senderId !== currentUserId) setIsPeerVideoOff(!payload.videoEnabled);
    });

    // ── Initialize RTCPeerConnection ──────────────────────────────
    const initPeerConnection = async () => {
      let iceConfig = ICE_SERVERS;
      try {
        const r = await fetch('/api/calls/ice-servers');
        if (r.ok) {
          const d = await r.json();
          if (d.iceServers?.length > 0) iceConfig = { iceServers: d.iceServers, iceCandidatePoolSize: 10 };
        }
      } catch (e) {
        console.warn('[ICE] Fallback active:', e.message);
      }

      if (isCancelledRef.current) return;

      pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (isCancelledRef.current) return;
        const stream = event.streams?.[0] ?? new MediaStream([event.track]);
        attachRemoteStream(stream);
        stopRingtone();
        playConnectedSound();
        setCallState('connected');
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate && channel && !isCancelledRef.current) {
          channel
            .send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: { candidate, senderId: currentUserId },
            })
            .catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          if (remoteStreamRef.current) attachRemoteStream(remoteStreamRef.current);
          stopRingtone();
          playConnectedSound();
          setCallState('connected');
        } else if (pc.connectionState === 'failed') {
          endCall();
        }
      };

      // Caller mic + camera acquisition
      if (mode === 'outgoing') {
        try {
          const stream = await getLocalMedia();
          if (isCancelledRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          attachLocalStream(stream);
          addLocalTracksToPC(stream, pc);
        } catch (err) {
          console.error('[WebRTC] Media error:', err.message);
          toast.error('Camera & microphone permissions required');
          endCall();
          return;
        }
      }

      // Process buffered events
      if (bufferedCallReady && mode === 'outgoing') {
        bufferedCallReady = false;
        await createAndSendOffer();
      }
      if (bufferedCallOffer && mode === 'incoming') {
        const offer = bufferedCallOffer;
        bufferedCallOffer = null;
        await handleOffer(offer);
      }
      if (bufferedCallAccept && mode === 'outgoing' && offerCreatedRef.current) {
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
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
      }

      const stream = await getLocalMedia();
      attachLocalStream(stream);
      const pc = pcRef.current;
      if (pc && pc.signalingState !== 'closed') {
        addLocalTracksToPC(stream, pc);
      }

      if (channel) {
        const sendReady = () =>
          channel
            .send({
              type: 'broadcast',
              event: 'call-ready',
              payload: { responderId: currentUserId, roomId },
            })
            .catch(() => {});

        sendReady();
        setTimeout(sendReady, 600);
        setTimeout(sendReady, 1500);
      }
    } catch {
      toast.error('Permissions required to join call');
      handleDeclineCall();
    }
  };

  const handleDeclineCall = () => {
    stopRingtone();
    channel
      ?.send({
        type: 'broadcast',
        event: 'call-reject',
        payload: { responderId: currentUserId, roomId },
      })
      .catch(() => {});
    endCall();
  };

  const handleEndCall = () => {
    stopRingtone();
    channel
      ?.send({
        type: 'broadcast',
        event: 'call-end',
        payload: { senderId: currentUserId, roomId },
      })
      .catch(() => {});
    cleanup();
    setCallState('ended');
    setTimeout(onClose, 800);
  };

  const endCall = () => {
    cleanup();
    setCallState('ended');
    setTimeout(onClose, 800);
  };

  // ── Toggle Microphone ────────────────────────────────────────────
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    pcRef.current?.getSenders().forEach((s) => {
      if (s.track?.kind === 'audio') s.track.enabled = !next;
    });
    channel
      ?.send({
        type: 'broadcast',
        event: 'peer-mute',
        payload: { senderId: currentUserId, muted: next },
      })
      .catch(() => {});
  };

  // ── Toggle Video Camera ──────────────────────────────────────────
  const toggleCamera = async () => {
    const next = !isVideoEnabled;
    setIsVideoEnabled(next);

    const currentStream = localStreamRef.current;
    if (next) {
      // Turn camera on
      if (currentStream && currentStream.getVideoTracks().length > 0) {
        currentStream.getVideoTracks().forEach((t) => (t.enabled = true));
      } else {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          const videoTrack = videoStream.getVideoTracks()[0];
          if (videoTrack) {
            currentStream?.addTrack(videoTrack);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = currentStream;
              localVideoRef.current.play().catch(() => {});
            }
            const pc = pcRef.current;
            if (pc && pc.signalingState !== 'closed') {
              const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(videoTrack);
              } else {
                pc.addTrack(videoTrack, currentStream);
              }
            }
          }
        } catch (e) {
          console.warn('[Camera Enable Error]', e.message);
          toast.error('Camera permission required');
          setIsVideoEnabled(false);
          return;
        }
      }
    } else {
      // Turn camera off
      currentStream?.getVideoTracks().forEach((t) => (t.enabled = false));
    }

    channel
      ?.send({
        type: 'broadcast',
        event: 'peer-video-toggle',
        payload: { senderId: currentUserId, videoEnabled: next },
      })
      .catch(() => {});
  };

  // ── Flip Camera (Front ⇋ Back) ───────────────────────────────────
  const flipCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const newTrack = newStream.getVideoTracks()[0];

      if (newTrack) {
        const oldTrack = localStreamRef.current?.getVideoTracks()[0];
        if (oldTrack) {
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStreamRef.current?.addTrack(newTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }

        const pc = pcRef.current;
        if (pc && pc.signalingState !== 'closed') {
          const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(newTrack);
          }
        }
        toast.success(nextFacing === 'user' ? '🤳 Front Camera' : '📷 Rear Camera');
      }
    } catch (e) {
      console.warn('[Flip Camera Error]', e.message);
    }
  };

  // ── Toggle Speaker / Earpiece ────────────────────────────────────
  const toggleSpeaker = async () => {
    const next = audioOutput === 'speaker' ? 'earpiece' : 'speaker';
    setAudioOutput(next);
    const el = remoteAudioRef.current;
    if (!el) return;
    if (typeof el.setSinkId === 'function') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === 'audiooutput');
        const target =
          next === 'speaker'
            ? outputs.find((d) => d.label.toLowerCase().includes('speaker') || d.deviceId.includes('speaker'))
            : outputs.find((d) => d.label.toLowerCase().includes('earpiece') || d.deviceId === 'default');
        if (target?.deviceId) await el.setSinkId(target.deviceId);
      } catch (e) {
        console.warn('[AudioSink]', e.message);
      }
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
    <div className="fixed inset-0 z-[999999] bg-[#0C0A09] flex flex-col justify-between items-center text-white select-none overflow-hidden pb-8 pt-8 px-4 anim-fade-in">
      {/* Hidden audio element */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />

      {/* ── REMOTE VIDEO VIEW (Full Screen Background in Video Call) ── */}
      {callState === 'connected' && isVideoCall && !isPeerVideoOff ? (
        <div className="absolute inset-0 z-0 bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        </div>
      ) : (
        /* Ambient Voice / Camera Off Background */
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src={avatar}
            alt=""
            className="w-full h-full object-cover opacity-20 blur-3xl scale-125"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallback;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C0A09]/90 via-[#0C0A09]/95 to-[#0C0A09]" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--accent-tint-10)] rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* ── LOCAL SELFIE PREVIEW PiP (Video Calls) ── */}
      {isVideoCall && isVideoEnabled && callState !== 'ended' && (
        <div
          className={`absolute z-30 transition-all duration-300 ${
            isPiPMinimized
              ? 'top-4 right-4 w-16 h-24'
              : 'top-14 right-4 w-28 h-40 sm:w-36 sm:h-48'
          } rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black`}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          <button
            type="button"
            onClick={() => setIsPiPMinimized(!isPiPMinimized)}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white"
            title={isPiPMinimized ? 'Maximize' : 'Minimize'}
          >
            {isPiPMinimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          </button>
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <div className="relative z-20 flex flex-col items-center gap-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-400 text-[11px] font-bold uppercase tracking-wider shadow-sm">
          <Lock size={12} strokeWidth={2.5} />
          <span>End-to-End Encrypted {isVideoCall ? 'Video' : 'Voice'}</span>
        </div>
      </div>

      {/* ── Center Identity / Avatar Hero (Visible when Peer Video is Off or in Voice Call) ── */}
      {(!isVideoCall || isPeerVideoOff || callState !== 'connected') && (
        <div className="relative z-20 flex flex-col items-center text-center my-auto py-4">
          <div className="relative flex items-center justify-center mb-6">
            {(callState === 'calling' || callState === 'incoming') && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-[var(--accent-tint-20)] animate-ping opacity-40" />
                <div className="absolute w-52 h-52 rounded-full border border-[var(--accent-tint-20)] animate-pulse" />
              </>
            )}
            {callState === 'connected' && (
              <>
                <div className="absolute w-36 h-36 rounded-full border-2 border-emerald-500/40 animate-pulse" />
                <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20" />
              </>
            )}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20 bg-[#0C0A09] relative z-10 shadow-2xl ring-4 ring-[var(--accent)]/20">
              <img
                src={avatar}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallback;
                }}
              />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 truncate max-w-[320px]">
            {peerName}
          </h2>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            {callState === 'calling' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
                <span className="text-xs font-bold text-white/80">Calling…</span>
              </>
            )}
            {callState === 'incoming' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">
                  Incoming {isVideoCall ? 'Video' : 'Voice'} Call
                </span>
              </>
            )}
            {callState === 'connecting' && (
              <>
                <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                <span className="text-xs font-bold text-white/80">Connecting…</span>
              </>
            )}
            {callState === 'connected' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-emerald-400 tracking-wider">
                  {formatDuration(duration)}
                </span>
              </>
            )}
            {callState === 'ended' && <span className="text-xs font-bold text-white/70">Call Ended</span>}
          </div>

          {callState === 'connected' && isPeerMuted && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
              <MicOff size={13} />
              <span>{peerName} is muted</span>
            </div>
          )}
        </div>
      )}

      {/* ── Active Video Call Floating Duration Badge ── */}
      {callState === 'connected' && isVideoCall && !isPeerVideoOff && (
        <div className="relative z-20 flex flex-col items-center gap-1.5 mt-auto mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider">{peerName}</span>
            <span className="text-white/40">·</span>
            <span className="text-xs font-bold text-emerald-400">{formatDuration(duration)}</span>
          </div>
          {isPeerMuted && (
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/40 backdrop-blur-md border border-rose-500/50 text-rose-200 text-[11px] font-bold">
              <MicOff size={11} />
              <span>{peerName} is muted</span>
            </div>
          )}
        </div>
      )}

      {/* ── Call Control Actions ── */}
      <div className="relative z-20 w-full max-w-md flex flex-col items-center">
        {callState === 'incoming' ? (
          <div className="w-full flex items-center justify-around px-6">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleDeclineCall}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 active:scale-90 transition-all cursor-pointer ring-4 ring-rose-600/30"
              >
                <PhoneOff size={26} />
              </button>
              <span className="text-xs font-bold text-white/80 whitespace-nowrap">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptCall}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 active:scale-90 transition-all cursor-pointer ring-4 ring-emerald-500/30 animate-bounce"
              >
                {isVideoCall ? <Video size={26} /> : <Phone size={26} />}
              </button>
              <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">Accept</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[32px] bg-black/60 backdrop-blur-2xl border border-white/15 shadow-2xl">
            {/* Mic Toggle */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={toggleMute}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                  isMuted
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </div>

            {/* Video Camera Toggle */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={toggleCamera}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                  !isVideoEnabled
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
                title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
              >
                {!isVideoEnabled ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">
                {isVideoEnabled ? 'Cam On' : 'Cam Off'}
              </span>
            </div>

            {/* Flip Camera (Active when camera is ON) */}
            {isVideoEnabled && (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={flipCamera}
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="Flip Camera"
                >
                  <SwitchCamera size={20} />
                </button>
                <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">Flip</span>
              </div>
            )}

            {/* Speaker / Earpiece Toggle */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={toggleSpeaker}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                  audioOutput === 'speaker'
                    ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent-tint-20)]/50'
                    : 'bg-white/15 text-white border border-white/20 hover:bg-white/25'
                }`}
                title={audioOutput === 'speaker' ? 'Loudspeaker' : 'Earpiece'}
              >
                {audioOutput === 'speaker' ? <Volume2 size={20} /> : <Volume1 size={20} />}
              </button>
              <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">
                {audioOutput === 'speaker' ? 'Speaker' : 'Earpiece'}
              </span>
            </div>

            {/* Hangup Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleEndCall}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer ring-2 ring-rose-500/40"
                title="End Call"
              >
                <PhoneOff size={20} />
              </button>
              <span className="text-[10px] font-bold text-rose-400 whitespace-nowrap">End</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
