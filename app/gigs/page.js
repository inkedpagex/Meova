'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Briefcase, CheckCircle2, Plus, X, Sparkles, Users, Zap,
  ArrowRight, ArrowLeft, Clock, Palette, Code, FileText, Camera, Video, Music, BookOpen, Layers
} from '@/lib/icons';
import { toast } from '../../lib/toast';
import useSWR from 'swr';
import { useUserContext } from '../../components/providers/UserProvider';
import ApplicantsDrawer from './_ApplicantsDrawer';
import MyGigsActivity from './_MyGigsActivity';

const fetcher = (url) => fetch(url).then(res => res.json());

const CATEGORIES = ['All', 'Design', 'Development', 'Writing', 'Marketing', 'Photography', 'Video/Reels', 'Music', 'Research', 'Craft/Art'];

export default function CampusGigsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, wallet } = useUserContext();

  const { data: flagsData } = useSWR('/api/feature-flags', fetcher, {
    dedupingInterval: 15000,
  });

  useEffect(() => {
    if (flagsData?.flags && flagsData.flags.gigs === false) {
      router.replace('/');
    }
  }, [flagsData, router]);

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'mine'
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [appliedGigs, setAppliedGigs] = useState(new Set());
  const [managingGig, setManagingGig] = useState(null); // gig being managed in drawer
  const [deletingGig, setDeletingGig] = useState(null);
  const { data: gigsData, mutate: mutateGigs } = useSWR('/api/gigs', fetcher);
  const fetchedGigs = (gigsData?.gigs || []).filter(g => !g.status || g.status === 'open' || g.status === 'in_progress');
  const gigs = fetchedGigs;

  // Create gig modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1 = Basics, 2 = Rewards & Scope
  const [gigTitle, setGigTitle] = useState('');
  const [gigCompany, setGigCompany] = useState('');
  const [gigCategory, setGigCategory] = useState('Design');
  const [gigBudget, setGigBudget] = useState('300');
  const [gigDuration, setGigDuration] = useState('3 Days');
  const [gigDesc, setGigDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply modal state
  const [applyingToGig, setApplyingToGig] = useState(null);
  const [pitch, setPitch] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    if (searchParams?.get('action') === 'post-gig') setShowModal(true);
    if (searchParams?.get('tab') === 'mine') setActiveTab('mine');
  }, [searchParams]);

  const handleApply = async () => {
    if (!applyingToGig) return;
    setApplyLoading(true);
    try {
      const res = await fetch(`/api/gigs/${applyingToGig.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to apply'); return; }
      setAppliedGigs(prev => new Set([...prev, applyingToGig.id]));
      toast.success('Application submitted successfully.');
      setApplyingToGig(null);
      setPitch('');
    } catch { toast.error('Network error.'); }
    finally { setApplyLoading(false); }
  };

  const handleDeleteGig = async (gigId) => {
    if (!confirm('Are you sure you want to delete this gig? Your escrowed sparks will be refunded.')) return;
    setDeletingGig(gigId);
    try {
      const res = await fetch(`/api/gigs/${gigId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to delete gig'); return; }
      toast.success('Gig deleted and Sparks refunded.');
      mutateGigs();
    } catch { toast.error('Network error.'); }
    finally { setDeletingGig(null); }
  };

  const handleBudgetChange = (e) => {
    let val = e.target.value;
    if (val === '') { setGigBudget(''); return; }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num < 0) setGigBudget('0');
    else if (num > 2000) setGigBudget('2000');
    else setGigBudget(num.toString());
  };

  const handleCreateGig = async (e) => {
    e.preventDefault();
    if (!gigTitle.trim() || !gigDesc.trim()) { toast.error('Title and description required.'); return; }
    
    const budgetNum = parseInt(gigBudget, 10) || 0;
    const totalSparks = wallet ? (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0) : 0;
    
    if (budgetNum > totalSparks) {
      toast.error(`You only have ${totalSparks} Sparks in your wallet. Buy more to post this gig.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: gigTitle, company: gigCompany.trim(), category: gigCategory, budget: gigBudget || '250', duration: gigDuration || 'Flexible', type: 'CAMPUS GIG', desc: gigDesc }),
      });
      if (!res.ok) throw new Error('Failed');
      const { gig } = await res.json();
      mutateGigs({ gigs: [gig, ...gigs] }, false);
      setShowModal(false);
      setGigTitle(''); setGigCompany(''); setGigDesc('');
      toast.success('Gig posted successfully.');
    } catch { toast.error('Failed to post gig. Try again.'); }
    finally { setIsSubmitting(false); }
  };

  const filtered = gigs.filter(gig => {
    const matchSearch = gig.title?.toLowerCase().includes(search.toLowerCase()) ||
      gig.desc?.toLowerCase().includes(search.toLowerCase()) ||
      gig.company?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'All' || gig.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="anim-fade-in w-full max-w-4xl mx-auto space-y-6 pt-2 pb-16 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7E5E4]/80 pb-5 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1C1917] tracking-tight">Campus Gigs</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full">Freelance</span>
          </div>
          <p className="text-xs text-[#78716C] mt-1 font-semibold">Hire student talent or earn Sparks through campus freelance tasks.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-hover)] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} />
          Post a Gig
        </button>
      </div>

      {/* Main tabs: Browse / My Posted Gigs / Applied Gigs */}
      <div className="flex gap-6 border-b border-[#E7E5E4]/80">
        {[
          ['browse', 'Browse Gigs'],
          ['mine', 'My Posted Gigs'],
          ['applied', 'Applied Gigs']
        ].map(([key, label]) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative py-3 text-[11px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                active ? 'text-[var(--accent)]' : 'text-[#A8A29E] hover:text-[#78716C]'
              }`}
            >
              {label}
              {active && (
                <div className="absolute bottom-[-1px] inset-x-0 h-0.5 bg-[var(--accent)] rounded-t-full shadow-[0_-2px_8px_rgba(240,90,0,0.4)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── BROWSE TAB ── */}
      {activeTab === 'browse' && (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row gap-3 items-start">
            <div className="relative w-full md:flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search gigs, skills, clubs…"
                className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 focus:bg-white text-[#1C1917] placeholder-[#A8A29E] transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`flex-shrink-0 text-[10px] font-bold py-2 px-4 rounded-full transition-all active:scale-[0.98] uppercase tracking-wider cursor-pointer ${
                    selectedCat === cat 
                    ? 'bg-[var(--accent)] text-white shadow-md border border-transparent' 
                    : 'bg-[#FAFAF8] border border-[#E7E5E4] text-[#78716C] hover:bg-[#2A2A2A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Gig Cards */}
          <div className="grid gap-4">
            {filtered.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4 bg-white rounded-3xl border border-[#E7E5E4] shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] flex items-center justify-center mb-4">
                  <Briefcase size={24} className="text-[var(--accent)]" />
                </div>
                <h3 className="text-base font-bold text-[#1C1917] tracking-tight">No Gigs Found</h3>
                <p className="text-xs font-semibold text-[#78716C] mt-1 max-w-xs leading-relaxed">
                  There are no active gigs in this category right now.
                </p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-[#1C1917] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#1C1917] transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus size={14} /> Post the first Gig
                </button>
              </div>
            ) : (
              filtered.map(gig => {
                const hasApplied = appliedGigs.has(gig.id);
                const isOwn = user?.uid === gig.authorId;
                const statusLabel = gig.status === 'in_progress' ? 'In Progress' : null;

                return (
                  <div key={gig.id} className="bg-white border border-[#E7E5E4]/80 rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[var(--accent-tint-20)] hover:shadow-[0_8px_30px_rgba(140,53,115,0.06)] hover:-translate-y-0.5 transition-all group relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-tint-10)] text-[var(--accent)] px-2.5 py-0.5 rounded-full border border-[var(--accent-tint-20)]">{gig.type || 'CAMPUS GIG'}</span>
                        {gig.author_id || gig.authorId ? (
                          <Link href={`/users/${gig.author_id || gig.authorId}`} onClick={(e) => e.stopPropagation()} className="text-xs text-[#78716C] font-extrabold hover:text-[var(--accent)] hover:underline flex items-center gap-1.5 transition-colors">
                            <div className="w-4 h-4 rounded-full bg-[var(--accent-tint-10)] flex items-center justify-center border border-[var(--accent-tint-20)]">
                              <span className="text-[8px] text-[var(--accent)] font-bold">{(gig.company || 'U')[0].toUpperCase()}</span>
                            </div>
                            by {gig.company}
                          </Link>
                        ) : (
                          <span className="text-xs text-[#78716C] font-extrabold flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-[var(--accent-tint-10)] flex items-center justify-center border border-[var(--accent-tint-20)]">
                              <span className="text-[8px] text-[var(--accent)] font-bold">{(gig.company || 'U')[0].toUpperCase()}</span>
                            </div>
                            by {gig.company}
                          </span>
                        )}
                        <span className="text-xs text-[#A8A29E]">· {gig.duration}</span>
                        {statusLabel && <span className="text-[10px] font-bold text-blue-600">{statusLabel}</span>}
                      </div>
                      <h3 className="text-base font-bold text-[#1C1917] tracking-tight group-hover:text-[var(--accent-hover)] transition-colors">{gig.title}</h3>
                      <p className="text-xs text-[#78716C] leading-relaxed max-w-2xl">{gig.desc}</p>
                    </div>

                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-[#E7E5E4] pt-4 md:pt-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[#1C1917] font-bold text-xl">{gig.budget}<Zap size={16} className="text-amber-500 fill-amber-500" /></div>
                        <span className="text-[9px] text-[#A8A29E] font-bold uppercase tracking-widest">Estimated</span>
                      </div>

                      {isOwn ? (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteGig(gig.id); }}
                            disabled={deletingGig === gig.id}
                            className="px-3 py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 cursor-pointer transition-all disabled:opacity-50"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => setManagingGig(gig)}
                            className="px-5 py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] hover:bg-[var(--accent-tint-10)] cursor-pointer transition-all flex items-center gap-1.5"
                          >
                            {(gig.applicationsCount || 0) > 0 ? (
                              <>
                                <Users size={12} />
                                <span>{gig.applicationsCount}</span>
                              </>
                            ) : (
                              <span>Manage</span>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setApplyingToGig(gig); setPitch(''); }}
                          disabled={hasApplied}
                          className={`px-5 py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer ${hasApplied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-xs active:scale-95'}`}
                        >
                          {hasApplied ? <span className="flex items-center gap-1"><CheckCircle2 size={12}/>Applied</span> : 'Apply Now'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── MY POSTED GIGS TAB ── */}
      {activeTab === 'mine' && user && (
        <MyGigsActivity userId={user.uid} onManage={setManagingGig} initialTab="posted" />
      )}

      {/* ── APPLIED GIGS TAB ── */}
      {activeTab === 'applied' && user && (
        <MyGigsActivity userId={user.uid} onManage={setManagingGig} initialTab="applied" />
      )}

      {/* ── APPLICANTS DRAWER ── */}
      {managingGig && (
        <ApplicantsDrawer gig={managingGig} onClose={() => { setManagingGig(null); mutateGigs(); }} />
      )}

      {/* ── APPLY MODAL ── */}
      {applyingToGig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 md:pb-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setApplyingToGig(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-[#f5ebf4] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">Apply to Gig</h3>
                <p className="text-[11px] text-[#A8A29E] mt-0.5 font-medium">{applyingToGig.title}</p>
              </div>
              <button onClick={() => setApplyingToGig(null)} className="p-1.5 rounded-full hover:bg-[#FAFAF8] text-[#A8A29E]"><X size={16} /></button>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-[#A8A29E] block mb-1.5">Pitch <span className="text-[#A8A29E] normal-case font-semibold">(optional — tell them why you're the one)</span></label>
              <textarea
                value={pitch}
                onChange={e => setPitch(e.target.value.slice(0, 300))}
                placeholder="e.g. I've built 3 Figma projects for clubs and can deliver in 2 days…"
                className="w-full p-3 rounded-xl border border-[#E7E5E4] text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[var(--accent)] bg-[#FAFAF8] min-h-[90px] resize-none"
              />
              <p className="text-[10px] text-[#A8A29E] mt-1 text-right">{pitch.length}/300</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-center gap-2">
              <Zap size={14} className="text-amber-500 fill-amber-500 shrink-0" />
              <p className="text-[11px] font-bold text-amber-700">If accepted you'll earn <span className="font-bold">{applyingToGig.budget}</span> Sparks on completion.</p>
            </div>
            <button
              onClick={handleApply}
              disabled={applyLoading}
              className="w-full py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              {applyLoading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}

      {/* ── POST A GIG MULTI-STEP MOBILE-FIRST MODAL ── */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-md anim-fade-in"
          onClick={() => { setShowModal(false); setModalStep(1); }}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-[#E7E5E4] max-h-[92dvh] flex flex-col overflow-hidden anim-slide-up md:anim-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Drag Pill */}
            <div className="md:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-[#2A2A2A]" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-3.5 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAFAF8]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] flex items-center justify-center shadow-2xs font-bold">
                  <Briefcase size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] leading-tight">Post a Campus Gig</h3>
                  <p className="text-[11px] font-bold text-[#A8A29E]">
                    Step {modalStep} of 2: {modalStep === 1 ? 'Gig Basics' : 'Rewards & Scope'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setShowModal(false); setModalStep(1); }}
                className="p-1.5 rounded-full text-[#A8A29E] hover:text-[#78716C] hover:bg-[#2A2A2A]/60 cursor-pointer transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-[#FAFAF8] h-1 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--accent)] to-amber-500 transition-all duration-300 ease-out"
                style={{ width: modalStep === 1 ? '50%' : '100%' }}
              />
            </div>

            {/* Form Scroll Body */}
            <form noValidate onSubmit={handleCreateGig} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* ── STEP 1: BASICS ── */}
              {modalStep === 1 && (
                <div className="space-y-4 anim-fade-in">
                  {/* Gig Title */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                      Gig Title *
                    </label>
                    <input 
                      type="text" 
                      required 
                      autoFocus
                      value={gigTitle} 
                      onChange={e => setGigTitle(e.target.value)} 
                      placeholder="e.g. Figma Designer for Campus App UI" 
                      className="w-full px-3.5 py-3 rounded-2xl border border-[#E7E5E4] text-xs font-bold text-[#1C1917] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 bg-[#FAFAF8] placeholder-[#A8A29E] transition-all" 
                    />
                  </div>

                  {/* Horizontal Scrollable Category Pills */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                      Category
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 -mx-1 px-1 select-none" style={{ scrollbarWidth: 'none' }}>
                      {[
                        { name: 'Design', icon: Palette },
                        { name: 'Development', icon: Code },
                        { name: 'Writing', icon: FileText },
                        { name: 'Marketing', icon: Sparkles },
                        { name: 'Photography', icon: Camera },
                        { name: 'Video/Reels', icon: Video },
                        { name: 'Music', icon: Music },
                        { name: 'Research', icon: BookOpen },
                        { name: 'Craft/Art', icon: Layers },
                      ].map(cat => {
                        const IconComp = cat.icon;
                        const isSelected = gigCategory === cat.name;
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => setGigCategory(cat.name)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                              isSelected
                                ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-purple-500/20'
                                : 'bg-[#FAFAF8] border-[#E7E5E4] text-[#78716C] hover:bg-[#FAFAF8] hover:text-[#1C1917]'
                            }`}
                          >
                            <IconComp size={13} className={isSelected ? 'text-white' : 'text-[#A8A29E]'} />
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Host / Club Name */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                      Host / Club Name
                    </label>
                    <input 
                      type="text" 
                      value={gigCompany} 
                      onChange={e => setGigCompany(e.target.value)} 
                      placeholder={user?.full_name || 'e.g. Coding Club or Your Name'} 
                      className="w-full px-3.5 py-3 rounded-2xl border border-[#E7E5E4] text-xs font-bold text-[#1C1917] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 bg-[#FAFAF8] placeholder-[#A8A29E] transition-all" 
                    />
                    <p className="text-[10.5px] font-semibold text-[#A8A29E] mt-1">
                      Students will see who is offering this gig.
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 2: REWARDS & SCOPE ── */}
              {modalStep === 2 && (
                <div className="space-y-4 anim-fade-in">
                  {/* Reward (Sparks) with quick presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                        Reward (Sparks) *
                      </label>
                      <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap size={10} className="fill-amber-500 text-amber-500" />
                        <span>Wallet: {(wallet?.purchased || 0) + (wallet?.bonus || 0) + (wallet?.creator || 0)}</span>
                      </span>
                    </div>

                    <div className="flex gap-1.5 mb-2">
                      {['150', '300', '500', '1000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setGigBudget(val)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            gigBudget === val
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-[#FAFAF8] border-[#E7E5E4] text-[#78716C] hover:bg-[#FAFAF8]'
                          }`}
                        >
                          {val} ⚡
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        pattern="[0-9]*" 
                        value={gigBudget} 
                        onChange={handleBudgetChange} 
                        placeholder="Custom amount (e.g. 350)" 
                        className="w-full px-3.5 py-3 pl-9 rounded-2xl border border-[#E7E5E4] text-xs font-bold text-[#1C1917] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 bg-[#FAFAF8]" 
                      />
                      <Zap size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 fill-amber-500" />
                    </div>
                  </div>

                  {/* Duration with quick presets */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                      Estimated Duration
                    </label>
                    <div className="flex gap-1.5 mb-2">
                      {['24 Hours', '3 Days', '1 Week', 'Flexible'].map(dur => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setGigDuration(dur)}
                          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer whitespace-nowrap ${
                            gigDuration === dur
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                              : 'bg-[#FAFAF8] border-[#E7E5E4] text-[#78716C] hover:bg-[#FAFAF8]'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      value={gigDuration} 
                      onChange={e => setGigDuration(e.target.value)} 
                      placeholder="e.g. 3 Days" 
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E7E5E4] text-xs font-bold text-[#1C1917] focus:outline-none focus:border-[var(--accent)] bg-[#FAFAF8]" 
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block mb-1.5">
                      Task Description *
                    </label>
                    <textarea 
                      required 
                      value={gigDesc} 
                      onChange={e => setGigDesc(e.target.value)} 
                      placeholder="Describe what deliverables are needed, skills required, or any helpful context…" 
                      rows={3}
                      className="w-full p-3.5 rounded-2xl border border-[#E7E5E4] text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 bg-[#FAFAF8] resize-none placeholder-[#A8A29E]" 
                    />
                  </div>

                  {/* Escrow Badge */}
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900">
                    <Zap size={15} className="fill-amber-500 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-relaxed">
                      <span className="font-bold">{gigBudget || '0'} Sparks</span> will be held safely in escrow only when you accept a student applicant.
                    </p>
                  </div>
                </div>
              )}

              {/* ── STICKY BOTTOM BUTTONS ── */}
              <div className="pt-2 border-t border-[#E7E5E4] flex items-center gap-2.5">
                {modalStep === 2 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-4 py-3.5 rounded-2xl border border-[#E7E5E4] text-[#78716C] text-xs font-bold uppercase tracking-wider hover:bg-[#FAFAF8] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !gigTitle.trim() || !gigDesc.trim()} 
                      className="flex-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles size={15} />
                      <span>{isSubmitting ? 'Publishing…' : 'Publish to Campus'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!gigTitle.trim()) {
                        toast.error('Please enter a gig title to continue.');
                        return;
                      }
                      setModalStep(2);
                    }}
                    className="w-full py-3.5 rounded-2xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Continue to Rewards & Scope</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
