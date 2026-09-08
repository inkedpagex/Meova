'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from '@/lib/icons';
import CustomSelect from '@/components/CustomSelect';

const INQUIRY_CATEGORIES = [
  'General Support',
  'Sparks Wallet & Payments',
  'Campus Circles & Communities',
  'Campus Ambassador Program',
  'Safety & Account Reporting',
  'Bug / Technical Issue',
  'Other Inquiries',
];

const LIMITS = {
  name: 70,
  email: 100,
  college: 100,
  message: 1000,
};

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    category: 'General Support',
    message: '',
  });

  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const maxLen = LIMITS[name];
    if (maxLen && value.length > maxLen) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (val) => {
    setFormData((prev) => ({ ...prev, category: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'submitting', message: '' });

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatus({ state: 'error', message: 'Please complete all required fields.' });
      return;
    }

    if (trimmedMessage.length < 10) {
      setStatus({ state: 'error', message: 'Please provide at least 10 characters in your message.' });
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          college: formData.college.trim(),
          category: formData.category,
          message: trimmedMessage,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setStatus({
          state: 'success',
          message: json.message || 'Thank you! Your inquiry has been received. Our campus support desk will reply to your email within 24 hours.',
        });
        setFormData({
          name: '',
          email: '',
          college: '',
          category: 'General Support',
          message: '',
        });
      } else {
        setStatus({
          state: 'error',
          message: json.error || 'Failed to submit inquiry. Please try again or email support@meova.in.',
        });
      }
    } catch {
      setStatus({
        state: 'error',
        message: 'Network error. Please check your connection or email us directly at support@meova.in.',
      });
    }
  };

  return (
    <div className="p-7 sm:p-9 rounded-[28px] bg-white border border-black/10 shadow-xs space-y-6 font-sans">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-black tracking-tight">Send Us a Direct Message</h2>
        <p className="text-xs text-black/70 font-medium">
          Whether you have a question about your Sparks wallet, your campus circle, or college onboarding, drop us a line below.
        </p>
      </div>

      {status.state === 'success' ? (
        <div className="p-6 rounded-[24px] bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            <span>Inquiry Submitted Successfully</span>
          </div>
          <p className="text-xs font-medium text-emerald-800 leading-relaxed">
            {status.message}
          </p>
          <button
            type="button"
            onClick={() => setStatus({ state: 'idle', message: '' })}
            className="mt-3 text-xs font-bold text-[#1C1917] hover:underline cursor-pointer"
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {status.state === 'error' && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{status.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-black">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-black/40">
                  {formData.name.length}/{LIMITS.name}
                </span>
              </div>
              <input
                type="text"
                name="name"
                required
                maxLength={LIMITS.name}
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-medium text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-black/30"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-black">
                  Student / Personal Email <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-black/40">
                  {formData.email.length}/{LIMITS.email}
                </span>
              </div>
              <input
                type="email"
                name="email"
                required
                maxLength={LIMITS.email}
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. yourname@university.edu"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-medium text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-black/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-black">
                  College / University
                </label>
                <span className="text-[10px] font-semibold text-black/40">
                  {formData.college.length}/{LIMITS.college}
                </span>
              </div>
              <input
                type="text"
                name="college"
                maxLength={LIMITS.college}
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. Delhi University / IIT / DTU"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-medium text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-black/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                Inquiry Category
              </label>
              <CustomSelect
                value={formData.category}
                onChange={handleCategoryChange}
                options={INQUIRY_CATEGORIES}
                placeholder="Select category"
                triggerClassName="w-full bg-white border border-black/15 hover:border-black/30 rounded-2xl px-4 py-3 text-sm font-medium text-black flex items-center justify-between shadow-xs transition-all cursor-pointer focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                Message / Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-semibold text-black/40">
                {formData.message.length}/{LIMITS.message}
              </span>
            </div>
            <textarea
              name="message"
              required
              rows={4}
              maxLength={LIMITS.message}
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us what you need help with or details about your inquiry (minimum 10 characters)..."
              className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-medium text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-black/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={status.state === 'submitting'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#7657D9] text-white text-xs font-bold hover:bg-[#6848C9] active:bg-[#5B3FB3] transition-all whitespace-nowrap flex-shrink-0 shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {status.state === 'submitting' ? (
              <>
                <Loader2 size={15} className="animate-spin flex-shrink-0" />
                <span className="whitespace-nowrap">Sending...</span>
              </>
            ) : (
              <>
                <Send size={14} className="flex-shrink-0" />
                <span className="whitespace-nowrap">Send Inquiry</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
