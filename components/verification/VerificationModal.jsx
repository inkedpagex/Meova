'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Camera, Upload, CheckCircle2, AlertCircle, Clock,
  X, Loader2, FileText, ArrowRight
} from '@/lib/icons';
import imageCompression from 'browser-image-compression';

export default function VerificationModal({ isOpen, onClose, onVerified }) {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Status state
  const [statusData, setStatusData] = useState(null);

  // Form files
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState('');

  const selfieInputRef = useRef(null);
  const idInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchStatus();
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/verification/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.tier === 'verified' && onVerified) {
          onVerified();
        }
      }
    } catch (err) {
      console.error('[fetchStatus]', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  if (!isOpen) return null;

  const handleSelfieSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Selfie image must be less than 8MB.');
      return;
    }
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleIdSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ID document must be less than 10MB.');
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const uploadFile = async (file) => {
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
    const compressed = await imageCompression(file, options);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqq68y5ep';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Meova_unsigned';

    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Cloud storage upload failed');
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!selfieFile || !idFile) {
      setErrorMsg('Both your live selfie and college ID document are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setUploadStage('Compressing and uploading live selfie...');
      const selfieUrl = await uploadFile(selfieFile);

      setUploadStage('Uploading student ID document securely...');
      const idUrl = await uploadFile(idFile);

      setUploadStage('Submitting for campus review...');
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfie_url: selfieUrl,
          id_document_url: idUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit verification request.');
      }

      setSuccessMsg('Your verification request was submitted successfully! Campus safety desk will review it shortly.');
      fetchStatus();
    } catch (err) {
      console.error('[VerificationModal submit]', err);
      setErrorMsg(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadStage('');
    }
  };

  const isPending = statusData?.verification_status === 'pending';
  const isCooldown = statusData?.is_cooldown_active;
  const isRejected = statusData?.verification_status === 'rejected';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={() => !submitting && onClose()}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden anim-scale-in max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-white flex-shrink-0 flex items-center justify-between"
          style={{ background: 'var(--accent)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Campus Trust Verification</h3>
              <p className="text-[11px] text-white/80 font-medium">
                Unlock peer calling &amp; member-to-member meetups
              </p>
            </div>
          </div>

          {!submitting && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar text-[#1C1917]">
          {loadingStatus ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
              <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Checking verification status...</p>
            </div>
          ) : isPending ? (
            /* Pending State */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1C1917]">Under Campus Review</h4>
                <p className="text-xs text-[#78716C] mt-1.5 max-w-sm mx-auto leading-relaxed font-medium">
                  Your student documents are actively being reviewed by the safety desk. You will receive an immediate notification once approved!
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E7E5E4] text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#78716C]">Current Tier</span>
                  <span className="font-bold text-[#1C1917]">Free Meet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#78716C]">Turnaround Time</span>
                  <span className="font-bold text-[#1C1917]">2 to 4 hours</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-95 transition-all cursor-pointer"
                style={{ background: 'var(--accent)' }}
              >
                Close
              </button>
            </div>
          ) : isCooldown ? (
            /* Cooldown State */
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1C1917]">Resubmission Cooldown Active</h4>
                <p className="text-xs text-[#78716C] mt-1.5 max-w-sm mx-auto leading-relaxed font-medium">
                  Previous verification request was not approved. A cooling-off period is active to maintain campus integrity.
                </p>
              </div>
              {statusData?.rejection_reason && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left">
                  <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Reason provided</p>
                  <p className="mt-1">{statusData.rejection_reason}</p>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E7E5E4] text-xs space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#78716C]">Resubmission Available At</span>
                  <span className="font-bold text-[#1C1917]">
                    {new Date(statusData.next_eligible_resubmit_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#78716C]">Past Rejections</span>
                  <span className="font-bold text-rose-600">{statusData.rejection_count}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-95 transition-all cursor-pointer"
                style={{ background: 'var(--accent)' }}
              >
                Understood
              </button>
            </div>
          ) : (
            /* Standard Upload Form */
            <div className="space-y-5">
              {isRejected && statusData?.rejection_reason && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Previous Rejection Reason</p>
                  <p className="mt-1">{statusData.rejection_reason}</p>
                  <p className="text-[11px] text-rose-600 mt-1 font-normal">Please ensure both photos are bright, clear, and unblurred.</p>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Upload Item 1: Live Selfie */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera size={13} className="text-[var(--accent)]" /> 1. Live Front-Facing Selfie
                  </span>
                  {selfieFile && <span className="text-emerald-600 font-bold text-[11px]">Selected</span>}
                </label>
                <input
                  type="file"
                  ref={selfieInputRef}
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleSelfieSelect}
                />
                <div
                  onClick={() => selfieInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    selfiePreview
                      ? 'border-[var(--accent)] bg-[var(--accent-tint-10)]/30'
                      : 'border-[#E7E5E4] hover:border-[var(--accent-tint-20)] bg-[#FAFAF8]'
                  }`}
                >
                  {selfiePreview ? (
                    <img src={selfiePreview} alt="Selfie preview" className="w-16 h-16 rounded-xl object-cover shadow-xs border border-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E7E5E4] flex items-center justify-center text-[var(--accent)] shadow-2xs">
                      <Camera size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#1C1917]">
                      {selfieFile ? selfieFile.name : 'Take or select live selfie'}
                    </p>
                    <p className="text-[11px] text-[#78716C] mt-0.5 font-medium">
                      Must show your clear face without sunglasses or hats.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Item 2: College ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#78716C] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} className="text-[var(--accent)]" /> 2. College ID Document
                  </span>
                  {idFile && <span className="text-emerald-600 font-bold text-[11px]">Selected</span>}
                </label>
                <input
                  type="file"
                  ref={idInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleIdSelect}
                />
                <div
                  onClick={() => idInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    idPreview
                      ? 'border-[var(--accent)] bg-[var(--accent-tint-10)]/30'
                      : 'border-[#E7E5E4] hover:border-[var(--accent-tint-20)] bg-[#FAFAF8]'
                  }`}
                >
                  {idPreview ? (
                    <img src={idPreview} alt="ID preview" className="w-16 h-16 rounded-xl object-cover shadow-xs border border-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E7E5E4] flex items-center justify-center text-[var(--accent)] shadow-2xs">
                      <Upload size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#1C1917]">
                      {idFile ? idFile.name : 'Upload student ID card photo'}
                    </p>
                    <p className="text-[11px] text-[#78716C] mt-0.5 font-medium">
                      Physical campus student ID card or portal screenshot.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badge Note */}
              <div className="p-3.5 rounded-2xl bg-[#FAFAF8] border border-[#E7E5E4] text-[11px] text-[#78716C] leading-relaxed font-medium">
                Your ID document is securely encrypted and held in a private vault. It is never displayed publicly on your student profile.
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !selfieFile || !idFile}
                className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md text-white"
                style={{ background: 'var(--accent)' }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadStage || 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Campus Verification</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}