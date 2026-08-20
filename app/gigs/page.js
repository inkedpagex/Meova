'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Briefcase, Zap, CheckCircle2, Plus, X, Sparkles, Clock, Tag
} from 'lucide-react';
import { toast } from '../../lib/toast';

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

const CATEGORIES = ['All', 'Design', 'Development', 'Writing', 'Marketing'];

// Mock data removed - using live backend data

export default function CampusGigsPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [appliedGigs, setAppliedGigs] = useState(new Set());
  const { data: gigsData, mutate: mutateGigs } = useSWR('/api/gigs', fetcher);
  const gigs = gigsData?.gigs || [];
  
  // Create Gig Modal State
  const [showModal, setShowModal] = useState(false);
  const [gigTitle, setGigTitle] = useState('');
  const [gigCompany, setGigCompany] = useState('');
  const [gigCategory, setGigCategory] = useState('Design');
  const [gigBudget, setGigBudget] = useState('300');
  const [gigDuration, setGigDuration] = useState('3 Days');
  const [gigDesc, setGigDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (searchParams?.get('action') === 'post-gig') setShowModal(true);
  }, [searchParams]);

  const handleApply = async (id) => {
    setAppliedGigs(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    
    try {
      const res = await fetch(`/api/gigs/${id}/apply`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to apply');
      toast.success('Application submitted to host! 🚀');
    } catch (e) {
      toast.error('Failed to submit application.');
    }
  };

  const handleCreateGig = async (e) => {
    e.preventDefault();
    if (!gigTitle.trim() || !gigDesc.trim()) {
      toast.error('Please fill in the gig title and description.');
      return;
    }

    setIsSubmitting(true);
    
    const newGigPayload = {
      title: gigTitle,
      company: gigCompany.trim(),
      category: gigCategory,
      budget: gigBudget || '250',
      duration: gigDuration || 'Flexible',
      type: 'CAMPUS GIG',
      desc: gigDesc
    };

    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGigPayload)
      });
      
      if (!res.ok) throw new Error('Failed to post gig');
      
      const { gig } = await res.json();
      
      // Optimistic update
      mutateGigs({ gigs: [gig, ...gigs] }, false);

      setShowModal(false);
      setGigTitle('');
      setGigCompany('');
      setGigDesc('');
      toast.success('Gig posted successfully! 🎉');
    } catch (e) {
      toast.error('Failed to post gig. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = gigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(search.toLowerCase()) || 
                          gig.desc.toLowerCase().includes(search.toLowerCase()) ||
                          gig.company.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || gig.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="anim-fade-in w-full max-w-4xl mx-auto space-y-8 pb-16 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6 pt-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-3">
              Campus Gigs
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full">
              Freelance
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-semibold">
            Hire student talent or earn Sparks through campus freelance tasks.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Post a Gig</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search gigs, skills, clubs..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-semibold transition-all focus:outline-none focus:border-purple-600 focus:bg-white text-zinc-900 placeholder-zinc-400 shadow-xs"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`text-xs font-black py-3 px-4 rounded-xl border transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider shadow-2xs ${
                selectedCat === cat 
                  ? 'bg-purple-600 border-purple-600 text-white' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gigs List */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-14 text-center text-zinc-500 font-medium shadow-xs">
            <Briefcase size={32} className="mx-auto mb-3 text-zinc-300" />
            <h4 className="text-sm font-black text-zinc-800">No campus gigs found</h4>
            <p className="text-xs text-zinc-400 mt-1 font-semibold">Be the first to post a freelance gig for your peers!</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black"
            >
              + Post a Gig
            </button>
          </div>
        ) : (
          filtered.map(gig => {
            const hasApplied = appliedGigs.has(gig.id);
            return (
              <div
                key={gig.id}
                className="bg-white border border-zinc-200/80 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100">
                      {gig.type}
                    </span>
                    <span className="text-xs text-zinc-700 font-extrabold">
                      by {gig.company}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      · {gig.duration}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-zinc-950 tracking-tight group-hover:text-purple-700 transition-colors">
                    {gig.title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-2xl">
                    {gig.desc}
                  </p>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-zinc-950 font-black text-xl tracking-tight">
                      <span>{gig.budget}</span>
                      <span className="text-amber-500 text-lg">⚡</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                      Estimated value
                    </span>
                  </div>

                  <button
                    onClick={() => handleApply(gig.id)}
                    disabled={hasApplied}
                    className={`px-5 py-2.5 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
                      hasApplied 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-2xs active:scale-95'
                    }`}
                  >
                    {hasApplied ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Applied
                      </span>
                    ) : (
                      <span>Apply Now</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── POST A GIG MODAL ────────────────────────────────────── */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in duration-200 shadow-2xl border border-purple-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-950">Post a Campus Gig</h3>
                <p className="text-[10px] font-semibold text-zinc-400">Hire student freelancers & creators</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGig} className="space-y-3.5">
              {/* Gig Title */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Gig Title</label>
                <input
                  type="text"
                  required
                  value={gigTitle}
                  onChange={e => setGigTitle(e.target.value)}
                  placeholder="e.g. Figma Designer for Campus Startup App"
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-extrabold text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50"
                />
              </div>

              {/* Host / Club Name */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Host / Club Name</label>
                <input
                  type="text"
                  value={gigCompany}
                  onChange={e => setGigCompany(e.target.value)}
                  placeholder="e.g. Coding Club or Your Name"
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50"
                />
              </div>

              {/* Category Pills */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1.5">Category</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {['Design', 'Development', 'Writing', 'Marketing'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGigCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        gigCategory === cat 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget & Duration Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Reward (Sparks ⚡)</label>
                  <input
                    type="number"
                    value={gigBudget}
                    onChange={e => setGigBudget(e.target.value)}
                    placeholder="300"
                    className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-black text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={gigDuration}
                    onChange={e => setGigDuration(e.target.value)}
                    placeholder="3 Days"
                    className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Description</label>
                <textarea
                  required
                  value={gigDesc}
                  onChange={e => setGigDesc(e.target.value)}
                  placeholder="Describe the tasks, deliverables, and skill requirements..."
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 bg-zinc-50 min-h-[80px]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={15} />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Gig to Campus'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
