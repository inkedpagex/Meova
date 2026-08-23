'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ArrowLeft, Share2, Zap, Check, Radio, ShieldAlert, ShieldCheck,
  Edit3, Users, Calendar, Tag, ChevronRight, MapPin, Bell, Camera, X, Briefcase, Coffee, QrCode, ExternalLink
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import { getUserAvatarUrl } from '../../utils/avatar';
import { updateProfileAdmin } from '../../features/profile/profile.actions';

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
        style={{ background: '#f3f0ff', color: '#8C3573' }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={onAction}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
          style={{ background: '#8C3573', color: '#fff' }}>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

export default function ProfileClient({ initialProfile, initialSparks = 0, initialGigs = [] }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isIdOn, setIsIdOn] = useState(true);
  const [copied, setCopied] = useState(false);

  const [sparksBalance, setSparksBalance] = useState(initialSparks);

  // App Permissions State
  const [locStatus, setLocStatus] = useState('prompt');
  const [notifStatus, setNotifStatus] = useState('prompt');
  const [camStatus, setCamStatus] = useState('prompt');

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
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocStatus('granted'),
      () => setLocStatus('denied')
    );
  };

  const requestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const p = await Notification.requestPermission();
      setNotifStatus(p);
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

  const handleSaveSuccess = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
    setIsEditing(false);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.origin + `/users/${profile.id}`;
      if (navigator.share) {
        navigator.share({
          title: 'Meetuply Profile',
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
          <div className="rounded-3xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <ProfileEditForm initialProfile={profile} onSaveSuccess={handleSaveSuccess} />
          </div>
        ) : (
          <div className="space-y-4">

          {/* ── ADMIN ACCESS CARD (Mobile Admin Button) ────────────────── */}
          {profile?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #8C3573 0%, #b5609d 100%)', color: '#ffffff' }}
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
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#8C3573]/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10 w-28 h-28 rounded-full overflow-hidden mb-4 shadow-xl shadow-[#8C3573]/10 ring-4 ring-white bg-zinc-50">
              <img src={avatarSrc} alt={profile?.full_name} className="w-full h-full object-cover" />
            </div>

            {/* Name */}
            <h2 className="relative z-10 text-[22px] font-black text-zinc-900 tracking-tight">
              {profile?.full_name || 'Your Name'}
            </h2>

            {/* Username badge */}
            {profile?.username && (
              <span className="relative z-10 inline-flex items-center gap-1 mt-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#fcf6fa] text-[#8C3573]">
                @{profile.username}
              </span>
            )}

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

            {/* Instagram */}
            {profile?.instagram && (
              <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer"
                className="relative z-10 mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-50 text-[11px] font-black text-pink-500 hover:bg-pink-100 transition-colors">
                <InstagramIcon size={14} />
                <span>@{profile.instagram}</span>
              </a>
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
                  className="w-12 sm:w-14 h-12 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] text-[#8C3573] hover:bg-zinc-100 hover:border-[#cbd5e1]">
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
              <button onClick={() => setIsEditing(true)} className="text-[10px] font-black uppercase tracking-wider text-[#8C3573] cursor-pointer hover:underline">Edit</button>
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
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] cursor-pointer transition-all active:scale-95 bg-[#fcf6fa] text-[#8C3573] border-[1.5px] border-dashed border-[#eac5e0] hover:bg-[#8C3573]/10">
                <Tag size={14} /> Add your interests
              </button>
            )}
          </div>

          {/* ── Sparks Wallet Card ─────────────────────── */}
          <button onClick={() => router.push('/wallet')}
            className="w-full relative overflow-hidden p-6 rounded-[24px] flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-xl shadow-[#8C3573]/20 group"
            style={{ background: 'linear-gradient(135deg, #8C3573 0%, #b5609d 100%)' }}>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            
            <div className="relative z-10 text-left">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-white tracking-tight">{sparksBalance.toLocaleString()}</span>
                <Zap size={24} className="fill-current text-amber-400 drop-shadow-md" />
              </div>
              <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.15em] block mt-1">Total Sparks</span>
            </div>
            <div className="relative z-10 px-5 py-3 bg-white text-[#8C3573] font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              Wallet
            </div>
          </button>

          {/* ── My Recent Gigs ────────────────────────── */}
          <div className="rounded-[24px] p-5 bg-white border border-zinc-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-2">
                <Briefcase size={14} className="text-[#8C3573]" /> My Gigs
              </span>
              <button onClick={() => router.push('/gigs')} className="text-[10px] font-black uppercase tracking-wider text-[#8C3573] cursor-pointer hover:underline">View All</button>
            </div>
            
            {initialGigs?.length > 0 ? (
              <div className="space-y-3">
                {initialGigs.map(gig => (
                  <div key={gig.id} onClick={() => router.push(`/gigs/${gig.id}`)} className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all group">
                    <div className="max-w-[70%]">
                      <p className="text-[12px] font-black text-zinc-900 group-hover:text-[#8C3573] transition-colors truncate">{gig.title || 'Untitled Gig'}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                        {gig.role === 'host' ? 'Posted by you' : 'Accepted job'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      gig.status === 'open' ? 'bg-emerald-50 text-emerald-600' :
                      gig.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                      gig.status === 'completed' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-zinc-100 text-zinc-500'
                    }`}>
                      {gig.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No active gigs"
                subtitle="Post a gig to get things done, or accept one to earn sparks."
                action="Explore Gigs"
                onAction={() => router.push('/gigs')}
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
                      <div className="w-8 h-8 rounded-full bg-[#fcf6fa] border border-[#f5ebf4] flex items-center justify-center text-[#8C3573]">
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
                      <button onClick={requestLocation} className="text-[10px] font-black text-white bg-[#8C3573] hover:bg-[#74295d] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                        <Bell size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Push Notifications</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Get chat and booking alerts</p>
                      </div>
                    </div>
                    {notifStatus === 'granted' ? (
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Check size={12}/> Enabled</span>
                    ) : notifStatus === 'denied' ? (
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Denied</span>
                    ) : (
                      <button onClick={requestNotifications} className="text-[10px] font-black text-white bg-[#8C3573] hover:bg-[#74295d] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
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
                      <button onClick={requestCamera} className="text-[10px] font-black text-white bg-[#8C3573] hover:bg-[#74295d] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors active:scale-95">Enable</button>
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
                      className="w-full text-left p-4 text-xs font-black transition-colors cursor-pointer flex items-center justify-between text-[#8C3573]">
                      <div className="flex items-center gap-3"><ShieldCheck size={16} /> Admin Dashboard</div>
                      <ChevronRight size={14} className="text-[#8C3573]" />
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-[32px] p-8 flex flex-col items-center text-center relative overflow-hidden bg-white shadow-2xl anim-scale-in">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 p-2 rounded-full cursor-pointer hover:bg-zinc-100 transition-colors text-zinc-400">
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-full bg-[#fcf6fa] text-[#8C3573] flex items-center justify-center mb-4">
              <QrCode size={28} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-2">Share Profile</h2>
            <p className="text-[12px] font-bold text-zinc-500 mb-6 max-w-[220px]">
              Classmates can scan this to view your public profile and book you.
            </p>
            <div className="w-full aspect-square bg-[#f8fafc] rounded-3xl flex items-center justify-center border-2 border-dashed border-[#e2e8f0] p-6 relative">
              <QRCodeCanvas 
                value={typeof window !== 'undefined' ? window.location.origin + `/users/${profile.id}` : `https://meetuply.com/users/${profile.id}`}
                size={220}
                bgColor={"#f8fafc"}
                fgColor={"#18181b"}
                level={"H"}
                includeMargin={false}
                style={{ borderRadius: '8px' }}
              />
              <span className="px-4 py-2 bg-white rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest text-[#8C3573] absolute bottom-4">meetuply.com</span>
            </div>
            <button onClick={handleCopyLink} className="w-full py-4 mt-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.1em] bg-zinc-900 text-white cursor-pointer transition-all active:scale-95 shadow-md flex justify-center gap-2">
              <Share2 size={16} /> Send Link
            </button>
          </div>
        </div>
      )}
    </>
  );
}
