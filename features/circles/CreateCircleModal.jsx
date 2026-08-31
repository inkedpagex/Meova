'use client';

import React, { useState, useRef } from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, MessageSquare, Image as ImageIcon, Link as LinkIcon, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { useUserContext } from '../../components/providers/UserProvider';

const CATEGORIES = [
  'Tech',
  'Design',
  'Gaming',
  'Music',
  'Sports',
  'Startup',
  'Creators',
  'Entertainment',
  'General',
];

const PLATFORMS = [
  { id: 'WhatsApp', label: 'WhatsApp Group / Channel', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Telegram', label: 'Telegram Channel', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'Instagram', label: 'Instagram Broadcast', color: 'bg-orange-50 text-pink-700 border-pink-200' },
  { id: 'Discord', label: 'Discord Server', color: 'bg-[#fcf6fa] text-[#D94F00] border-[#eac5e0]' },
];

export default function CreateCircleModal({ isOpen, onClose, onSuccess }) {
  const { user, wallet } = useUserContext();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tech');
  const [platform, setPlatform] = useState('WhatsApp');
  const [price, setPrice] = useState('50');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    try {
      setImageUploading(true);
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvqsosbeh';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Meova_unsigned';

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setImage(data.secure_url);
        toast.success('Cover photo uploaded!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      console.error('[handleImageFileSelect]', err);
      toast.error('Error uploading cover photo');
    } finally {
      setImageUploading(false);
    }
  };

  if (!isOpen) return null;

  const isAdmin = user?.role === 'admin';
  const totalSparks = wallet ? (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0) : 0;
  const creationFee = isAdmin ? 0 : 100;
  const hasEnoughSparks = totalSparks >= creationFee;

  const handlePriceChange = (e) => {
    let val = e.target.value;
    // Allow empty string to let user clear the input
    if (val === '') {
      setPrice('');
      return;
    }
    // Parse as integer and prevent negatives
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num < 0) {
      setPrice('0');
    } else {
      setPrice(num.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter a community name'); return; }
    if (!link.trim()) { toast.error('Please enter your channel/group invite link'); return; }
    if (!hasEnoughSparks) { toast.error('Insufficient Sparks to create a channel.'); return; }

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
    <div className="fixed inset-x-0 bottom-0 md:inset-0 z-[101] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center anim-fade-in">
      <div className="bg-white rounded-t-[32px] md:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-100 anim-slide-up md:anim-scale-in flex flex-col max-h-[90vh] pb-safe">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F05A00] flex items-center justify-center">
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
        <form noValidate onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
          
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
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#F05A00] focus:ring-2 focus:ring-[#F05A00]/10 font-bold"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-black transition-all ${category === cat ? 'bg-[#F05A00] text-white shadow-md' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-2">
              Platform Type
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-black transition-all border ${platform === p.id ? p.color : 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Fee (Sparks) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider">
                Entry Fee (Sparks)
              </label>
              <span className="text-[10px] text-[#F05A00] font-black">
                {price === '0' ? 'FREE Group' : `Paid Community (${price} Sparks/join)`}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={price}
                onChange={handlePriceChange}
                placeholder="0 for Free, or 50 Sparks"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#F05A00] font-bold pl-9"
              />
              <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F05A00] fill-[#F05A00]" />
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
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-[#F05A00] font-bold pl-9"
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
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#F05A00] font-medium"
            />
          </div>

          {/* Cover Photo Upload */}
          <div>
            <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
              Circle Cover Photo (Optional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleImageFileSelect}
              className="hidden"
            />

            {image ? (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-[16/9] bg-zinc-100 group">
                <img src={image} alt="Circle cover preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="px-3 py-1.5 bg-white text-zinc-900 rounded-xl text-xs font-black shadow-md hover:bg-zinc-100 transition-all cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="p-1.5 bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                  imageUploading 
                    ? 'border-orange-300 bg-orange-50/50' 
                    : 'border-zinc-200 hover:border-[#F05A00] hover:bg-orange-50/30'
                }`}
              >
                {imageUploading ? (
                  <div className="space-y-1 py-2">
                    <Loader2 size={20} className="animate-spin text-[#F05A00] mx-auto" />
                    <p className="text-xs font-black text-zinc-700">Uploading cover...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#F05A00] flex items-center justify-center">
                      <Camera size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-zinc-900">Upload Cover Photo</p>
                      <p className="text-[10px] text-zinc-400 font-semibold">PNG, JPG up to 10MB</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            {!isAdmin && (
              <div className="flex items-center justify-between mb-3 bg-zinc-50 border border-zinc-100 p-3 rounded-2xl">
                <div>
                  <p className="text-[11px] font-black text-zinc-800">Creation Fee</p>
                  <p className="text-[10px] font-bold text-zinc-500">One-time payment</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-black text-[#F05A00] flex items-center justify-end gap-1">
                    100 <Sparkles size={12} className="fill-[#F05A00]" />
                  </p>
                  <p className={`text-[10px] font-bold ${hasEnoughSparks ? 'text-emerald-600' : 'text-rose-500'}`}>
                    Balance: {totalSparks}
                  </p>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={submitting || !hasEnoughSparks}
              className="w-full py-3 rounded-2xl bg-[#F05A00] hover:bg-[#D94F00] text-white font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Request...' : (
                isAdmin ? 'Create Official Channel' : (hasEnoughSparks ? 'Pay 100 Sparks & Submit' : 'Insufficient Sparks')
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
