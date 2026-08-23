'use client';

import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, MessageSquare, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Tech & Coding',
  'Design & Creative',
  'Anime & Gaming',
  'Music & Jam',
  'Literature & Poetry',
  'Fitness & Sports',
  'Business & Startup',
  'General Discussion',
];

const PLATFORMS = [
  { id: 'WhatsApp', label: 'WhatsApp Group / Channel', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Telegram', label: 'Telegram Channel', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'Instagram', label: 'Instagram Broadcast', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'Discord', label: 'Discord Server', color: 'bg-[#fcf6fa] text-[#74295d] border-[#eac5e0]' },
];

export default function CreateCircleModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tech & Coding');
  const [platform, setPlatform] = useState('WhatsApp');
  const [price, setPrice] = useState('0');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter a community name'); return; }
    if (!link.trim()) { toast.error('Please enter your channel/group invite link'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/circles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          platform,
          price: parseInt(price, 10) || 0,
          link: link.trim(),
          description: description.trim(),
          image: image.trim() || undefined,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok && data.success) {
        toast.success('Community submitted! Pending admin approval.');
        if (onSuccess) onSuccess(data.circle);
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit community request');
      }
    } catch (err) {
      setSubmitting(false);
      toast.error('Network error, please try again');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-100 anim-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f5ebf4] text-[#74295d] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">Host a Campus Channel</h3>
              <p className="text-[11px] text-zinc-500 font-semibold">Earn 100% Sparks from every student who joins</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
          
          {/* Channel Name */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Community / Channel Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. GLA UI/UX Designers Club"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#8C3573] focus:ring-2 focus:ring-[#8C3573]/10 font-bold"
            />
          </div>

          {/* Category & Platform */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#8C3573] font-bold"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Platform Type
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#8C3573] font-bold"
              >
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Entry Fee (Sparks) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider">
                Entry Fee (Sparks)
              </label>
              <span className="text-[10px] text-[#8C3573] font-black">
                {price === '0' ? 'FREE Group' : `Paid Community (${price} Sparks/join)`}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="5"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0 for Free, or 50 Sparks"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#8C3573] font-bold pl-9"
              />
              <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C3573] fill-[#8C3573]" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              You receive 100% of these Sparks instantly whenever a student joins your community.
            </p>
          </div>

          {/* Protected Channel Link */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Private Invite Link (WhatsApp/Telegram/Insta) *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/... or https://t.me/..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#8C3573] font-bold pl-9"
              />
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <ShieldCheck size={12} />
              <span>Protected: Stored securely in Firebase. Unlocked only after Sparks payment.</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Short Description & Rules
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will members get in this channel? (e.g. Daily hackathon updates, study notes, portfolio feedback...)"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#8C3573] font-medium"
            />
          </div>

          {/* Image Banner URL */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Cover Image URL (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                value={image}
                onChange={e => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#8C3573] font-medium pl-9"
              />
              <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-[#8C3573] hover:bg-[#74295d] text-white font-black text-xs transition-all shadow-md shadow-[#8C3573]/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? 'Submitting Request...' : 'Submit Channel for Admin Approval'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
