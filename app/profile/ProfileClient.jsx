'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ArrowLeft, Share2, Zap, Check, Radio, ShieldAlert, ShieldCheck,
  Edit3, Users, Calendar, Tag, ChevronRight
} from 'lucide-react';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import { mockDb } from '../../lib/mockDatabase';
import { getUserAvatarUrl } from '../../utils/avatar';

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
        style={{ background: '#f3f0ff', color: '#7c3aed' }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={onAction}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
          style={{ background: '#7c3aed', color: '#fff' }}>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

export default function ProfileClient({ initialProfile, initialSparks = 0 }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isIdOn, setIsIdOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  // All stats start at 0 — real counts for new users
  const [sparksBalance, setSparksBalance] = useState(initialSparks);

  useEffect(() => {
    if (profile?.id && typeof window !== 'undefined') {
      const load = () => {
        const u = mockDb.getUser(profile.id);
        if (u?.isIdOn !== undefined) setIsIdOn(u.isIdOn);
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

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowSettingsMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggleId = () => {
    const next = !isIdOn;
    setIsIdOn(next);
    if (profile?.id) {
      mockDb.updateUser(profile.id, { isIdOn: next });
      window.dispatchEvent(new Event('profile-updated'));
    }
  };

  const handleSaveSuccess = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
    setIsEditing(false);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin + `/users/${profile.id}`).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const avatarSrc = getUserAvatarUrl(profile);

  const hasInterests = profile?.interests?.length > 0;
  const yearLabel = profile?.year ? `${profile.year} Year` : null;
  const branchLabel = profile?.branch || null;
  const universityLabel = profile?.university || null;

  return (
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
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-xl border cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
              <Settings size={16} strokeWidth={2.5} />
            </button>
            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl py-1.5 z-50 anim-scale-in"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', boxShadow: 'var(--shadow-popup)' }}>
                <button onClick={() => { setIsEditing(true); setShowSettingsMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}>
                  <Edit3 size={13} /> Edit Profile
                </button>
                {profile?.role === 'admin' && (
                  <button onClick={() => { router.push('/admin'); setShowSettingsMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black transition-colors cursor-pointer flex items-center gap-2 text-[#7c3aed]">
                    <ShieldCheck size={14} /> Admin Dashboard
                  </button>
                )}
                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                <div className="px-3 py-1.5">
                  <LogoutButton />
                </div>
              </div>
            )}
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
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', color: '#ffffff' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                  <ShieldCheck size={22} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black tracking-wide">Admin Dashboard</p>
                  <p className="text-[10px] text-purple-100 font-medium">Manage users, payments & host approvals</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-purple-200" />
            </button>
          )}

          {/* ── Avatar Card ─────────────────────────────── */}
          <div className="rounded-3xl p-5 flex flex-col items-center text-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-24 h-24 rounded-full overflow-hidden mb-3"
              style={{ border: '3px solid var(--accent-dim)', background: 'var(--bg-surface)' }}>
              <img src={avatarSrc} alt={profile?.full_name} className="w-full h-full object-cover" />
            </div>

            {/* Name */}
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                {profile?.full_name || 'Your Name'}
              </h2>
            </div>

            {/* Year · Branch (only if filled) */}
            {(yearLabel || branchLabel) && (
              <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--text-secondary)' }}>
                {[yearLabel, branchLabel].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* University (only if filled) */}
            {universityLabel && (
              <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{universityLabel}</p>
            )}

            {/* Bio */}
            <p className="text-[11px] font-medium leading-relaxed mt-3 max-w-xs" style={{ color: 'var(--text-muted)' }}>
              {profile?.bio || 'No bio yet — tap Edit Profile to add one.'}
            </p>

            {/* Instagram */}
            {profile?.instagram && (
              <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-1 text-[10px] font-bold text-pink-500 hover:underline">
                <InstagramIcon size={12} />
                <span>@{profile.instagram}</span>
              </a>
            )}

            {/* Action buttons */}
            <div className="w-full flex gap-2 mt-4">
              <button onClick={() => setIsEditing(true)}
                className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>
                Edit Profile
              </button>
              <button onClick={handleCopyLink}
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', color: copied ? '#10b981' : 'var(--text-secondary)' }}>
                {copied ? <Check size={15} strokeWidth={3} /> : <Share2 size={15} />}
              </button>
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

          {/* ── Interests ──────────────────────────────── */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Interests</span>
              <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-[#7c3aed] cursor-pointer">Edit</button>
            </div>
            {hasInterests ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                style={{ background: '#f3f0ff', color: '#7c3aed', border: '1px dashed #c4b5fd' }}>
                <Tag size={13} /> Add your interests
              </button>
            )}
          </div>

          {/* ── Sparks Wallet Card ─────────────────────── */}
          <button onClick={() => router.push('/wallet')}
            className="w-full bg-gradient-to-tr from-[#7c3aed] to-[#4f46e5] text-white p-5 rounded-3xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all shadow-lg">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-3xl font-black">{sparksBalance.toLocaleString()}</span>
                <Zap size={20} className="fill-current text-orange-400" />
              </div>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider block mt-1">Sparks Balance</span>
            </div>
            <span className="px-4 py-2.5 bg-white text-zinc-900 font-black text-[10px] uppercase tracking-wider rounded-xl">
              View Wallet
            </span>
          </button>

          {/* ── Communities ────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Your Communities</span>
              <button onClick={() => router.push('/circles')} className="text-[10px] font-bold text-[#7c3aed] cursor-pointer">
                Browse
              </button>
            </div>
            <EmptyState
              icon={Users}
              title="No communities yet"
              subtitle="Join a circle to collaborate with students around your interests."
              action="Explore Communities"
              onAction={() => router.push('/circles')}
            />
          </div>

          {/* ── Upcoming Experiences ───────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Upcoming</span>
              <button onClick={() => router.push('/experiences')} className="text-[10px] font-bold text-[#7c3aed] cursor-pointer">
                Browse
              </button>
            </div>
            <EmptyState
              icon={Calendar}
              title="Nothing upcoming"
              subtitle="Book an experience — coffee chats, study sessions, campus walks and more."
              action="Explore Experiences"
              onAction={() => router.push('/experiences')}
            />
          </div>

        </div>
      )}
    </div>
  );
}
