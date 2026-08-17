'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Coffee, Pencil, CheckCircle, ShieldAlert, Loader2, Calendar, Clock, MapPin, Zap 
} from 'lucide-react';
import { APPROVED_LOCATIONS } from '../../../lib/constants';

export default function CreateExperienceClient({ currentUser }) {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Coffee');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState(APPROVED_LOCATIONS[3]); // Default to Tech Hub Cafeteria
  const [price, setPrice] = useState(150);

  // Status states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = ['Coffee', 'Study', 'Sports', 'Social', 'Other'];
  const prices = [150, 250, 500, 1000];

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Please enter an experience title.');

    setLoading(true);

    try {
      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          price: Number(price),
          duration: Number(duration),
          location,
          days: ['Any'],
          slots: ['Anytime'],
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Redirect to homepage after 1.5 seconds
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create experience.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-elevated)] px-4 py-8 max-w-[500px] mx-auto anim-fade-in pb-16">
      
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:scale-105 active:scale-95 transition-all text-zinc-900 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <h1 className="text-[14px] font-black uppercase tracking-wider text-zinc-950">
          Create Experience
        </h1>
      </div>

      {success ? (
        <div className="text-center py-20 space-y-6 bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm anim-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-950">Experience Published!</h3>
            <p className="text-xs text-zinc-600 leading-relaxed mt-2 font-semibold">
              Your meetup "<span className="text-zinc-950 font-bold">{title}</span>" has been successfully listed in the campus discovery feed!
            </p>
          </div>
          <p className="text-[10px] text-zinc-400 animate-pulse">Redirecting to discovery feed...</p>
        </div>
      ) : (
        <form onSubmit={handlePublish} className="space-y-6">
          
          {/* Hero Banner */}
          <div className="w-full h-44 rounded-[2rem] bg-gradient-to-tr from-[#6366f1] via-[#a855f7] to-[#ec4899] flex flex-col items-center justify-center relative overflow-hidden shadow-md">
            {/* Absolute Decorative Blobs */}
            <div className="absolute top-2 left-6 w-16 h-16 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-4 right-10 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center space-y-2">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-inner">
                <Coffee size={36} className="text-white fill-current animate-pulse" />
              </div>
            </div>

            <button
              type="button"
              className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Pencil size={12} strokeWidth={2.5} />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              Experience title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coffee Connect ☕"
              className="w-full bg-white border border-zinc-200 focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 rounded-2xl p-3.5 text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none transition-all font-semibold shadow-sm"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#7c3aed] border-transparent text-white shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
                Location (Approved)
              </label>
              <div className="relative flex items-center h-full">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-full bg-white border border-zinc-200 text-xs font-bold text-zinc-950 rounded-2xl px-3.5 py-0 outline-none cursor-pointer pr-10 shadow-sm appearance-none"
                >
                  {APPROVED_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc.replace(/[^\x00-\x7F]/g, '').trim()}
                    </option>
                  ))}
                </select>
                <CheckCircle size={14} className="absolute right-3 text-emerald-500 fill-emerald-500/10 flex-shrink-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Price Selector */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              Sparks price
            </label>
            <div className="grid grid-cols-4 gap-2">
              {prices.map((p) => {
                const isSelected = price === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPrice(p)}
                    className={`py-3.5 border rounded-2xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-[#7c3aed] border-transparent text-white shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
                    }`}
                  >
                    <span>{p}</span>
                    {isSelected && <Zap size={10} className="fill-current text-[#fb923c]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-black uppercase tracking-wider py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Publishing Experience...</span>
              </>
            ) : (
              <span>Publish Experience</span>
            )}
          </button>

          {/* Safety disclaimer */}
          <div className="bg-amber-500/5 border border-amber-500/10 text-amber-500 p-3 rounded-2xl text-[9px] font-bold uppercase tracking-wide leading-relaxed flex items-start gap-2 shadow-inner">
            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
            <span>Experiences happen in approved public locations. Never private or isolated slots.</span>
          </div>

        </form>
      )}

    </div>
  );
}
