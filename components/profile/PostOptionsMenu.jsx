'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Copy, Trash2, ShieldAlert, Check, X, Loader2 } from '@/lib/icons';
import { toast } from '@/lib/toast';

export default function PostOptionsMenu({
  post,
  isOwner = false,
  onDelete = null,
  buttonClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/posts/${post.id}`
      : `https://meova.in/posts/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Post link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(post.id);
      setShowConfirmDelete(false);
      setIsOpen(false);
    } catch {
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    setIsOpen(false);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'post',
          targetId: post.id,
          reason: 'Inappropriate campus content reported via post options',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Report submitted for review');
      } else {
        toast.error(data.error || 'Failed to submit report');
      }
    } catch {
      toast.error('Network error reporting post');
    }
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={buttonClassName || "w-9 h-9 flex items-center justify-center rounded-full text-black/70 hover:text-black hover:bg-black/5 transition-colors cursor-pointer active:scale-95"}
        title="More options"
        aria-label="More options"
      >
        <MoreVertical size={18} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-black/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 font-sans"
        >
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-black hover:bg-black/5 rounded-xl transition-colors cursor-pointer text-left"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-black/60" />}
            <span>{copied ? 'Link Copied!' : 'Copy link'}</span>
          </button>

          {/* Delete Option for Owner */}
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowConfirmDelete(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <Trash2 size={14} className="text-red-500" />
              <span>Delete post</span>
            </button>
          )}

          {/* Report Option for Non-Owner */}
          {!isOwner && (
            <button
              type="button"
              onClick={handleReport}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <ShieldAlert size={14} className="text-red-500" />
              <span>Report post</span>
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {showConfirmDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[1000000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-black/10 text-center space-y-4 font-sans animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-black">Delete this post?</h3>
              <p className="text-xs text-black/60 font-medium">
                This moment will be permanently removed from your profile and the campus feed. This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirmDelete(false)}
                className="w-full py-2.5 rounded-full border border-black/15 bg-white text-black text-xs font-bold hover:bg-black/5 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
