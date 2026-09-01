'use client';
import { useState } from 'react';
import { Ban, Loader2, ShieldAlert, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '../../lib/toast';

export default function BlockUserButton({ targetUid, targetName, isLoggedIn, iconOnly = false }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleOpenBlockModal = (e) => {
    e?.stopPropagation();
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setShowModal(true);
  };

  const handleConfirmBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid })
      });
      
      if (!res.ok) throw new Error('Failed to block user');
      
      setShowModal(false);
      toast.success(`${targetName || 'User'} has been blocked.`);
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error('Failed to block user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {iconOnly ? (
        <button
          onClick={handleOpenBlockModal}
          disabled={loading}
          title="Block User"
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200/60 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
        </button>
      ) : (
        <button
          onClick={handleOpenBlockModal}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black text-rose-500 hover:text-rose-600 transition-all bg-rose-50 border border-rose-200/80 hover:bg-rose-100 active:scale-95 shadow-sm cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          Block
        </button>
      )}

      {/* Modern Custom Confirmation Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in"
          onClick={() => !loading && setShowModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-2xl p-6 border border-zinc-100 shadow-2xl space-y-4 anim-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Icon */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <button 
                onClick={() => !loading && setShowModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Text */}
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Block {targetName || 'Student'}?
              </h3>
              <p className="text-xs font-medium text-zinc-500 mt-1.5 leading-relaxed">
                They will no longer be able to message you, view your profile, or appear in your campus feed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 transition-all shadow-md shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
