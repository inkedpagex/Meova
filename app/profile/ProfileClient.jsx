'use client';
import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Zap, Compass, Star, Plus, 
  MapPin, Clock, Award, CheckCircle2, ChevronRight, 
  Loader2, Wallet, ArrowUpRight, Check, X, AlertTriangle 
} from 'lucide-react';
import ProfileEditForm from '../../features/profile/ProfileEditForm';
import LogoutButton from '../../features/auth/LogoutButton';
import { mockDb } from '../../lib/mockDatabase';
import confetti from 'canvas-confetti';

import { getUserAvatarUrl, getCartoonAvatar } from '../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

export default function ProfileClient({ initialProfile }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'host_verification' | 'host_portal'
  
  // Database State
  const [profile, setProfile] = useState(initialProfile);
  const [wallet, setWallet] = useState(null);
  const [myExperiences, setMyExperiences] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [verificationReq, setVerificationReq] = useState(null);

  // Host Verification form state
  const [uniName, setUniName] = useState('GLA University');
  const [govId, setGovId] = useState('');
  const [verificationVibe, setVerificationVibe] = useState('');
  const [verifyingFormLoading, setVerifyingFormLoading] = useState(false);

  // Create Experience form state
  const [showCreateExp, setShowCreateExp] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Coffee');
  const [expDesc, setExpDesc] = useState('');
  const [expLoc, setExpLoc] = useState('Tech Hub Cafeteria ☕');
  const [expPrice, setExpPrice] = useState(250);
  const [expDuration, setExpDuration] = useState(45);
  const [expDays, setExpDays] = useState(['Monday']);
  const [expSlots, setExpSlots] = useState(['4:00 PM', '5:00 PM']);
  const [createExpLoading, setCreateExpLoading] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [newSlotTime, setNewSlotTime] = useState('');

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('UPI');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Code validation state
  const [verificationCodes, setVerificationCodes] = useState({});
  const [verificationError, setVerificationError] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = mockDb.getUser(initialProfile.id);
      if (u) {
        setProfile(u);
        const exps = mockDb.getExperiences().filter(e => e.hostId === u.id);
        setMyExperiences(exps);
        const bks = mockDb.getBookings().filter(b => b.hostId === u.id);
        setMyBookings(bks);
        setWallet(mockDb.getWallet(u.id));
        
        // Find existing verification
        const reqs = mockDb.getHostVerifications();
        const found = reqs.find(r => r.userId === u.id);
        if (found) setVerificationReq(found);
      }
    }
  }, [initialProfile]);

  const refreshState = () => {
    const u = mockDb.getUser(profile.id);
    if (u) {
      setProfile(u);
      setMyExperiences(mockDb.getExperiences().filter(e => e.hostId === u.id));
      setMyBookings(mockDb.getBookings().filter(b => b.hostId === u.id));
      setWallet(mockDb.getWallet(u.id));
      
      const reqs = mockDb.getHostVerifications();
      const found = reqs.find(r => r.userId === u.id);
      if (found) setVerificationReq(found);
    }
  };

  // Submit Host verification
  const handleHostApply = async (e) => {
    e.preventDefault();
    setVerifyingFormLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const req = mockDb.submitHostVerification(profile.id, {
      userName: profile.full_name,
      email: profile.email,
      university: uniName,
      govId: govId
    });

    setVerifyingFormLoading(false);
    setVerificationReq(req);
    alert('Verification request submitted! A Meetify admin will review your student records.');
  };

  // Host Action: Accept Request
  const handleAcceptRequest = (bookingId) => {
    mockDb.updateBookingStatus(bookingId, 'Confirmed');
    refreshState();
  };

  // Host Action: Decline Request
  const handleDeclineRequest = (bookingId) => {
    mockDb.updateBookingStatus(bookingId, 'Rejected');
    refreshState();
  };

  // Host Action: Code verification & Completion
  const handleVerifyCode = async (bookingId) => {
    const code = verificationCodes[bookingId];
    if (!code || code.length !== 6) {
      setVerificationError(prev => ({ ...prev, [bookingId]: 'Enter a valid 6-digit code' }));
      return;
    }

    setVerifyingId(bookingId);
    setVerificationError(prev => ({ ...prev, [bookingId]: '' }));
    await new Promise(r => setTimeout(r, 1000));

    const res = mockDb.completeMeeting(bookingId, code);
    setVerifyingId(null);

    if (res.success) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      refreshState();
      alert('Verification Successful! Payout has been released.');
    } else {
      setVerificationError(prev => ({ ...prev, [bookingId]: res.error }));
    }
  };

  // Create new experience
  const handleCreateExperience = async (e) => {
    e.preventDefault();
    if (!expTitle || !expDesc) return;
    
    setCreateExpLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    mockDb.createExperience({
      title: expTitle,
      category: expCategory,
      description: expDesc,
      location: expLoc,
      price: parseInt(expPrice, 10) || 150,
      duration: parseInt(expDuration, 10) || 45,
      days: expDays,
      slots: expSlots,
      hostId: profile.id,
      img: expCategory === 'Coffee' 
        ? 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'
        : expCategory === 'Study'
        ? 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80'
        : expCategory === 'Startup'
        ? 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80'
        : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80',
      tags: [expCategory, expLoc.replace(/[^a-zA-Z]/g, ''), 'Public']
    });

    setCreateExpLoading(false);
    setShowCreateExp(false);
    
    // reset form
    setExpTitle('');
    setExpDesc('');
    setFormStep(1);
    
    refreshState();
    alert('Experience published successfully!');
  };

  // Submit Withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseInt(withdrawAmount, 10);
    if (!amt || amt < 1000) return alert('Minimum withdrawal limit is 1,000 Sparks.');
    if (wallet.creator < amt) return alert('Insufficient Creator balance.');

    setWithdrawLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    mockDb.createWithdrawal(profile.id, amt, withdrawMethod, withdrawDetails);
    setWithdrawLoading(false);
    setWithdrawAmount('');
    setWithdrawDetails('');
    refreshState();
    alert('Withdrawal request submitted! Payout will be processed within 24 hours.');
  };

  const handleToggleDay = (day) => {
    if (expDays.includes(day)) {
      setExpDays(expDays.filter(d => d !== day));
    } else {
      setExpDays([...expDays, day]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 px-4 pb-16">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex-shrink-0">
            <img src={avatarUrl(profile.full_name)} alt="avatar" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">{profile.full_name}</h1>
              {profile.isHost && (
                <span className="flex items-center gap-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[#818cf8] text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                  <Award size={10} className="fill-current" />
                  <span>Host</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 font-bold uppercase tracking-widest">
              {profile.email} • {profile.year} Year {profile.branch}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* ── TABS NAVIGATION ───────────────────────────────────────── */}
      <div className="flex border-b border-[var(--border-subtle)] gap-4">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'details' ? 'border-white text-white' : 'border-transparent text-[var(--text-muted)] hover:text-white'
          }`}
        >
          Profile Details
        </button>

        {profile.isHost ? (
          <button
            onClick={() => setActiveTab('host_portal')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'host_portal' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--accent)]'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Host Portal</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('host_verification')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'host_verification' ? 'border-[#fb923c] text-[#fb923c]' : 'border-transparent text-[var(--text-muted)] hover:text-[#fb923c]'
            }`}
          >
            <span>Become a Host</span>
          </button>
        )}
      </div>

      {/* ── DETAILS TAB ────────────────────────────────────────────── */}
      {activeTab === 'details' && (
        <div className="bg-[var(--bg-elevated)] rounded-[2rem] border border-[var(--border-subtle)] p-6 md:p-8 shadow-lg">
          <ProfileEditForm initialProfile={profile} />
        </div>
      )}

      {/* ── BECOME HOST TAB ────────────────────────────────────────── */}
      {activeTab === 'host_verification' && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-[var(--text-primary)]">Become a Verified Host</h2>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-wider">Join our verified campus student host network</p>
          </div>

          {verificationReq ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 rounded-2xl text-center space-y-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                verificationReq.status === 'approved' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' 
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
              }`}>
                {verificationReq.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white">
                  {verificationReq.status === 'approved' ? 'Application Approved!' : 'Application Pending Approval'}
                </h4>
                <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-1.5 leading-relaxed max-w-sm mx-auto">
                  {verificationReq.status === 'approved' 
                    ? 'Congratulations! You are now verified. Refresh to access the Host Portal.' 
                    : 'Our admin team is manually auditing your GLA University enrollment records. We will notify you once approved!'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleHostApply} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">University Name</label>
                  <input 
                    type="text" 
                    value={uniName} 
                    onChange={e => setUniName(e.target.value)} 
                    placeholder="e.g. GLA University" 
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Student Enrollment ID / Roll No</label>
                  <input 
                    type="text" 
                    value={govId} 
                    onChange={e => setGovId(e.target.value)} 
                    placeholder="e.g. GLA-2024-897" 
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Describe your campus hosting interest</label>
                <textarea 
                  value={verificationVibe} 
                  onChange={e => setVerificationVibe(e.target.value)} 
                  placeholder="e.g. I want to host startup deck review sessions or co-work on frontend code..." 
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none min-h-[80px]" 
                  required 
                />
              </div>

              <button 
                type="submit"
                disabled={verifyingFormLoading}
                className="btn btn-primary text-xs w-full py-3.5 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {verifyingFormLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                <span>Submit Verification Records</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── HOST PORTAL TAB ────────────────────────────────────────── */}
      {activeTab === 'host_portal' && profile.isHost && (
        <div className="space-y-6">
          
          {/* Earnings Analytics section */}
          {wallet && (
            <div className="bg-gradient-to-br from-[#0c0d15] to-[#050508] border border-[#10b981]/20 rounded-3xl p-5 md:p-6 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Host Dashboard</h3>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-0.5">Manage listings, verify QRs, and claim payouts</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white flex items-center gap-1">
                    {wallet.creator.toLocaleString('en-IN')}
                    <span className="text-yellow-400">⚡</span>
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Withdrawable Creator Earnings</span>
                </div>

                <p className="text-[9.5px] text-[var(--text-secondary)] font-semibold leading-relaxed">
                  Earnings are credited automatically at <strong className="text-white">90% split</strong> once the meetup confirmation code is entered. Meetify retains a 10% platform commission.
                </p>
              </div>

              {/* Withdraw Form */}
              <form onSubmit={handleWithdraw} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Withdraw Earnings</span>
                  <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">Min 1,000 ES</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    placeholder="Amount (ES)"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] outline-none"
                    required
                  />
                  <select
                    value={withdrawMethod}
                    onChange={e => setWithdrawMethod(e.target.value)}
                    className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <input 
                  type="text" 
                  placeholder="UPI ID or Bank Account No"
                  value={withdrawDetails}
                  onChange={e => setWithdrawDetails(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none"
                  required
                />

                <button 
                  type="submit"
                  disabled={withdrawLoading || wallet.creator < 1000}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white text-[10px] font-black uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawLoading ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
                  <span>Withdraw Payout</span>
                </button>
              </form>
            </div>
          )}

          {/* Bookings verify section */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-2">
              Incoming Bookings &amp; Verification
            </h3>

            {myBookings.length === 0 ? (
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase text-center py-4">No bookings received yet</p>
            ) : (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <div key={b.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
                      <div>
                        <h4 className="text-xs font-black text-[var(--text-primary)] uppercase">{b.title}</h4>
                        <p className="text-[9.5px] text-[var(--text-secondary)] font-bold mt-0.5 uppercase tracking-wider">
                          Guest: {b.guestName} • {b.date} at {b.time}
                        </p>
                      </div>

                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border self-start ${
                        b.status === 'Requested' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                          : b.status === 'Confirmed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    {/* Pending accept */}
                    {b.status === 'Requested' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAcceptRequest(b.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Accept Booking
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(b.id)}
                          className="flex-1 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent font-black uppercase text-[10px] py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Confirmed / Enter Code */}
                    {b.status === 'Confirmed' && (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)]">
                        <div>
                          <p className="text-[8.5px] text-[var(--text-muted)] font-black uppercase tracking-wider">Booking Code (Guest will share at meetup)</p>
                          <p className="text-xs font-black text-white mt-1 uppercase tracking-wide">Meetup: {b.location}</p>
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            maxLength={6}
                            placeholder="Enter Code"
                            value={verificationCodes[b.id] || ''}
                            onChange={(e) => setVerificationCodes(prev => ({ ...prev, [b.id]: e.target.value }))}
                            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-xs font-black tracking-widest text-center text-[var(--text-primary)] w-28 outline-none focus:border-[#6366f1]"
                          />
                          <button
                            onClick={() => handleVerifyCode(b.id)}
                            disabled={verifyingId === b.id}
                            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-black uppercase text-[10px] px-4.5 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                          >
                            {verifyingId === b.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                            <span>Verify</span>
                          </button>
                        </div>
                        {verificationError[b.id] && (
                          <p className="text-[9px] font-bold text-rose-500 mt-1 flex items-center gap-1 w-full">
                            <AlertTriangle size={10} />
                            {verificationError[b.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List Hosted Experiences & Create new */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
                My Listed Experiences
              </h3>
              <button 
                onClick={() => setShowCreateExp(!showCreateExp)}
                className="bg-white hover:bg-neutral-200 text-black font-black uppercase text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md"
              >
                <Plus size={12} />
                <span>Publish New</span>
              </button>
            </div>

            {/* Create new Form (Multi-step Wizard) */}
            {showCreateExp && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 rounded-[2rem] space-y-6 anim-scale-in relative">
                {/* Close Form */}
                <button 
                  onClick={() => { setShowCreateExp(false); setFormStep(1); }}
                  className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors bg-[var(--bg-elevated)]"
                >
                  <X size={15} />
                </button>

                {/* Progress Indicators */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">Create Experience</h4>
                    <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-0.5">
                      Step {formStep} of 3 · {formStep === 1 ? 'Basic Info' : formStep === 2 ? 'Set Availability' : 'Set Price'}
                    </p>
                  </div>
                  {/* Visual steps dots */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((step) => (
                      <div 
                        key={step} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          formStep === step ? 'w-6 bg-[var(--accent)]' : 'w-1.5 bg-[var(--border-subtle)]'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* STEP 1: Basic Info */}
                {formStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Experience Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Coding &amp; Coffee Chat" 
                          value={expTitle}
                          onChange={e => setExpTitle(e.target.value)}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-3 text-xs text-[var(--text-primary)] outline-none focus:border-[#6366f1]/40"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Category</label>
                        <select
                          value={expCategory}
                          onChange={e => setExpCategory(e.target.value)}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-3 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                        >
                          <option value="Coffee">Coffee Connect ☕</option>
                          <option value="Study">Study Together 📚</option>
                          <option value="Startup">Startup Discussion 🚀</option>
                          <option value="Photography">Photography Walk 📷</option>
                          <option value="Walk">Campus Walk 🚶</option>
                          <option value="Sports">Badminton Match 🏸</option>
                          <option value="Gaming">Chess Match ♟</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Public Meeting Location</label>
                        <select
                          value={expLoc}
                          onChange={e => setExpLoc(e.target.value)}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-3 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                        >
                          {mockDb.APPROVED_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Duration (Min)</label>
                        <select
                          value={expDuration}
                          onChange={e => setExpDuration(e.target.value)}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-3 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                        >
                          <option value={30}>30 mins</option>
                          <option value={45}>45 mins</option>
                          <option value={60}>60 mins</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Description</label>
                      <textarea 
                        placeholder="Tell guests what you will do, learn, or chat about..."
                        value={expDesc}
                        onChange={e => setExpDesc(e.target.value)}
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#6366f1]/40 min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!expTitle.trim() || !expDesc.trim()) {
                            alert('Please fill out the Title and Description first.');
                            return;
                          }
                          setFormStep(2);
                        }}
                        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        Next Step
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Set Availability */}
                {formStep === 2 && (
                  <div className="space-y-5">
                    {/* Days circular row */}
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-2">Available Days</label>
                      <div className="flex flex-wrap gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                          const selected = expDays.includes(d);
                          return (
                            <button
                              type="button"
                              key={d}
                              onClick={() => handleToggleDay(d)}
                              className={`w-11 h-11 rounded-full border text-[10px] font-black uppercase transition-all flex items-center justify-center cursor-pointer ${
                                selected 
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white scale-105 shadow' 
                                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
                              }`}
                              title={d}
                            >
                              {d.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots adder & tags list */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Time Slots Available</label>
                        <p className="text-[8px] text-[var(--text-muted)] font-semibold uppercase mb-2">Add target meet times for students</p>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="e.g. 5:30 PM or 11:00 AM"
                          value={newSlotTime}
                          onChange={e => setNewSlotTime(e.target.value)}
                          className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none flex-1 focus:border-[#6366f1]/40"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newSlotTime.trim() && !expSlots.includes(newSlotTime.trim())) {
                                setExpSlots([...expSlots, newSlotTime.trim()]);
                                setNewSlotTime('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newSlotTime.trim() && !expSlots.includes(newSlotTime.trim())) {
                              setExpSlots([...expSlots, newSlotTime.trim()]);
                              setNewSlotTime('');
                            }
                          }}
                          className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-white hover:bg-white hover:text-black font-black uppercase text-[10px] px-4 rounded-xl transition-all cursor-pointer"
                        >
                          Add Slot
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1.5 min-h-[36px]">
                        {expSlots.length === 0 ? (
                          <span className="text-[9px] text-[var(--text-muted)] font-black uppercase">No slots added. Add slots above!</span>
                        ) : (
                          expSlots.map((slot) => (
                            <span 
                              key={slot} 
                              className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-white px-3 py-1 rounded-lg"
                            >
                              <span>{slot}</span>
                              <button
                                type="button"
                                onClick={() => setExpSlots(expSlots.filter(s => s !== slot))}
                                className="text-rose-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white font-black uppercase text-[10px] px-5 py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (expDays.length === 0) {
                            alert('Please select at least one available day.');
                            return;
                          }
                          if (expSlots.length === 0) {
                            alert('Please add at least one time slot.');
                            return;
                          }
                          setFormStep(3);
                        }}
                        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        Next Step
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Set Price & Publish */}
                {formStep === 3 && (
                  <form onSubmit={handleCreateExperience} className="space-y-5">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Set Price in Sparks</label>
                      <p className="text-[8px] text-[var(--text-muted)] font-semibold uppercase mb-3">Escrow held. Meetify takes a 10% host commission.</p>
                    </div>

                    {/* Premium card-select grid for Price options */}
                    <div className="grid grid-cols-2 gap-3.5">
                      {[150, 250, 500, 1000].map((priceOption) => {
                        const isSelected = expPrice === priceOption;
                        return (
                          <button
                            type="button"
                            key={priceOption}
                            onClick={() => setExpPrice(priceOption)}
                            className={`p-4 rounded-2xl border text-center transition-all duration-300 cursor-pointer flex flex-col justify-between items-center gap-1.5 ${
                              isSelected 
                                ? 'bg-[var(--accent)] border-[var(--accent)] text-white scale-[1.03] shadow-lg' 
                                : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-neutral-300 hover:border-[#6366f1]/25 hover:scale-[1.01]'
                            }`}
                          >
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : undefined }}>
                              Rate Option
                            </span>
                            <span className="text-sm font-black flex items-center gap-0.5">
                              <Zap size={13} className="fill-current text-yellow-400" />
                              <span>{priceOption} Sparks</span>
                            </span>
                            <span className="text-[8px] font-bold opacity-60 uppercase">
                              Host split: {priceOption * 0.9} ES
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Summary */}
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 rounded-xl text-left space-y-1.5">
                      <p className="text-[8.5px] text-[var(--text-muted)] font-black uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">Publish Summary</p>
                      <div className="text-[9.5px] font-semibold text-[var(--text-secondary)] space-y-1">
                        <p>• Title: <strong className="text-white">{expTitle}</strong></p>
                        <p>• Category: <strong className="text-white">{expCategory}</strong></p>
                        <p>• Location: <strong className="text-white">{expLoc}</strong></p>
                        <p>• Timing: <strong className="text-white">{expDays.length} days</strong> • <strong className="text-white">{expSlots.length} slots</strong></p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white font-black uppercase text-[10px] px-5 py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        disabled={createExpLoading}
                        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase px-6 py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] shadow-md disabled:opacity-60"
                      >
                        {createExpLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                        <span>Publish to Marketplace</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* List */}
            {myExperiences.length === 0 ? (
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase text-center py-4">No experiences listed yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myExperiences.map((exp) => (
                  <div key={exp.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[7.5px] bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20 font-black uppercase px-2 py-0.5 rounded">
                        {exp.category}
                      </span>
                      <h4 className="text-xs font-black text-white mt-2 line-clamp-1">{exp.title}</h4>
                      <p className="text-[9.5px] text-[var(--text-secondary)] leading-relaxed font-semibold mt-1 line-clamp-2">{exp.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] font-black uppercase border-t border-[var(--border-subtle)] pt-2.5">
                      <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                        <Zap size={10} className="fill-current" />
                        {exp.price} ES
                      </span>
                      <span>{exp.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
