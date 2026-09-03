'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ArrowLeft, Share2, Zap, Check, Radio, ShieldAlert, ShieldCheck,
  Edit3, Users, Calendar, Tag, ChevronRight, MapPin, Bell, Camera, X, Briefcase, Coffee, QrCode, ExternalLink, Phone, CheckCircle2, Loader2, Download,
  Trash2, Heart, Plus
} from '@/lib/icons';
import { Linkedin, Github } from '../../components/ui/SocialIcons';
import { QRCodeCanvas } from 'qrcode.react';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import { getUserAvatarUrl } from '../../utils/avatar';
import { updateProfileAdmin } from '../../features/profile/profile.actions';
import { toast } from '../../lib/toast';
import PWAInstallModal from '../../components/PWAInstallModal';
import ZoomableProfileAvatar from '../../components/ZoomableProfileAvatar';
import { formatPostDate } from '../../utils/dateFormatter';
import HostBadge from '../../components/HostBadge';

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
        style={{ background: '#f3f0ff', color: '#F05A00' }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={onAction}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
          style={{ background: '#F05A00', color: '#fff' }}>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

export default function ProfileClient({ initialProfile, initialSparks = 0, initialGigs = [], initialPosts = [] }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [posts, setPosts] = useState(initialPosts);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isIdOn, setIsIdOn] = useState(true);
  const [copied, setCopied] = useState(false);

  const [sparksBalance, setSparksBalance] = useState(initialSparks);

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
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const p = await Notification.requestPermission();
        setNotifStatus(p);
        if (p === 'granted') {
          window.dispatchEvent(new Event('Meova_notif_granted'));
          if (profile?.id) {
            const { registerPushToken } = await import('../../lib/useFCM');
            await registerPushToken(profile.id);
          }
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
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
            <h1 className="text-[13px] font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
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
          <div className="rounded-[28px] p-6 bg-white border border-zinc-100 shadow-sm">
            <ProfileEditForm initialProfile={profile} onSaveSuccess={handleSaveSuccess} />
          </div>
        ) : (
          <div className="space-y-4">

          {/* ── CAMPUS HOST HUB ACCESS CARD ───────────────────────── */}
          {/* ── CAMPUS HOST WORKSPACE SHORTCUT (FOR HOSTS/ADMINS) ── */}
          {(profile?.role === 'verified_host' || profile?.role === 'campus_lead' || profile?.role === 'admin') && (
            <button
              onClick={() => router.push('/host')}
              className="w-full rounded-[24px] p-4 flex items-center justify-between cursor-pointer transition-all active:scale-95 shadow-xs bg-white border border-black/[0.06] hover:border-orange-200 text-black group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#F05A00] flex-shrink-0 shadow-2xs">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-black tracking-tight text-black">Campus Host Workspace</p>
                    <HostBadge role={profile?.role} size="xs" />
                  </div>
                  <p className="text-[11px] text-black/65 font-bold truncate">Campus moderation, feed safety & circle tools</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-black/40 group-hover:text-[#F05A00] transition-colors flex-shrink-0" />
            </button>
          )}

          {/* ── ADMIN ACCESS CARD (Mobile Admin Button) ────────────────── */}
          {profile?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)', color: '#ffffff' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                  <ShieldCheck size={22} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black tracking-wide">Admin Dashboard</p>
                  <p className="text-[10px] text-[#f5ebf4] font-medium">Manage users, payments & host approvals</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#eac5e0]" />
            </button>
          )}

          {/* ── Avatar Card ─────────────────────────────── */}
          <div className="rounded-[32px] p-6 flex flex-col items-center text-center relative overflow-hidden bg-white border border-zinc-100 shadow-sm">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F05A00]/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10 mb-4">
              <ZoomableProfileAvatar
                src={avatarSrc}
                alt={profile?.full_name}
                name={profile?.full_name}
                username={profile?.username}
                sizeClass="w-28 h-28"
                ringColor="#F05A00"
                isIdOn={false}
              />
            </div>

            {/* Name */}
            <h2 className="relative z-10 text-[22px] font-black text-zinc-900 tracking-tight">
              {profile?.full_name || 'Your Name'}
            </h2>

            {/* Username and Host Badge */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
              {profile?.username && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#fcf6fa] text-[#F05A00]">
                  @{profile.username}
                </span>
              )}
              <HostBadge role={profile?.role} size="sm" />
            </div>

            {/* Year · Branch */}
            {(yearLabel || branchLabel) && (
              <p className="relative z-10 text-[11px] font-bold text-zinc-400 mt-2.5 uppercase tracking-widest">
                {[yearLabel, branchLabel].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* University */}
            {universityLabel && (
              <p className="relative z-10 text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">{universityLabel}</p>
            )}

            {/* Bio */}
            <p className="relative z-10 text-[12px] font-medium leading-relaxed mt-4 text-zinc-500 max-w-[280px]">
              {profile?.bio || 'No bio yet — tap Edit Profile to add one.'}
            </p>

            {/* Social Links Row */}
            {(profile?.instagram || profile?.linkedin || profile?.github) && (
              <div className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2">
                {profile?.instagram && (
                  <a href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[11px] font-black text-[#F05A00] hover:bg-orange-100 transition-colors border border-orange-100">
                    <InstagramIcon size={13} />
                    <span>@{profile.instagram.replace(/^@/, '')}</span>
                  </a>
                )}
                {profile?.linkedin && (
                  <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[11px] font-black text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100">
                    <Linkedin size={13} />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github.replace(/^@/, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-[11px] font-black text-zinc-800 hover:bg-zinc-200 transition-colors border border-zinc-200">
                    <Github size={13} />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="relative z-10 w-full flex flex-col gap-3 mt-6">
              <button onClick={() => setIsEditing(true)}
                className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer transition-all active:scale-95 shadow-md">
                Edit Profile
              </button>
              
              <div className="flex gap-2">
                <button onClick={() => router.push(`/users/${profile.id}`)}
                  className="flex-1 h-12 sm:h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2">
                  <ExternalLink size={16} /> Public View
                </button>
                <button onClick={() => setShowQrModal(true)}
                  className="w-12 sm:w-14 h-12 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] text-[#F05A00] hover:bg-zinc-100 hover:border-[#cbd5e1]">
                  <QrCode size={18} />
                </button>
                <button onClick={handleCopyLink}
                  className="w-12 sm:w-14 h-12 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] text-zinc-600 hover:bg-zinc-100 hover:border-[#cbd5e1]"
                  style={{ color: copied ? '#10b981' : undefined }}>
                  {copied ? <Check size={18} strokeWidth={3} /> : <Share2 size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* ── Discovery Signal Toggle ─────────────────── */}
          <div className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex items-center justify-center">
                {isIdOn ? (
                  <>
                    <div className="absolute w-full h-full rounded-full border border-emerald-500/20 animate-ping opacity-60" />
                    <div className="relative w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center">
                      <Radio size={14} className="text-emerald-500 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                    <ShieldAlert size={14} className="text-rose-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  {isIdOn ? 'Signal Live' : 'Signal Off'}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isIdOn ? 'Classmates can discover you' : 'Hidden from suggestions'}
                </p>
              </div>
            </div>
            <button type="button" onClick={handleToggleId}
              className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 cursor-pointer outline-none ${isIdOn ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${isIdOn ? 'translate-x-5' : 'translate-x-0'}`}>
                {isIdOn ? <Check size={10} className="text-emerald-600" strokeWidth={3} /> : <span className="w-2 h-0.5 rounded bg-zinc-400 block" />}
              </div>
            </button>
          </div>

          {/* Permissions moved to settings modal */}

          {/* ── Interests ──────────────────────────────── */}
          <div className="rounded-[24px] p-5 bg-white border border-zinc-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400">Interests</span>
              <button onClick={() => setIsEditing(true)} className="text-[10px] font-black uppercase tracking-wider text-[#F05A00] cursor-pointer hover:underline">Edit</button>
            </div>
            {hasInterests ? (
              <div className="flex flex-wrap gap-2.5">
                {profile.interests.map(tag => (
                  <span key={tag} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-50 border-[1.5px] border-zinc-200 text-zinc-600 shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] cursor-pointer transition-all active:scale-95 bg-[#fcf6fa] text-[#F05A00] border-[1.5px] border-dashed border-[#eac5e0] hover:bg-[#F05A00]/10">
                <Tag size={14} /> Add your interests
              </button>
            )}
          </div>

          {/* ── Sparks Wallet Card ─────────────────────── */}
          <button onClick={() => router.push('/wallet')}
            className="w-full relative overflow-hidden p-6 rounded-[24px] flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-xl shadow-[#F05A00]/20 group"
            style={{ background: 'linear-gradient(135deg, #F05A00 0%, #D94F00 100%)' }}>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            
            <div className="relative z-10 text-left">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-white tracking-tight">{sparksBalance.toLocaleString()}</span>
                <Zap size={24} className="fill-current text-amber-400 drop-shadow-md" />
              </div>
              <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.15em] block mt-1">Total Sparks</span>
            </div>
            <div className="relative z-10 px-5 py-3 bg-white text-[#F05A00] font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              Wallet
            </div>
          </button>



          {/* ── My Moments & Campus Posts ──────────────── */}
          <div className="rounded-[24px] p-5 bg-white border border-zinc-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-2">
                <Camera size={14} className="text-[#F05A00]" /> My Moments ({posts.length})
              </span>
              <button 
                onClick={() => router.push('/?action=create-post')} 
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#F05A00] hover:bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 transition-colors cursor-pointer"
              >
                <Plus size={12} strokeWidth={3} />
                <span>New Moment</span>
              </button>
            </div>

            {posts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {posts.map((post) => {
                  const hasImage = post.media_urls && post.media_urls.length > 0;
                  const firstImg = hasImage ? post.media_urls[0] : null;

                  return (
                    <div 
                      key={post.id}
                      className="group relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 flex flex-col justify-between aspect-square transition-all duration-200 hover:shadow-md hover:border-orange-200"
                    >
                      {hasImage ? (
                        <>
                          <img 
                            src={firstImg} 
                            alt="Campus Moment" 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        </>
                      ) : (
                        <div className="p-3.5 flex-1 flex flex-col justify-center">
                          <p className="text-xs font-semibold text-zinc-800 line-clamp-4 leading-relaxed">
                            {post.content}
                          </p>
                        </div>
                      )}

                      {/* Top Action / Delete */}
                      <div className="relative z-10 p-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          disabled={deletingPostId === post.id}
                          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-zinc-600 hover:text-rose-600 hover:bg-white shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="Delete Moment"
                        >
                          {deletingPostId === post.id ? (
                            <Loader2 size={12} className="animate-spin text-rose-500" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="relative z-10 p-2.5 flex items-center justify-between text-[10px] font-bold text-white">
                        <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                          <Heart size={10} className="fill-rose-500 text-rose-500" />
                          <span>{post.likes_count || 0}</span>
                        </span>
                        <span className="text-[9px] opacity-80 font-medium">
                          {formatPostDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Camera}
                title="No Moments Shared Yet"
                subtitle="Share coffee meets, campus vibes, or food photos on the live feed."
                action="Share a Moment"
                onAction={() => router.push('/?action=create-post')}
              />
            )}
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
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={20} style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Account Settings */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Account</span>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <button onClick={() => { setIsEditing(true); setShowSettingsModal(false); }}
                    className="w-full text-left p-4 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
                    style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center gap-3"><Edit3 size={16} className="text-zinc-400" /> Edit Profile</div>
                    <ChevronRight size={14} className="text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* App Permissions */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>App Permissions</span>
                <div className="rounded-2xl p-4 space-y-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  {/* Location */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fcf6fa] border border-[#f5ebf4] flex items-center justify-center text-[#F05A00]">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Location Access</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Required for "Free Now" proximity</p>
                      </div>
                    </div>
                    {locStatus === 'granted' ? (
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Enabled</span>
                    ) : locStatus === 'denied' ? (
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Denied</span>
                    ) : (
                      <button onClick={requestLocation} className="text-[10px] font-black text-white bg-[#F05A00] hover:bg-[#D94F00] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F05A00]">
                        <Bell size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Push Notifications</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Get chat and booking alerts</p>
                      </div>
                    </div>
                    {notifStatus === 'granted' ? (
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                        <Check size={12} /> Enabled
                      </span>
                    ) : notifStatus === 'denied' ? (
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Denied</span>
                    ) : (
                      <button onClick={requestNotifications} className="text-[10px] font-black text-white bg-[#F05A00] hover:bg-[#D94F00] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
                    )}
                  </div>

                  {/* Camera */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                        <Camera size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Camera Access</p>
                        <p className="text-[10px] text-zinc-500 font-medium">To scan booking QR codes</p>
                      </div>
                    </div>
                    {camStatus === 'granted' ? (
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Enabled</span>
                    ) : camStatus === 'denied' ? (
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Denied</span>
                    ) : (
                      <button onClick={requestCamera} className="text-[10px] font-black text-white bg-[#F05A00] hover:bg-[#D94F00] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
                    )}
                  </div>

                  {/* Install App */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Download size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Install App</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Faster & works offline</p>
                      </div>
                    </div>
                    {isStandalone ? (
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Installed</span>
                    ) : (
                      <button onClick={handleManualInstall} className="text-[10px] font-black text-white bg-[#F05A00] hover:bg-[#D94F00] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Install</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Security & Verification */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Security</span>
                <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  
                  {/* Phone Verification */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Phone size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Phone Number</p>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          {phoneVerified ? 'Verified for withdrawals' : 'Required for withdrawals'}
                        </p>
                      </div>
                    </div>
                    {phoneVerified ? (
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Verified</span>
                    ) : (
                      <button onClick={() => { setShowSettingsModal(false); setShowPhoneModal(true); }} className="text-[10px] font-black text-white bg-[#F05A00] hover:bg-[#D94F00] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Verify</button>
                    )}
                  </div>

                </div>
              </div>

              {/* Admin (if applicable) */}
              {profile?.role === 'admin' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Admin</span>
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => { router.push('/admin'); setShowSettingsModal(false); }}
                      className="w-full text-left p-4 text-xs font-black transition-colors cursor-pointer flex items-center justify-between text-[#F05A00]">
                      <div className="flex items-center gap-3"><ShieldCheck size={16} /> Admin Dashboard</div>
                      <ChevronRight size={14} className="text-[#F05A00]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest ml-1 text-rose-500">Danger Zone</span>
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
        <div className="fixed inset-x-0 bottom-0 md:inset-0 z-[9999] flex items-end md:items-center justify-center anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-t-[32px] md:rounded-[32px] p-8 pb-safe flex flex-col items-center text-center relative overflow-hidden bg-white shadow-2xl anim-slide-up md:anim-scale-in">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 p-2 rounded-full cursor-pointer hover:bg-zinc-100 transition-colors text-zinc-400">
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-full bg-[#fcf6fa] text-[#F05A00] flex items-center justify-center mb-4">
              <QrCode size={28} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-2">Share Profile</h2>
            <p className="text-[12px] font-bold text-zinc-500 mb-6 max-w-[220px]">
              Classmates can scan this to view your public profile and book you.
            </p>
            <div className="w-full aspect-square bg-[#f8fafc] rounded-3xl flex items-center justify-center border-2 border-dashed border-[#e2e8f0] p-6 relative">
              <QRCodeCanvas 
                value={typeof window !== 'undefined' ? window.location.origin + `/users/${profile.id}` : `https://Meova.com/users/${profile.id}`}
                size={220}
                bgColor={"#f8fafc"}
                fgColor={"#18181b"}
                level={"H"}
                includeMargin={false}
                style={{ borderRadius: '8px' }}
              />
              <span className="px-4 py-2 bg-white rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest text-[#F05A00] absolute bottom-4">Meova.com</span>
            </div>
            <button onClick={handleCopyLink} className="w-full py-4 mt-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.1em] bg-zinc-900 text-white cursor-pointer transition-all active:scale-95 shadow-md flex justify-center gap-2">
              <Share2 size={16} /> Send Link
            </button>
          </div>
        </div>
      )}

      {/* ── Phone Verify Modal ─────────────────── */}
      {showPhoneModal && (
        <div className="fixed inset-x-0 bottom-0 md:inset-0 z-[9999] flex items-end md:items-center justify-center anim-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm bg-white rounded-t-[32px] md:rounded-3xl overflow-hidden p-6 pb-safe shadow-2xl anim-slide-up md:anim-scale-in flex flex-col relative">
            <style>{`@keyframes slideUpModal { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }`}</style>

            {/* Header */}
            <div className="p-5 pb-0 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fcf6fa] flex items-center justify-center text-[#F05A00]">
                  <Phone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Verify Phone Number</h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Required for withdrawals</p>
                </div>
              </div>
              <button onClick={() => { setShowPhoneModal(false); setPhoneStep('input'); setPhoneMsg({ type: '', text: '' }); }} className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {phoneStep === 'input' ? (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Mobile Number</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-zinc-700 bg-zinc-100 px-3 py-3 rounded-xl">🇮🇳 +91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210"
                        className="flex-1 text-sm font-medium text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#F05A00] focus:border-transparent transition-all"
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
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#F05A00,#D94F00)' }}
                  >
                    {phoneLoading ? <Loader2 size={16} className="animate-spin" /> : <><Phone size={14} /> Send OTP</>}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[12px] font-semibold text-zinc-500">{phoneMsg.text}</p>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="w-full text-center text-xl font-black tracking-[0.5em] text-zinc-900 bg-zinc-50 border-2 border-zinc-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#F05A00] focus:border-transparent transition-all"
                    />
                  </div>
                  {phoneMsg.type === 'error' && (
                    <p className="text-[11px] font-semibold px-3 py-2 rounded-xl bg-rose-50 text-rose-600">{phoneMsg.text}</p>
                  )}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={phoneOtp.length !== 6 || phoneLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#F05A00,#D94F00)' }}
                  >
                    {phoneLoading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={14} /> Verify & Continue</>}
                  </button>
                  <button onClick={() => setPhoneStep('input')} className="w-full text-center text-[11px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors py-1">
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
    </>
  );
}

