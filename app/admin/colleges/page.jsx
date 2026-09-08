'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Check, X, Loader2, AlertCircle,
  CheckCircle2, Trash2, Edit3, MapPin, Globe, RefreshCw
} from '@/lib/icons';

export default function AdminCollegesPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    city: '',
    state: '',
    domain: '',
    is_active: true,
  });

  const loadColleges = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/colleges');
      if (!res.ok) throw new Error('Failed to load universities list');
      const data = await res.json();
      setColleges(data.colleges || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error loading colleges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add university');

      setSuccessMsg(`"${form.name.trim()}" successfully added to the university network!`);
      setForm({ name: '', city: '', state: '', domain: '', is_active: true });
      setShowAddModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadColleges();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error adding university');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCollege?.id || !editingCollege.name?.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCollege),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update university');

      setSuccessMsg(`"${editingCollege.name.trim()}" updated successfully!`);
      setEditingCollege(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadColleges();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error updating university');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (college) => {
    setProcessingId(college.id);
    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: college.id, is_active: !college.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
      setColleges(prev =>
        prev.map(c => (c.id === college.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Status toggle failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (college) => {
    if (!confirm(`Are you sure you want to remove "${college.name}" from the network?`)) {
      return;
    }

    setProcessingId(college.id);
    try {
      const res = await fetch(`/api/admin/colleges?id=${college.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete university');
      setSuccessMsg(`"${college.name}" was removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setColleges(prev => prev.filter(c => c.id !== college.id));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete college');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredColleges = colleges.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.state || '').toLowerCase().includes(q) ||
      (c.domain || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter text-black">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-[28px] bg-white border border-black/10 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-black">
            <Building2 size={20} />
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">University &amp; Campus Directory</h1>
          </div>
          <p className="text-xs text-black/60 font-medium">
            Add, verify, and manage university campuses. Added universities immediately become searchable in onboarding, forms, and ambassador rosters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={loadColleges}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-black/15 text-xs font-bold text-black hover:border-black/30 hover:text-black active:scale-95 transition-all shadow-2xs whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white text-xs font-bold active:scale-95 transition-all shadow-sm shadow-[#7657D9]/12 whitespace-nowrap flex-shrink-0 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add University</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-black/10 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities by name, city, state, or email domain..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-black/35"
          />
        </div>
        <span className="text-xs font-bold text-black/50 px-3 whitespace-nowrap">
          {filteredColleges.length} {filteredColleges.length === 1 ? 'Campus' : 'Campuses'}
        </span>
      </div>

      {/* Colleges List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-black/40 space-y-3">
          <Loader2 size={32} className="animate-spin text-[#7657D9]" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading universities...</p>
        </div>
      ) : filteredColleges.length === 0 ? (
        <div className="py-16 p-8 rounded-[28px] bg-white border border-black/10 text-center space-y-3">
          <Building2 size={36} className="mx-auto text-black/20" />
          <h3 className="text-base font-bold text-black">No universities found</h3>
          <p className="text-xs text-black/50 max-w-sm mx-auto font-medium">
            {search ? 'Try adjusting your search terms.' : 'Add your first university using the button above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredColleges.map((college) => {
            const isProcessing = processingId === college.id;
            return (
              <div
                key={college.id}
                className="p-5 sm:p-6 rounded-[28px] bg-white border border-black/10 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  {/* Top Status & Domain */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        college.is_active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-black/5 text-black/50 border-black/10'
                      }`}
                    >
                      {college.is_active ? 'Active Campus' : 'Disabled'}
                    </span>

                    {college.domain && (
                      <span className="text-[11px] font-bold text-black/80 bg-black/5 px-2.5 py-0.5 rounded-full border border-black/10 truncate max-w-[150px]">
                        @{college.domain}
                      </span>
                    )}
                  </div>

                  {/* College Name */}
                  <h3 className="text-base font-bold text-black leading-snug pt-1">
                    {college.name}
                  </h3>

                  {/* Location Info */}
                  <div className="flex items-center gap-1.5 text-xs text-black/60 font-medium">
                    <MapPin size={13} className="text-black/60 flex-shrink-0" />
                    <span>
                      {[college.city, college.state].filter(Boolean).join(', ') || 'India'}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleToggleActive(college)}
                    className={`text-xs font-bold transition-colors cursor-pointer ${
                      college.is_active
                        ? 'text-black/60 hover:text-rose-600'
                        : 'text-emerald-700 hover:text-emerald-800'
                    }`}
                  >
                    {college.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setEditingCollege({ ...college })}
                      className="p-2 rounded-full hover:bg-black/5 text-black/70 hover:text-black transition-colors cursor-pointer"
                      title="Edit University"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDelete(college)}
                      className="p-2 rounded-full hover:bg-rose-50 text-black/50 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete University"
                    >
                      {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add University Modal ────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !submitting && setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-md p-7 shadow-2xl border border-black/10 space-y-5 text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2 text-black">
                <Building2 size={20} />
                <h2 className="text-lg font-black text-black">Add New University</h2>
              </div>
              {!submitting && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full hover:bg-black/5 text-black/50 cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form noValidate onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-black">
                  University / College Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Delhi Technological University (DTU)"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-black">
                    City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. New Delhi"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-black">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="e.g. Delhi"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-black">
                  Official Email Domain (Optional)
                </label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={(e) => setForm(f => ({ ...f, domain: e.target.value }))}
                  placeholder="e.g. dtu.ac.in (for student auto-verification)"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/30"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="add-active"
                  checked={form.is_active}
                  onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-black rounded cursor-pointer"
                />
                <label htmlFor="add-active" className="text-xs font-bold text-black select-none cursor-pointer">
                  Activate campus immediately across Meova network
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white text-xs font-bold shadow-sm shadow-[#7657D9]/12 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving University...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Add University to Network</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit University Modal ───────────────────────────────────── */}
      {editingCollege && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !submitting && setEditingCollege(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-md p-7 shadow-2xl border border-black/10 space-y-5 text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2 text-black">
                <Edit3 size={20} />
                <h2 className="text-lg font-black text-black">Edit University</h2>
              </div>
              {!submitting && (
                <button
                  type="button"
                  onClick={() => setEditingCollege(null)}
                  className="p-1 rounded-full hover:bg-black/5 text-black/50 cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form noValidate onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-black">
                  University / College Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={editingCollege.name || ''}
                  onChange={(e) => setEditingCollege(c => ({ ...c, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-black">
                    City
                  </label>
                  <input
                    type="text"
                    value={editingCollege.city || ''}
                    onChange={(e) => setEditingCollege(c => ({ ...c, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-black">
                    State
                  </label>
                  <input
                    type="text"
                    value={editingCollege.state || ''}
                    onChange={(e) => setEditingCollege(c => ({ ...c, state: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-black">
                  Email Domain
                </label>
                <input
                  type="text"
                  value={editingCollege.domain || ''}
                  onChange={(e) => setEditingCollege(c => ({ ...c, domain: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-black/15 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={Boolean(editingCollege.is_active)}
                  onChange={(e) => setEditingCollege(c => ({ ...c, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-black rounded cursor-pointer"
                />
                <label htmlFor="edit-active" className="text-xs font-bold text-black select-none cursor-pointer">
                  Active in university network
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white text-xs font-bold shadow-sm shadow-[#7657D9]/12 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={2.5} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
