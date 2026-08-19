'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Coffee, Pencil, CheckCircle, ShieldAlert,
  Loader2, MapPin, Zap, Plus, Trash2, Clock
} from 'lucide-react';
import { APPROVED_LOCATIONS } from '../../../lib/constants';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_OPTIONS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM',
];

// Individual slot row component
function SlotRow({ slot, index, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-2.5 shadow-sm">
      <select
        value={slot.day}
        onChange={e => onUpdate(index, 'day', e.target.value)}
        className="flex-1 bg-transparent text-xs font-bold text-zinc-900 outline-none cursor-pointer"
      >
        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <div className="w-px h-5 bg-zinc-200 flex-shrink-0" />
      <select
        value={slot.time}
        onChange={e => onUpdate(index, 'time', e.target.value)}
        className="flex-1 bg-transparent text-xs font-bold text-zinc-900 outline-none cursor-pointer"
      >
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-50 transition-colors flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function CreateExperienceClient({ currentUser }) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Coffee');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState(APPROVED_LOCATIONS[3]);
  const [price, setPrice] = useState(150);
  const [description, setDescription] = useState('');

  // Time slots
  const [slots, setSlots] = useState([
    { day: 'Monday', time: '4:00 PM' },
    { day: 'Wednesday', time: '5:00 PM' },
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = ['Coffee', 'Study', 'Sports', 'Social', 'Other'];
  const prices = [150, 250, 500, 1000];
  const durations = [30, 45, 60, 90];

  const addSlot = () => {
    if (slots.length >= 10) return;
    setSlots(prev => [...prev, { day: 'Monday', time: '4:00 PM' }]);
  };

  const updateSlot = (index, field, value) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSlot = (index) => {
    if (slots.length <= 1) return; // Keep at least one slot
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Please enter an experience title.');
    if (slots.length === 0) return alert('Please add at least one time slot.');

    setLoading(true);
    try {
      const uniqueDays = [...new Set(slots.map(s => s.day))];
      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          description,
          price: Number(price),
          duration: Number(duration),
          location,
          days: uniqueDays,
          slots, // structured slots array
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
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
              Your meetup &quot;<span className="text-zinc-950 font-bold">{title}</span>&quot; is now live with {slots.length} time slot{slots.length > 1 ? 's' : ''}!
            </p>
          </div>
          <p className="text-[10px] text-zinc-400 animate-pulse">Redirecting to discovery feed...</p>
        </div>
      ) : (
        <form onSubmit={handlePublish} className="space-y-6">

          {/* Hero Banner */}
          <div className="w-full h-44 rounded-[2rem] bg-gradient-to-tr from-[#6366f1] via-[#a855f7] to-[#ec4899] flex flex-col items-center justify-center relative overflow-hidden shadow-md">
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
              Experience Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Coffee & DSA Session ☕"
              className="w-full bg-white border border-zinc-200 focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 rounded-2xl p-3.5 text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none transition-all font-semibold shadow-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              What will you do? (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. We'll work through DSA problems, I'll share tips for placements and we can grab a coffee while doing it..."
              className="w-full bg-white border border-zinc-200 focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 rounded-2xl p-3.5 text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none transition-all font-semibold shadow-sm resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    category === cat
                      ? 'bg-[#7c3aed] border-transparent text-white shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              Location (Approved Campus Spots)
            </label>
            <div className="relative flex items-center">
              <MapPin size={13} className="absolute left-3.5 text-[#7c3aed] pointer-events-none z-10" />
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-xs font-bold text-zinc-950 rounded-2xl px-3.5 pl-9 py-3.5 outline-none cursor-pointer shadow-sm appearance-none"
              >
                {APPROVED_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc.replace(/[^\x00-\x7F]/g, '').trim()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              Session Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durations.map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 border rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    duration === d
                      ? 'bg-[#7c3aed] border-transparent text-white shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Sparks Price */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">
              Sparks Price
            </label>
            <div className="grid grid-cols-4 gap-2">
              {prices.map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPrice(p)}
                  className={`py-3.5 border rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                    price === p
                      ? 'bg-[#7c3aed] border-transparent text-white shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <span>{p}</span>
                  {price === p && <Zap size={10} className="fill-current text-[#fb923c]" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── TIME SLOTS ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={11} />
                Your Available Time Slots
              </label>
              <span className="text-[9px] font-bold text-zinc-400">{slots.length}/10</span>
            </div>

            <div className="space-y-2 mb-3">
              {slots.map((slot, i) => (
                <SlotRow
                  key={i}
                  slot={slot}
                  index={i}
                  onUpdate={updateSlot}
                  onRemove={removeSlot}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addSlot}
              disabled={slots.length >= 10}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 rounded-2xl text-xs font-black text-zinc-400 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus size={14} />
              Add Time Slot
            </button>

            <p className="text-[9px] text-zinc-400 font-semibold mt-2 ml-1">
              Students will pick from these slots when booking you.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-black uppercase tracking-wider py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Publish Experience</span>
            )}
          </button>

          {/* Safety */}
          <div className="bg-amber-500/5 border border-amber-500/10 text-amber-500 p-3 rounded-2xl text-[9px] font-bold uppercase tracking-wide leading-relaxed flex items-start gap-2 shadow-inner">
            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
            <span>Experiences happen only in approved campus locations. Never private or isolated spots.</span>
          </div>

        </form>
      )}
    </div>
  );
}
