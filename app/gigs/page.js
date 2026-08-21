'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Briefcase, CheckCircle2, Plus, X, Sparkles,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import useSWR from 'swr';
import { useUserContext } from '../../components/providers/UserProvider';
import ApplicantsDrawer from './_ApplicantsDrawer';
import MyGigsActivity from './_MyGigsActivity';

const fetcher = (url) => fetch(url).then(res => res.json());

const CATEGORIES = ['All', 'Design', 'Development', 'Writing', 'Marketing', 'Photography', 'Video/Reels', 'Music', 'Research', 'Craft/Art'];

export default function CampusGigsPage() {
  const searchParams = useSearchParams();
  const { user } = useUserContext();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'mine'
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [appliedGigs, setAppliedGigs] = useState(new Set());
  const [managingGig, setManagingGig] = useState(null); // gig being managed in drawer
  const { data: gigsData, mutate: mutateGigs } = useSWR('/api/gigs', fetcher);
  const gigs = (gigsData?.gigs || []).filter(g => !g.status || g.status === 'open' || g.status === 'in_progress');

  // Create gig modal state
  const [showModal, setShowModal] = useState(false);
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
      toast.success('Application submitted! 🚀');
      setApplyingToGig(null);
      setPitch('');
    } catch { toast.error('Network error.'); }
    finally { setApplyLoading(false); }
  };

  const handleCreateGig = async (e) => {
    e.preventDefault();
    if (!gigTitle.trim() || !gigDesc.trim()) { toast.error('Title and description required.'); return; }
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
      toast.success('Gig posted! 🎉');
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
    <div className="anim-fade-in w-full max-w-4xl mx-auto space-y-6 pb-16 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5 pt-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">Campus Gigs</h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full">Freelance</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-semibold">Hire student talent or earn Sparks through campus freelance tasks.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} />
          Post a Gig
        </button>
      </div>

      {/* Main tabs: Browse / My Gigs */}
      <div className="flex gap-1 p-1 bg-zinc-100 rounded-2xl">
        {[['browse', '🔍 Browse Gigs'], ['mine', '👤 My Activity']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── BROWSE TAB ── */}
      {activeTab === 'browse' && (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row gap-3 items-start">
            <div className="relative w-full md:flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search gigs, skills, clubs…"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:border-purple-500 focus:bg-white text-zinc-900 placeholder-zinc-400 transition-all"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`text-[10px] font-black py-2.5 px-3 rounded-xl border transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider cursor-pointer ${selectedCat === cat ? 'bg-purple-600 border-purple-600 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Gig Cards */}
          <div className="grid gap-4">
            {filtered.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-3xl p-14 text-center shadow-xs">
                <Briefcase size={32} className="mx-auto mb-3 text-zinc-300" />
                <h4 className="text-sm font-black text-zinc-800">No campus gigs found</h4>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">Be the first to post a freelance gig!</p>
                <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black cursor-pointer">
                  + Post a Gig
                </button>
              </div>
            ) : (
              filtered.map(gig => {
                const hasApplied = appliedGigs.has(gig.id);
                const isOwn = user?.uid === gig.authorId;
                const statusLabel = gig.status === 'in_progress' ? '🔄 In Progress' : null;

                return (
                  <div key={gig.id} className="bg-white border border-zinc-200/80 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-purple-300 hover:shadow-md transition-all group">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100">{gig.type || 'CAMPUS GIG'}</span>
                        <span className="text-xs text-zinc-700 font-extrabold">by {gig.company}</span>
                        <span className="text-xs text-zinc-400">· {gig.duration}</span>
                        {statusLabel && <span className="text-[10px] font-bold text-blue-600">{statusLabel}</span>}
                      </div>
                      <h3 className="text-base font-black text-zinc-950 tracking-tight group-hover:text-purple-700 transition-colors">{gig.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">{gig.desc}</p>
                    </div>

                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-zinc-950 font-black text-xl">{gig.budget}<span className="text-amber-500">⚡</span></div>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Estimated</span>
                      </div>

                      {isOwn ? (
                        <button
                          onClick={() => setManagingGig(gig)}
                          className="px-5 py-2.5 text-[10px] font-black tracking-wider uppercase rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer transition-all"
                        >
                          {(gig.applicationsCount || 0) > 0 ? `👥 ${gig.applicationsCount}` : 'Manage'}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setApplyingToGig(gig); setPitch(''); }}
                          disabled={hasApplied}
                          className={`px-5 py-2.5 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer ${hasApplied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs active:scale-95'}`}
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

      {/* ── MY ACTIVITY TAB ── */}
      {activeTab === 'mine' && user && (
        <MyGigsActivity userId={user.uid} onManage={setManagingGig} />
      )}

      {/* ── APPLICANTS DRAWER ── */}
      {managingGig && (
        <ApplicantsDrawer gig={managingGig} onClose={() => { setManagingGig(null); mutateGigs(); }} />
      )}

      {/* ── APPLY MODAL ── */}
      {applyingToGig && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setApplyingToGig(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-purple-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900">Apply to Gig</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{applyingToGig.title}</p>
              </div>
              <button onClick={() => setApplyingToGig(null)} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400"><X size={16} /></button>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1.5">Pitch <span className="text-zinc-300 normal-case font-semibold">(optional — tell them why you're the one)</span></label>
              <textarea
                value={pitch}
                onChange={e => setPitch(e.target.value.slice(0, 300))}
                placeholder="e.g. I've built 3 Figma projects for clubs and can deliver in 2 days…"
                className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-500 bg-zinc-50 min-h-[90px] resize-none"
              />
              <p className="text-[10px] text-zinc-400 mt-1 text-right">{pitch.length}/300</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
              <p className="text-[11px] font-bold text-amber-700">If accepted you'll earn <span className="font-black">{applyingToGig.budget}⚡</span> Sparks on completion.</p>
            </div>
            <button
              onClick={handleApply}
              disabled={applyLoading}
              className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              {applyLoading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}

      {/* ── POST A GIG MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-purple-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900">Post a Campus Gig</h3>
                <p className="text-[10px] font-semibold text-zinc-400">Hire student freelancers & creators</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateGig} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Gig Title</label>
                <input type="text" required value={gigTitle} onChange={e => setGigTitle(e.target.value)} placeholder="e.g. Figma Designer for Campus Startup App" className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-extrabold text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Host / Club Name</label>
                <input type="text" value={gigCompany} onChange={e => setGigCompany(e.target.value)} placeholder="e.g. Coding Club or Your Name" className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1.5">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {['Design', 'Development', 'Writing', 'Marketing', 'Photography', 'Video/Reels', 'Music', 'Research', 'Craft/Art'].map(cat => (
                    <button key={cat} type="button" onClick={() => setGigCategory(cat)} className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${gigCategory === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Reward (Sparks ⚡)</label>
                  <input type="number" value={gigBudget} onChange={e => setGigBudget(e.target.value)} placeholder="300" className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-black text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Duration</label>
                  <input type="text" value={gigDuration} onChange={e => setGigDuration(e.target.value)} placeholder="3 Days" className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Description</label>
                <textarea required value={gigDesc} onChange={e => setGigDesc(e.target.value)} placeholder="Describe tasks, deliverables, and skill requirements…" className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50 min-h-[80px]" />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                <p className="text-[11px] text-amber-700 font-bold">⚡ {gigBudget || '0'} Sparks will be held in escrow when you accept an applicant.</p>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50">
                <Sparkles size={15} />{isSubmitting ? 'Publishing…' : 'Publish Gig to Campus'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
