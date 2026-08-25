'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Users, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PendingCommunitiesClient() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/circles/pending');
      if (res.ok) {
        const data = await res.json();
        setCommunities(data.communities || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending communities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action} this community request?`)) return;
    
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/circles/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: id, action }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Community ${action}d successfully`);
        setCommunities(prev => prev.filter(c => c.id !== id));
      } else {
        toast.error(data.error || `Failed to ${action} community`);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading requests...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 anim-fade-in pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
            <ArrowLeft size={20} className="text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Pending Communities</h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Review user channel requests</p>
          </div>
        </div>
        <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-200">
          <ShieldCheck size={14} />
          {communities.length} Pending
        </div>
      </div>

      {communities.length === 0 ? (
        <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-12 text-center">
          <Users size={32} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-sm font-bold text-zinc-400">No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {communities.map(c => (
            <div key={c.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-4 items-start">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <Users size={24} className="text-zinc-400" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black text-zinc-900">{c.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase">{c.category}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2 max-w-lg">{c.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <img src={c.host_photo} alt="" className="w-4 h-4 rounded-full" />
                      <span>Host: {c.host_name}</span>
                    </div>
                    <div>Platform: <span className="text-zinc-800">{c.platform}</span></div>
                    <div>Price: <span className={c.isPaid ? 'text-[#F05A00]' : 'text-emerald-600'}>{c.isPaid ? `${c.price} Sparks` : 'Free'}</span></div>
                    <div>Date: {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-2 flex-shrink-0 border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-4">
                <button
                  onClick={() => handleAction(c.id, 'approve')}
                  disabled={actionId === c.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[11px] uppercase transition-colors"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => handleAction(c.id, 'reject')}
                  disabled={actionId === c.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-[11px] uppercase transition-colors"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
