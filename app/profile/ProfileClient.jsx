'use client';
import React, { useState, useEffect } from 'react';
import ReactConfetti from 'canvas-confetti';
import { 
  User, Check, X, Award, Edit3, Camera, Radio, ShieldAlert, Star, Calendar,
  ChevronLeft, ChevronRight, Gift, Copy, CheckCircle2
} from 'lucide-react';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import { mockDb } from '../../lib/mockDatabase';

import { getUserAvatarUrl, getCartoonAvatar } from '../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

export default function ProfileClient({ initialProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [isIdOn, setIsIdOn] = useState(initialProfile?.isIdOn !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Referral state
  const [myReferralCode, setMyReferralCode] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [referralResult, setReferralResult] = useState(null); // { ok, message }
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralApplied, setReferralApplied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(getTheme());
      
      const observer = new MutationObserver(() => {
        setTheme(getTheme());
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      return () => observer.disconnect();
    }
  }, []);

  const [stats, setStats] = useState({
    rating: 5.0,
    reviewsCount: 0,
    totalMeetings: 0,
    sparksBalance: 0
  });

  useEffect(() => {
    if (profile?.id && typeof window !== 'undefined') {
      const loadUserStats = () => {
        const dbUser = mockDb.getUser(profile.id) || profile;
        const hostReviews = mockDb.getReviews(profile.id) || [];
        
        let avgRating = dbUser.rating || 5.0;
        if (hostReviews.length > 0) {
          avgRating = parseFloat((hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length).toFixed(1));
        }

        const allBookings = mockDb.getBookings() || [];
        const userBookings = allBookings.filter(b => b.hostId === profile.id || b.guestId === profile.id);
        const totalMeetings = userBookings.length;

        const wallet = mockDb.getWallet(profile.id) || { purchased: 0, bonus: 0, creator: 0 };
        const sparksBalance = (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0);

        setStats({
          rating: avgRating,
          reviewsCount: hostReviews.length || dbUser.reviewsCount || 0,
          totalMeetings: totalMeetings,
          sparksBalance: sparksBalance
        });
      };

      loadUserStats();
      window.addEventListener('profile-updated', loadUserStats);
      return () => {
        window.removeEventListener('profile-updated', loadUserStats);
      };
    }
  }, [profile?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = mockDb.getUser(initialProfile.id);
      if (u) {
        setProfile(u);
        setIsIdOn(u.isIdOn !== false);
      } else {
        // Initialize in mockDb!
        mockDb.updateUser(initialProfile.id, {
          id: initialProfile.id,
          uid: initialProfile.uid || initialProfile.id,
          full_name: initialProfile.full_name || initialProfile.name || 'User',
          email: initialProfile.email || '',
          branch: initialProfile.branch || 'General',
          year: initialProfile.year || '1st',
          bio: initialProfile.bio || '',
          interests: initialProfile.interests || [],
          instagram: initialProfile.instagram || '',
          photo_url: initialProfile.photo_url || '',
          isIdOn: initialProfile.isIdOn !== false
        });

        // Load/generate referral code
        const code = mockDb.getUserReferralCode(initialProfile.id);
        setMyReferralCode(code);

        // Check if already used a referral
        const dbUser = mockDb.getUser(initialProfile.id);
        if (dbUser?.referral_applied) setReferralApplied(true);
      }
    }
  }, [initialProfile]);

  function handleCopyCode() {
    if (!myReferralCode) return;
    navigator.clipboard.writeText(myReferralCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function handleApplyReferral() {
    if (!referralInput.trim()) return;
    setReferralLoading(true);
    setReferralResult(null);

    // Small delay for UX
    setTimeout(() => {
      const result = mockDb.useReferralCode(referralInput.trim().toUpperCase(), profile.id);
      setReferralResult(result);
      if (result.ok) {
        setReferralApplied(true);
        setReferralInput('');
        window.dispatchEvent(new Event('wallet-updated'));
      }
      setReferralLoading(false);
    }, 800);
  }

  const handleToggleIdStatus = () => {
    const nextVal = !isIdOn;
    setIsIdOn(nextVal);
    
    if (typeof window !== 'undefined') {
      mockDb.updateUser(profile.id, { isIdOn: nextVal });
      window.dispatchEvent(new Event('profile-updated'));
    }
  };

  const handleSaveSuccess = (updatedFields) => {
    setProfile(prev => ({ ...prev, ...updatedFields }));
    setIsEditing(false);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile-updated'));
      
      // Shoot confetti for user wow factor
      try {
        ReactConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#10b981']
        });
      } catch (err) {}
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 relative">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-10 right-10 w-[200px] h-[200px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-5 w-[180px] h-[180px] rounded-full bg-pink-500/5 blur-[80px] pointer-events-none -z-10" />

      {/* Main card viewport to mimic the phone mockup layout exactly */}
      <div className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        
        {/* ── TOP ACTION BAR ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          {/* Back button */}
          <button 
            type="button" 
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer shadow-md"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer shadow-md"
          >
            {isEditing ? (
              <>
                <X size={12} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Edit3 size={12} />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {/* ── PROFILE CONTENT OR EDIT FORM ───────────────────────────── */}
        {isEditing ? (
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-6">Modify Profile Details</h2>
            <ProfileEditForm 
              initialProfile={profile} 
              onSaveSuccess={handleSaveSuccess} 
            />
          </div>
        ) : (
          <div className="relative">
            {/* Avatar block */}
            <div className="px-6 md:px-8 pt-2 flex flex-col sm:flex-row items-center sm:items-end gap-4 relative z-10">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[var(--border-subtle)] bg-neutral-900 overflow-hidden shadow-xl">
                  <img src={avatarUrl(profile)} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 border-2 border-[var(--bg-elevated)] flex items-center justify-center shadow-lg transition-all cursor-pointer text-white"
                >
                  <Camera size={12} />
                </button>
              </div>

              {/* Name and verified check */}
              <div className="pb-2 space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] leading-none tracking-tight">
                    {profile.full_name}
                  </h2>
                  <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold leading-none select-none">
                    ✓
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  @{profile.instagram || profile.id || 'username'}
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-extrabold text-purple-500 uppercase tracking-wider">
                  <Award size={9} />
                  <span>Top Creator</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="px-6 md:px-8 mt-5 text-center">
              <p className="text-[11px] md:text-xs text-[var(--text-secondary)] leading-relaxed font-semibold italic max-w-sm mx-auto">
                {profile.bio || "Building digital products and communities. Nurturing ideas. Exploring endless possibilities."}
              </p>
            </div>

            {/* 3 Info Cards */}
            <div className="grid grid-cols-3 gap-3 px-6 md:px-8 mt-5">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3 text-center shadow-sm">
                <div className="text-xs md:text-sm font-black text-[var(--text-primary)]">
                  {profile.year || '2nd'} Year
                </div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
                  {profile.branch || 'B.Tech CSE'}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3 text-center shadow-sm">
                <div className="text-xs md:text-sm font-black text-[var(--text-primary)]">
                  GLA University
                </div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
                  Mathura, UP
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3 text-center shadow-sm">
                <div className="text-xs md:text-sm font-black text-amber-500 flex items-center justify-center gap-0.5">
                  ★ {stats.rating}
                </div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
                  ({stats.reviewsCount} Reviews)
                </div>
              </div>
            </div>

            {/* Discovery Signal Toggle */}
            <div className="mx-6 md:mx-8 mt-4 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
                  {isIdOn ? (
                    <>
                      <div className="absolute w-full h-full rounded-full border border-emerald-500/20 animate-ping opacity-70" />
                      <div className="relative w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      </div>
                    </>
                  ) : (
                    <div className="relative w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)]">
                    {isIdOn ? 'Signal Live' : 'Signal Off'}
                  </div>
                  <div className="text-[8.5px] text-[var(--text-muted)] font-semibold mt-0.5">
                    {isIdOn ? 'Classmates can discover you' : 'Hidden from Suggestions'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleIdStatus}
                className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative cursor-pointer outline-none ${
                  isIdOn ? 'bg-emerald-500' : 'bg-zinc-750'
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white transition-all duration-300 flex items-center justify-center shadow-md ${
                    isIdOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {isIdOn ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                  ) : (
                    <X className="w-2.5 h-2.5 text-neutral-500 stroke-[3]" />
                  )}
                </div>
              </button>
            </div>

            {/* Stat counts row */}
            <div className="flex items-center justify-between px-4 md:px-8 py-4 border-y border-[var(--border-subtle)] mt-5 text-center">
              <div className="flex-1 border-r border-[var(--border-subtle)]">
                <div className="text-base font-black text-[var(--text-primary)]">18</div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">Experiences</div>
              </div>
              <div className="flex-1 border-r border-[var(--border-subtle)]">
                <div className="text-base font-black text-[var(--text-primary)]">{stats.reviewsCount || 24}</div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">Reviews</div>
              </div>
              <div className="flex-1 border-r border-[var(--border-subtle)]">
                <div className="text-base font-black text-[var(--text-primary)]">1.2K</div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">Followers</div>
              </div>
              <div className="flex-1">
                <div className="text-base font-black text-[var(--text-primary)]">320</div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">Following</div>
              </div>
            </div>

            {/* Top Interests */}
            <div className="px-6 md:px-8 mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">Top Interests</h3>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-purple-500 font-extrabold text-[10px] uppercase hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.interests || []).length > 0 ? (
                  (profile.interests || []).map(interest => (
                    <span
                      key={interest}
                      className="text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-purple-500/30 hover:text-[var(--text-primary)] transition-all"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  ['Coding & Tech', 'Entrepreneurship', 'Music & Bands', 'AI & ML', 'Design'].map(interest => (
                    <span
                      key={interest}
                      className="text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                    >
                      {interest}
                    </span>
                  ))
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full border border-dashed border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-muted)] hover:border-purple-500/40 hover:text-purple-500 transition-all cursor-pointer"
                >
                  + Add Interest
                </button>
              </div>
            </div>

            {/* ── REFERRAL SYSTEM ────────────────────────────── */}
            {(() => {
              const isProfileComplete = profile?.full_name && profile?.branch && profile?.photo_url;
              return (
                <div className="px-6 md:px-8 mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Gift size={12} className="text-violet-400" /> Referral Program
                    </h3>
                    <span className="text-[9px] font-black uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">+10 ⚡ each</span>
                  </div>

                  {!isProfileComplete ? (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">Profile Incomplete</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-semibold leading-relaxed">
                        Complete your profile — add your <strong className="text-[var(--text-primary)]">name, branch, and profile photo</strong> — to unlock the referral system and earn Sparks.
                      </p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        Complete Profile
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-4">
                      {/* My referral code */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">Your Referral Code</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono font-black text-[var(--text-primary)] tracking-widest bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5">
                            {myReferralCode || '...'}
                          </code>
                          <button
                            onClick={handleCopyCode}
                            className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-90 cursor-pointer"
                          >
                            {codeCopied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </button>
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] font-semibold mt-1.5">Share this code — when your friend signs up and enters it, you <strong>both</strong> get 10 Sparks.</p>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-[var(--border-subtle)]/50" />

                      {/* Enter a friend's code */}
                      {referralApplied ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 size={14} />
                          <p className="text-[10px] font-black uppercase tracking-wider">Referral code already applied — 10 Sparks earned!</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">Have a Friend's Code?</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={referralInput}
                              onChange={e => setReferralInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                              placeholder="e.g. CHIRAG2948"
                              maxLength={12}
                              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-violet-500/40 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all tracking-widest"
                            />
                            <button
                              onClick={handleApplyReferral}
                              disabled={referralLoading || !referralInput.trim()}
                              className="px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                            >
                              {referralLoading ? '...' : 'Apply'}
                            </button>
                          </div>

                          {referralResult && (
                            <div className={`mt-2.5 px-3 py-2 rounded-xl border text-[10px] font-bold ${
                              referralResult.ok
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {referralResult.ok ? '✅' : '❌'} {referralResult.message || referralResult.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Upcoming Experiences */}
            <div className="px-6 md:px-8 mt-5 pb-8 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">Upcoming Experiences</h3>
                <span className="text-purple-500 font-extrabold text-[10px] uppercase hover:underline cursor-pointer">View All</span>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-all">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="text-xs md:text-sm font-black text-[var(--text-primary)] flex items-center gap-1">
                      Coffee Connect ☕
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">
                      Today, 5:00 PM • Campus Cafe
                    </p>
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500 mt-1 block">
                      Confirmed
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)]" />
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Logout Action (Cleanly positioned below the main card) */}
      {!isEditing && (
        <div className="mt-8 flex justify-center">
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
