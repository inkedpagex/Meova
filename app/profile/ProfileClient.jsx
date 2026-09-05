'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ArrowLeft, Share2, Zap, Check, Radio, ShieldAlert, ShieldCheck, Crown,
  Edit3, Users, Calendar, Tag, ChevronRight, MapPin, Bell, Camera, X, Briefcase, Coffee, QrCode, ExternalLink, Phone, CheckCircle2, Loader2, Download,
  Trash2, Heart, Plus, Palette
} from '@/lib/icons';
import { useTheme } from '../../components/providers/ThemeProvider';
import { useUserContext } from '../../components/providers/UserProvider';
import { Linkedin, Github } from '../../components/ui/SocialIcons';
import { QRCodeCanvas } from 'qrcode.react';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import { getUserAvatarUrl } from '../../utils/avatar';
import { updateProfileAdmin } from '../../features/profile/profile.actions';
import { toast } from '../../lib/toast';
import PWAInstallModal from '../../components/PWAInstallModal';
import ZoomableProfileAvatar from '../../components/ZoomableProfileAvatar';
import CampusMomentsGallery from '../../components/CampusMomentsGallery';
import { formatPostDate } from '../../utils/dateFormatter';
import HostBadge from '../../components/HostBadge';
import VerificationModal from '../../components/verification/VerificationModal';

const InstagramIcon = ({ size = 14 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

// Premium empty state card
function EmptyState({ icon: Icon, title, subtitle, action, onAction }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col items-center text-center gap-3"
      style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-mid)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: '#f3f0ff', color: 'var(--accent)' }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={onAction}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

export default function ProfileClient({ initialProfile, initialSparks = 0, initialGigs = [], initialPosts = [] }) {
  const router = useRouter();
  const { mode, currentAccent, openThemeModal } = useTheme();
  let contextUser = null;
  let contextWallet = null;
  try {
    const userCtx = useUserContext();
    contextUser = userCtx?.user;
    contextWallet = userCtx?.wallet;
  } catch {}

  const resolvedProfile = initialProfile || contextUser;
  const [profile, setProfile] = useState(resolvedProfile);
  const [posts, setPosts] = useState(initialPosts);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isIdOn, setIsIdOn] = useState(resolvedProfile?.isIdOn !== undefined ? resolvedProfile.isIdOn : true);
  const [copied, setCopied] = useState(false);

  const initialTotalSparks = contextWallet
    ? (contextWallet.purchased || 0) + (contextWallet.bonus || 0) + (contextWallet.creator || 0)
    : initialSparks;
  const [sparksBalance, setSparksBalance] = useState(initialTotalSparks);

  useEffect(() => {
    if (initialProfile) setProfile(initialProfile);
    else if (contextUser) setProfile(prev => prev || contextUser);
  }, [initialProfile, contextUser]);

  useEffect(() => {
    if (contextWallet) {
      const total = (contextWallet.purchased || 0) + (contextWallet.bonus || 0) + (contextWallet.creator || 0);
      setSparksBalance(total);
    } else if (initialSparks !== undefined) {
      setSparksBalance(initialSparks);
    }
  }, [contextWallet, initialSparks]);

  useEffect(() => {
    if (initialPosts) setPosts(initialPosts);
  }, [initialPosts]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this moment? This cannot be undone.')) return;
    setDeletingPostId(postId);
    try {
      const res = await fetch(`/api/posts?id=${postId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to delete moment');
        return;
      }
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Moment deleted successfully.');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setDeletingPostId(null);
    }
  };

  // App Permissions State
  const [locStatus, setLocStatus] = useState('prompt');
  const [notifStatus, setNotifStatus] = useState('prompt');
  const [camStatus, setCamStatus] = useState('prompt');
  const [isStandalone, setIsStandalone] = useState(true);

  // Phone verification
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState('input'); // 'input' | 'otp'
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState({ type: '', text: '' });
  const [phoneVerified, setPhoneVerified] = useState(!!initialProfile?.phone_verified);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions) {
      // Check Location
      navigator.permissions.query({ name: 'geolocation' }).then(res => {
        setLocStatus(res.state);
        res.onchange = () => setLocStatus(res.state);
      }).catch(() => {});
      
      // Check Camera
      navigator.permissions.query({ name: 'camera' }).then(res => {
        setCamStatus(res.state);
        res.onchange = () => setCamStatus(res.state);
      }).catch(() => {});
    }
    
    // Check Notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifStatus(Notification.permission);
    }

    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsStandalone(standalone);
    }
  }, []);

  const handleManualInstall = async () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('Meova_pwa_dismissed');

    // 1. If browser has captured native prompt, trigger 1-click install dialog
    if (window.deferredPWAInstallPrompt) {
      try {
        window.deferredPWAInstallPrompt.prompt();
        const { outcome } = await window.deferredPWAInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          window.deferredPWAInstallPrompt = null;
          setIsStandalone(true);
          return;
        }
      } catch (err) {
        console.error('PWA prompt error:', err);
      }
    }

    // 2. Otherwise open the branded step-by-step install guide modal
    setShowInstallGuide(true);
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocStatus('granted'),
      () => setLocStatus('denied')
    );
  };

  const requestNotifications = async () => {
    try {
      const { requestNativePushPermission } = await import('../../lib/useNativePush');
      const granted = await requestNativePushPermission(profile?.id);
      setNotifStatus(granted ? 'granted' : 'denied');
      if (granted) {
        window.dispatchEvent(new Event('Meova_notif_granted'));
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  };

  const requestCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setCamStatus('granted');
      }
    } catch {
      setCamStatus('denied');
    }
  };

  useEffect(() => {
    if (profile?.id && typeof window !== 'undefined') {
      const load = () => {
        if (profile?.isIdOn !== undefined) setIsIdOn(profile.isIdOn);
      };
      load();
      window.addEventListener('profile-updated', load);
      window.addEventListener('wallet-updated', load);
      return () => {
        window.removeEventListener('profile-updated', load);
        window.removeEventListener('wallet-updated', load);
      };
    }
  }, [profile?.id]);



  const handleToggleId = async () => {
    const next = !isIdOn;
    setIsIdOn(next);
    if (profile?.id) {
      await updateProfileAdmin({ isIdOn: next });
      window.dispatchEvent(new Event('profile-updated'));
    }
  };

  const handleSendOtp = async () => {
    setPhoneLoading(true); setPhoneMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/verify-phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneMsg({ type: 'error', text: data.error }); return; }
      setPhoneStep('otp');
      setPhoneMsg({ type: 'success', text: data.message });
      if (data._dev_otp) setPhoneMsg({ type: 'success', text: `[DEV] OTP: ${data._dev_otp}` });
    } catch { setPhoneMsg({ type: 'error', text: 'Network error. Try again.' }); }
    finally { setPhoneLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setPhoneLoading(true); setPhoneMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/verify-phone/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneMsg({ type: 'error', text: data.error }); return; }
      setPhoneVerified(true);
      setShowPhoneModal(false);
      setPhoneMsg({ type: '', text: '' });
    } catch { setPhoneMsg({ type: 'error', text: 'Network error. Try again.' }); }
    finally { setPhoneLoading(false); }
  };

  const handleSaveSuccess = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
    setIsEditing(false);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/users/${profile.id}`;
      if (navigator.share) {
        navigator.share({
          title: `${profile.full_name || 'Student'} on Meova`,
          text: `Check out @${profile.username || 'student'} on Meova!`,
          url: url
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    }
  };

  const avatarSrc = getUserAvatarUrl(profile);

  const hasInterests = profile?.interests?.length > 0;
  const yearLabel = profile?.year ? (profile.year.includes('Year') ? profile.year : `${profile.year} Year`) : null;
  const branchLabel = profile?.branch || null;
  const universityLabel = profile?.university || null;

  return (
    <>
      <div className="min-h-screen px-4 py-4 max-w-[500px] mx-auto pb-24 anim-fade-in" style={{ background: 'var(--bg-base)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-3">
            {isEditing && (
              <button onClick={() => setIsEditing(false)}
                className="p-2 rounded-xl border cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <ArrowLeft size={16} strokeWidth={2.5} />
              </button>
            )}
            <h1 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              {isEditing ? 'Edit Profile' : 'My Profile'}
            </h1>
          </div>
          {!isEditing && (
            <div>
              <button onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-xl border cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <Settings size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="rounded-[24px] p-6 bg-white border border-[#E7E5E4] shadow-sm">
            <ProfileEditForm initialProfile={profile} onSaveSuccess={handleSaveSuccess} />
          </div>
        ) : (
          <div className="space-y-4">

          {/* ── Avatar Profile Header Card (Card Type 3) ─────────────────────────────── */}
          <div className="rounded-[20px] p-6 flex flex-col items-center text-center relative overflow-hidden bg-white border border-[#E7E5E4] shadow-xs">
            {/* 96px Avatar with 3px Accent Ring + Offset */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full p-1 border-[3px] border-[var(--accent)] bg-white flex items-center justify-center">
                <ZoomableProfileAvatar
                  src={avatarSrc}
                  alt={profile?.full_name}
                  name={profile?.full_name}
                  username={profile?.username}
                  sizeClass="w-full h-full"
                  ringColor="transparent"
                  isIdOn={false}
                />
              </div>
            </div>

            {/* Name */}
            <h2 className="text-[22px] font-bold text-[#1C1917] tracking-tight">
              {profile?.full_name || 'Your Name'}
            </h2>

            {/* Username and Host Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {profile?.username && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-white text-[#78716C] border border-[#E7E5E4]">
                  @{profile.username}
                </span>
              )}
              <HostBadge role={profile?.role} size="sm" />
            </div>

            {/* Year · Branch */}
            {(yearLabel || branchLabel) && (
              <p className="text-[14px] font-medium text-[#78716C] mt-2">
                {[yearLabel, branchLabel].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* University */}
            {universityLabel && (
              <p className="text-[14px] font-medium text-[#78716C] mt-0.5">{universityLabel}</p>
            )}

            {/* Bio */}
            <p className="text-[14px] leading-relaxed mt-3 text-[#78716C] max-w-[90%] italic">
              {profile?.bio || 'No bio yet — tap Edit Profile to add one.'}
            </p>

            {/* Social Links Row */}
            {(profile?.instagram || profile?.linkedin || profile?.github) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {profile?.instagram && (
                  <a href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-tint-10)] text-[11px] font-bold text-[var(--accent)] hover:bg-[var(--accent-tint-20)] transition-colors border border-[var(--accent-tint-20)]">
                    <InstagramIcon size={13} />
                    <span>@{profile.instagram.replace(/^@/, '')}</span>
                  </a>
                )}
                {profile?.linkedin && (
                  <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 text-[11px] font-bold text-blue-400 hover:bg-blue-500/25 transition-colors border border-blue-500/30">
                    <Linkedin size={13} />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github.replace(/^@/, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[11px] font-bold text-[#1C1917] hover:bg-[var(--accent-tint-10)] transition-colors border border-[#E7E5E4]">
                    <Github size={13} />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            )}

            {/* 48px Edit Profile Button (Full Width) */}
            <div className="w-full mt-5">
              <button onClick={() => setIsEditing(true)}
                className="w-full h-12 rounded-full text-[15px] font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white cursor-pointer transition-all active:scale-95 shadow-xs flex items-center justify-center">
                Edit Profile
              </button>
            </div>
            
            {/* 44px Secondary Action Row (Public View + QR + Share) */}
            <div className="flex gap-2 w-full mt-3 h-11">
              <button onClick={() => router.push(`/users/${profile.id}`)}
                className="flex-1 h-11 rounded-full text-[13px] font-bold bg-white border border-[#E7E5E4] text-[#1C1917] hover:bg-[var(--accent-tint-10)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xs">
                <ExternalLink size={15} className="text-[#78716C]" /> Public View
              </button>
              <button onClick={() => setShowQrModal(true)}
                className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-[var(--accent-tint-10)]">
                <QrCode size={18} />
              </button>
              <button onClick={handleCopyLink}
                className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:bg-[var(--accent-tint-10)]"
                title="Share Profile">
                {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
              </button>
            </div>
          </div>

          {/* ── PROFILE HUB MENU (Blueprint Section 6) ────────────────── */}
          <div className="bg-white border border-[#E7E5E4] rounded-[16px] overflow-hidden divide-y divide-[var(--border-hairline)] shadow-xs">
            {/* 0. Campus Trust Verification */}
            <button
              onClick={() => setShowVerifyModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F4] transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <span className="text-[14px] font-bold text-[#1C1917] group-hover:text-[var(--accent)] transition-colors">Campus Verification</span>
                  <span className="text-[11px] text-[#78716C] block">
                    {profile?.tier === 'verified'
                      ? 'Verified campus account · Peer calling unlocked'
                      : 'Free Meet tier · Verify student ID to unlock calling'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  profile?.tier === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                    : 'bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]'
                }`}>
                  {profile?.tier === 'verified' ? 'Verified' : 'Get Verified'}
                </span>
                <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[var(--accent)]" />
              </div>
            </button>

            {/* 1. Wallet */}
            <button
              onClick={() => router.push('/wallet')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F4] transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center">
                  <Zap size={16} className="fill-current" />
                </div>
                <div>
                  <span className="text-[14px] font-bold text-[#1C1917] group-hover:text-[var(--accent)] transition-colors">Sparks Wallet</span>
                  <span className="text-[11px] text-[#78716C] block">Manage balances &amp; withdrawals</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--accent)]">
                <span className="flex items-center gap-1">
                  <span>{sparksBalance.toLocaleString()}</span>
                  <Zap size={13} className="fill-[var(--accent)] text-[var(--accent)]" />
                </span>
                <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[var(--accent)]" />
              </div>
            </button>

            {/* 2. Bookings */}
            <button
              onClick={() => router.push('/bookings')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F4] transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-[14px] font-bold text-[#1C1917] group-hover:text-[var(--accent)] transition-colors">Campus Bookings</span>
                  <span className="text-[11px] text-[#78716C] block">Upcoming meets &amp; sessions</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[var(--accent)]" />
            </button>

            {/* 3. Communities */}
            <button
              onClick={() => router.push('/circles')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F4] transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <span className="text-[14px] font-bold text-[#1C1917] group-hover:text-[var(--accent)] transition-colors">Communities &amp; Clubs</span>
                  <span className="text-[11px] text-[#78716C] block">Explore campus channels</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[var(--accent)]" />
            </button>

            {/* 4. Host Tools (if applicable) */}
            {(profile?.role === 'verified_host' || profile?.role === 'campus_lead' || profile?.role === 'admin') && (
              <button
                onClick={() => router.push('/host')}
                className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F4] transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <span className="text-[14px] font-bold text-[#1C1917] group-hover:text-[var(--accent)] transition-colors">Host Workspace</span>
                    <span className="text-[11px] text-[#78716C] block">Campus moderation &amp; safety tools</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] px-2 py-0.5 rounded-full">Host</span>
                  <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[var(--accent)]" />
                </div>
              </button>
            )}

            {/* 5. Admin Dashboard (if admin) */}
            {profile?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F4] transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                    <Crown size={16} />
                  </div>
                  <div>
                    <span className="text-[14px] font-bold text-[#1C1917] group-hover:text-[var(--accent)] transition-colors">Admin Dashboard</span>
                    <span className="text-[11px] text-[#78716C] block">Manage platform users &amp; approvals</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">Admin</span>
                  <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[var(--accent)]" />
                </div>
              </button>
            )}
          </div>

          {/* ── My Moments & Campus Posts ──────────────── */}
          <div className="rounded-[16px] p-5 bg-white border border-[#E7E5E4] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#A8A29E] flex items-center gap-2">
                <Camera size={14} className="text-[var(--accent)]" /> My Moments ({posts.length})
              </span>
              <button 
                onClick={() => router.push('/?action=create-post')} 
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent-tint-10)] px-2.5 py-1 rounded-full border border-[var(--accent-tint-20)] transition-colors cursor-pointer"
              >
                <Plus size={12} strokeWidth={3} />
                <span>New Moment</span>
              </button>
            </div>

            <CampusMomentsGallery
              posts={posts}
              currentUserId={profile?.id}
              author={profile}
              canDelete={true}
              onDeletePost={handleDeletePost}
            />
          </div>

        </div>
      )}
    </div>

      {/* ── Settings Modal (Outside Stacking Context) ──────────────────────── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md max-h-[90vh] sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden anim-scale-in shadow-2xl" style={{ background: 'var(--bg-base)' }}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 rounded-full cursor-pointer hover:bg-[var(--accent-tint-10)] dark:hover:bg-[#1C1917] transition-colors">
                <X size={20} style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Account Settings */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Account</span>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <button onClick={() => { setIsEditing(true); setShowSettingsModal(false); }}
                    className="w-full text-left p-4 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
                    style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center gap-3"><Edit3 size={16} className="text-[#A8A29E]" /> Edit Profile</div>
                    <ChevronRight size={14} className="text-[#A8A29E]" />
                  </button>
                </div>
              </div>

              {/* Theme & Appearance */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Appearance &amp; Theme</span>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <button onClick={() => { setShowSettingsModal(false); openThemeModal(); }}
                    className="w-full text-left p-4 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
                    style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-2xs" style={{ backgroundColor: currentAccent?.hex || 'var(--accent)' }}>
                        <Palette size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">Theme &amp; Accent Colors</p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-medium capitalize">{mode} mode · {currentAccent?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentAccent?.hex || 'var(--accent)' }} />
                      <ChevronRight size={14} className="text-[#A8A29E]" />
                    </div>
                  </button>
                </div>
              </div>

              {/* App Permissions */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>App Permissions</span>
                <div className="rounded-2xl p-4 space-y-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  {/* Location */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fcf6fa] border border-[#f5ebf4] flex items-center justify-center text-[var(--accent)]">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1C1917]">Location Access</p>
                        <p className="text-[10px] text-[#78716C] font-medium">Required for "Free Now" proximity</p>
                      </div>
                    </div>
                    {locStatus === 'granted' ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Enabled</span>
                    ) : locStatus === 'denied' ? (
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Denied</span>
                    ) : (
                      <button onClick={requestLocation} className="text-[10px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] flex items-center justify-center text-[var(--accent)]">
                        <Bell size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1C1917]">Push Notifications</p>
                        <p className="text-[10px] text-[#78716C] font-medium">Get chat and booking alerts</p>
                      </div>
                    </div>
                    {notifStatus === 'granted' ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                        <Check size={12} /> Enabled
                      </span>
                    ) : notifStatus === 'denied' ? (
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Denied</span>
                    ) : (
                      <button onClick={requestNotifications} className="text-[10px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
                    )}
                  </div>

                  {/* Camera */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] flex items-center justify-center text-[var(--accent)]">
                        <Camera size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1C1917]">Camera Access</p>
                        <p className="text-[10px] text-[#78716C] font-medium">To scan booking QR codes</p>
                      </div>
                    </div>
                    {camStatus === 'granted' ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Enabled</span>
                    ) : camStatus === 'denied' ? (
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Denied</span>
                    ) : (
                      <button onClick={requestCamera} className="text-[10px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
                    )}
                  </div>

                  {/* Install App */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Download size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1C1917]">Install App</p>
                        <p className="text-[10px] text-[#78716C] font-medium">Faster & works offline</p>
                      </div>
                    </div>
                    {isStandalone ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Installed</span>
                    ) : (
                      <button onClick={handleManualInstall} className="text-[10px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Install</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Security & Verification */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Security</span>
                <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  
                  {/* Phone Verification */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Phone size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1C1917]">Phone Number</p>
                        <p className="text-[10px] text-[#78716C] font-medium">
                          {phoneVerified ? 'Verified for withdrawals' : 'Required for withdrawals'}
                        </p>
                      </div>
                    </div>
                    {phoneVerified ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Verified</span>
                    ) : (
                      <button onClick={() => { setShowSettingsModal(false); setShowPhoneModal(true); }} className="text-[10px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Verify</button>
                    )}
                  </div>

                </div>
              </div>

              {/* Admin (if applicable) */}
              {profile?.role === 'admin' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Admin</span>
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => { router.push('/admin'); setShowSettingsModal(false); }}
                      className="w-full text-left p-4 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between text-[var(--accent)]">
                      <div className="flex items-center gap-3"><ShieldCheck size={16} /> Admin Dashboard</div>
                      <ChevronRight size={14} className="text-[var(--accent)]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest ml-1 text-rose-500">Danger Zone</span>
                <div className="rounded-2xl overflow-hidden p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Code Modal ──────────────────────── */}
      {showQrModal && (
        <div className="fixed inset-x-0 bottom-0 md:inset-0 z-[9999] flex items-end md:items-center justify-center anim-fade-in" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-t-[32px] md:rounded-[32px] p-8 pb-safe flex flex-col items-center text-center relative overflow-hidden bg-white border border-[#E7E5E4] shadow-2xl anim-slide-up md:anim-scale-in">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 p-2 rounded-full cursor-pointer hover:bg-[var(--accent-tint-10)] transition-colors text-[#A8A29E]">
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] flex items-center justify-center mb-4">
              <QrCode size={28} />
            </div>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight mb-2">Share Profile</h2>
            <p className="text-[12px] font-bold text-[#78716C] mb-6 max-w-[220px]">
              Classmates can scan this to view your public profile and book you.
            </p>
            <div className="w-full aspect-square bg-[#FFFFFF] rounded-3xl flex items-center justify-center border-2 border-dashed border-[#E7E5E4] p-6 relative">
              <QRCodeCanvas 
                value={typeof window !== 'undefined' ? window.location.origin + `/users/${profile.id}` : `https://meova.in/users/${profile.id}`}
                size={200}
                bgColor={"#FFFFFF"}
                fgColor={"#0D0D0D"}
                level={"H"}
                includeMargin={false}
                style={{ borderRadius: '8px' }}
              />
              <span className="px-4 py-2 bg-white border border-[#E7E5E4] rounded-xl shadow-md text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] absolute bottom-4">Meova</span>
            </div>
            <button onClick={handleCopyLink} className="w-full py-4 mt-6 rounded-2xl text-[12px] font-bold uppercase tracking-[0.1em] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white cursor-pointer transition-all active:scale-95 shadow-md flex justify-center gap-2">
              <Share2 size={16} /> Send Link
            </button>
          </div>
        </div>
      )}

      {/* ── Phone Verify Modal ─────────────────── */}
      {showPhoneModal && (
        <div className="fixed inset-x-0 bottom-0 md:inset-0 z-[9999] flex items-end md:items-center justify-center anim-fade-in" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm bg-white border border-[#E7E5E4] rounded-t-[32px] md:rounded-3xl overflow-hidden p-6 pb-safe shadow-2xl anim-slide-up md:anim-scale-in flex flex-col relative">
            <style>{`@keyframes slideUpModal { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }`}</style>

            {/* Header */}
            <div className="p-5 pb-0 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] flex items-center justify-center text-[var(--accent)]">
                  <Phone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917]">Verify Phone Number</h3>
                  <p className="text-[11px] text-[#78716C] font-medium">Required for withdrawals</p>
                </div>
              </div>
              <button onClick={() => { setShowPhoneModal(false); setPhoneStep('input'); setPhoneMsg({ type: '', text: '' }); }} className="p-1.5 text-[#A8A29E] hover:text-[#78716C] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {phoneStep === 'input' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] block mb-2">Mobile Number</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#78716C] bg-[var(--accent-tint-10)] px-3 py-3 rounded-xl">🇮🇳 +91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210"
                        className="flex-1 text-sm font-medium text-[#1C1917] bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  {phoneMsg.text && (
                    <p className={`text-[11px] font-semibold px-3 py-2 rounded-xl ${phoneMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {phoneMsg.text}
                    </p>
                  )}
                  <button
                    onClick={handleSendOtp}
                    disabled={phoneInput.length !== 10 || phoneLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-hover))' }}
                  >
                    {phoneLoading ? <Loader2 size={16} className="animate-spin" /> : <><Phone size={14} /> Send OTP</>}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[12px] font-semibold text-[#78716C]">{phoneMsg.text}</p>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] block mb-2">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="w-full text-center text-xl font-bold tracking-[0.5em] text-[#1C1917] bg-[#FAFAF8] border-2 border-[#E7E5E4] rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                    />
                  </div>
                  {phoneMsg.type === 'error' && (
                    <p className="text-[11px] font-semibold px-3 py-2 rounded-xl bg-rose-50 text-rose-600">{phoneMsg.text}</p>
                  )}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={phoneOtp.length !== 6 || phoneLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-hover))' }}
                  >
                    {phoneLoading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={14} /> Verify & Continue</>}
                  </button>
                  <button onClick={() => setPhoneStep('input')} className="w-full text-center text-[11px] font-bold text-[#A8A29E] hover:text-[#78716C] transition-colors py-1">
                    ← Change number
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PWA Install Guide Modal (Android / iOS / PC) ───────────────────── */}
      <PWAInstallModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />

      {/* ── Campus Trust Verification Modal ────────────────────── */}
      <VerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerified={() => {
          setProfile(prev => ({ ...prev, tier: 'verified' }));
          router.refresh();
        }}
      />
    </>
  );
}

