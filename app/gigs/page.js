'use client';
import React, { useState } from 'react';
import { Search, Briefcase, Zap, CheckCircle2, DollarSign, Filter, ArrowRight } from 'lucide-react';

const CATEGORIES = ['All', 'Design', 'Development', 'Writing', 'Marketing'];

const INITIAL_GIGS = [
  {
    id: 'gig_1',
    title: 'Video Editor Needed',
    category: 'Design',
    budget: 600,
    type: 'Video & Motion',
    company: 'Fintech Club',
    desc: 'Edit short videos/Reels for our upcoming finance tech event. Must know Premiere/CapCut.',
    duration: '3 days',
  },
  {
    id: 'gig_2',
    title: 'Logo Design for Startup',
    category: 'Design',
    budget: 400,
    type: 'Branding',
    company: 'Campus E-Cell',
    desc: 'Minimal logo for an AI campus startup. Need high-res files and source SVGs.',
    duration: '1 week',
  },
  {
    id: 'gig_3',
    title: 'Instagram Post Designer',
    category: 'Marketing',
    budget: 400,
    type: 'Social Media',
    company: 'Music Society',
    desc: 'Design 5 promotional posts for our acoustic night. Theme should be retro-modern.',
    duration: '5 days',
  },
  {
    id: 'gig_4',
    title: 'Content Writer for Newsletter',
    category: 'Writing',
    budget: 300,
    type: 'Copywriting',
    company: 'GDSC',
    desc: 'Write an engaging summary of our Web3 workshop for the monthly campus tech digest.',
    duration: '2 days',
  },
  {
    id: 'gig_5',
    title: 'Next.js Frontend Bug Fixes',
    category: 'Development',
    budget: 800,
    type: 'Coding',
    company: 'Meetify Core',
    desc: 'Fix routing and state sync issues on our local Next.js client. Direct payout.',
    duration: '24 hours',
  },
];

export default function CampusGigsPage() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [appliedGigs, setAppliedGigs] = useState(new Set());

  const handleApply = (id) => {
    setAppliedGigs(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const filtered = INITIAL_GIGS.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(search.toLowerCase()) || 
                          gig.desc.toLowerCase().includes(search.toLowerCase()) ||
                          gig.company.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || gig.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="anim-fade-in w-full max-w-4xl mx-auto space-y-8 pb-12 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6 pt-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            Campus Gigs
          </h1>
          <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-widest">
            Freelance work and opportunities on campus
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black bg-[#6366f1]/10 text-[#818cf8] px-4.5 py-2.5 rounded-full border border-[#6366f1]/25">
          <Zap size={14} className="fill-current text-[#fb923c]" />
          <span className="uppercase tracking-wider text-[10px]">Earn Sparks directly into your Wallet</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search gigs, skills, clubs..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl py-3.5 pl-12 pr-4 text-xs font-semibold transition-all focus:outline-none focus:border-[#6366f1]/40 text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-inner"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className="text-xs font-black py-3.5 px-5 rounded-2xl border transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider shadow-sm"
              style={selectedCat === cat 
                ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#ffffff' }
                : { background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gigs List */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2rem] p-16 text-center text-[var(--text-secondary)] font-medium shadow-md">
            <Briefcase size={28} className="mx-auto mb-3 text-[var(--text-muted)]" />
            No campus gigs match your filter.
          </div>
        ) : (
          filtered.map(gig => {
            const hasApplied = appliedGigs.has(gig.id);
            return (
              <div
                key={gig.id}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#6366f1]/35 transition-all duration-300 group shadow-md"
              >
                <div className="flex-1 space-y-3.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-[#6366f1]/10 text-[#818cf8] px-2.5 py-1 rounded-md border border-[#6366f1]/15">
                      {gig.type}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] font-bold">
                      by {gig.company}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">
                      · {gig.duration}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-black text-[var(--text-primary)] tracking-tight group-hover:text-[#818cf8] transition-colors">
                    {gig.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl">
                    {gig.desc}
                  </p>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-[var(--border-subtle)] pt-4 md:pt-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[var(--text-primary)] font-black text-xl tracking-tight">
                      <span>{gig.budget}</span>
                      <span className="text-[#fb923c] text-lg">⚡</span>
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                      Estimated value
                    </span>
                  </div>

                  <button
                    onClick={() => handleApply(gig.id)}
                    disabled={hasApplied}
                    className="px-6 py-3 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all duration-200"
                    style={hasApplied 
                      ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                      : { background: 'var(--accent)', color: '#ffffff' }
                    }
                  >
                    {hasApplied ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        Applied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Apply
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
