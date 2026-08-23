'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, ArrowLeft, Loader2, Sparkles, Image as ImageIcon, CheckCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from '../../../lib/toast';

export default function CreatePhotoClient({ currentUser }) {
  const router = useRouter();

  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Food & Meets');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to post a photo.');
      router.push('/login');
      return;
    }

    if (!file) {
      toast.error('Please select a photo to share!');
      return;
    }

    setUploading(true);
    try {
      // 1. Compress image before upload
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Cloudinary using unsigned preset
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqq68y5ep';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'meetify_unsigned';

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', uploadPreset);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!cloudRes.ok) throw new Error('Cloudinary upload failed');
      const cloudData = await cloudRes.json();
      const photoUrl = cloudData.secure_url;

      // 3. Post to backend
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl,
          caption,
          category,
          location: 'Campus',
        }),
      });

      if (res.ok) {
        toast.success('Campus Moment posted successfully! 🎉');
        router.push('/');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to save post.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 px-4 py-6 max-w-[540px] mx-auto anim-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-black text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest bg-pink-50 border border-pink-100 px-3 py-1 rounded-full">
          Campus Moments
        </span>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
        <div>
          <h1 className="text-xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
            <Camera size={22} className="text-pink-500" />
            Share Campus Photo
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Post food photos, coffee meets, or campus vibes with your peers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Picker Container */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
              Select Photo
            </label>
            {filePreview ? (
              <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setFilePreview(''); }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-52 w-full rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-pink-50/50 hover:border-pink-300 transition-all cursor-pointer text-center p-4">
                <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-2">
                  <ImageIcon size={22} />
                </div>
                <span className="text-xs font-black text-zinc-800">Click to choose a photo</span>
                <span className="text-[10px] text-zinc-400 font-medium mt-1">PNG, JPG, WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Category Pills Grid */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
              Select Category
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'Food & Meets', label: 'Food & Meets', emoji: '🍕' },
                { id: 'Campus Vibe', label: 'Campus Vibe', emoji: '🏫' },
                { id: 'Study Spot', label: 'Study Spot', emoji: '📚' },
                { id: 'Event / Hangout', label: 'Event / Hangout', emoji: '🎉' },
              ].map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-[#8C3573] text-white border-transparent shadow-md scale-[1.02]'
                        : 'bg-zinc-50 border-zinc-200/90 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Trying the new cold coffee at Canteen #2! Great spot for quick connects ☕"
              className="w-full p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-pink-500 transition-all min-h-[90px]"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-pink-500 to-[#8C3573] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer uppercase tracking-wider"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading to Cloudinary...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Post Campus Moment</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
