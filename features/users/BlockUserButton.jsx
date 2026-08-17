'use client';
import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BlockUserButton({ targetUid, targetName, isLoggedIn }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBlock = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    
    if (!confirm(`Are you sure you want to block ${targetName}? They will no longer appear in your feed or messages.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid })
      });
      if (!res.ok) throw new Error('Failed to block user');
      
      alert(`${targetName} has been blocked.`);
      router.push('/'); // Redirect to feed after blocking
    } catch (err) {
      console.error(err);
      alert('Failed to block user. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-rose-500 hover:text-rose-600 transition-all bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 shadow-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
      Block
    </button>
  );
}
