"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useUserContext } from "../../components/providers/UserProvider";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, MapPin, QrCode, ScanLine, X, Loader2,
  CheckCircle2, ArrowRight, User, AlertTriangle, ChevronRight, MessageCircle, Phone, Zap, Star
} from "lucide-react";
import QRCode from "react-qr-code";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "../../lib/toast";
import Link from "next/link";
import { getCartoonAvatar } from "../../utils/avatar";
import { useVoiceCall } from "../../components/providers/VoiceCallProvider";
import RatingReviewModal from "../../components/RatingReviewModal";

const fetcher = (url) => fetch(url).then((res) => res.json());

function normalizeBooking(b) {
  if (!b) return null;
  return {
    ...b,
    id: b.id,
    title: b.title || 'Campus Meetup',
    guestId: b.guest_id || b.guestId || '',
    hostId: b.host_id || b.hostId || '',
    guestName: b.guest_name || b.guestName || 'Campus Student',
    hostName: b.host_name || b.hostName || 'Campus Host',
    guestPhoto: b.guest_photo || b.guestPhoto || '',
    hostPhoto: b.host_photo || b.hostPhoto || '',
    meetingCode: b.meeting_code || b.meetingCode || '',
    price: b.price !== undefined ? b.price : (b.sparks_spent !== undefined ? b.sparks_spent : 100),
    location: b.location || 'Campus',
    date: b.date || '',
    time: b.time || '',
    agenda: b.agenda || '',
    status: b.status || 'Requested',
    startedAt: b.started_at || b.startedAt || null,
    durationMinutes: b.duration_minutes || 20,
    createdAt: b.created_at || b.createdAt,
    scheduledAt: b.scheduled_at || b.scheduledAt,
  };
}

function Live20MinMeetingTimer({ booking, onComplete }) {
  const durationMs = (booking.durationMinutes || 20) * 60 * 1000;
  const startedTime = booking.startedAt ? new Date(booking.startedAt).getTime() : Date.now();
  const endTime = startedTime + durationMs;

  const [remainingMs, setRemainingMs] = useState(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const rem = Math.max(0, endTime - Date.now());
      setRemainingMs(rem);
      if (rem <= 0) {
        clearInterval(timer);
        if (onComplete) onComplete(booking);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, booking, onComplete]);

  const totalSecs = Math.floor(remainingMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const percent = Math.min(100, Math.max(0, (remainingMs / durationMs) * 100));

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-300/40 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
            Meetup In Progress
          </span>
        </div>
        <span className="text-sm font-black text-emerald-950 font-mono">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-emerald-100 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[10px] text-emerald-700 font-bold text-center">
        Timer is live on both phones · Auto-completes when 20:00 finishes
      </p>
    </div>
  );
}

function MeetingCountdownTimer({ booking }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      let targetDate = null;

      if (booking.scheduledAt) {
        const parsed = new Date(booking.scheduledAt);
        if (!isNaN(parsed.getTime())) targetDate = parsed;
      }

      if (!targetDate && booking.date) {
        let dateStr = booking.date;
        if (booking.date === 'Today') {
          dateStr = new Date().toISOString().split('T')[0];
        } else if (booking.date === 'Tomorrow') {
          dateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        } else if (booking.date === 'Day After') {
          dateStr = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
        }

        let hour = 18;
        let minute = 0;
        const timeStr = booking.time || '';
        if (timeStr.includes('8 AM') || timeStr.includes('8-11')) hour = 8;
        else if (timeStr.includes('11 AM') || timeStr.includes('11-2') || timeStr.includes('Noon')) hour = 11;
        else if (timeStr.includes('2 PM') || timeStr.includes('2-5') || timeStr.includes('Afternoon')) hour = 14;
        else if (timeStr.includes('5 PM') || timeStr.includes('5-6') || timeStr.includes('Evening')) hour = 17;
        else if (timeStr.includes(':')) {
          const parts = timeStr.split(':');
          hour = parseInt(parts[0], 10) || 18;
          minute = parseInt(parts[1], 10) || 0;
        }

        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setHours(hour, minute, 0, 0);
          targetDate = dateObj;
        }
      }

      if (!targetDate || isNaN(targetDate.getTime())) {
        const created = booking.createdAt ? new Date(booking.createdAt) : new Date();
        targetDate = new Date(created.getTime() + 2 * 60 * 60 * 1000);
      }

      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0 && diff > -3600000) {
        setIsLive(true);
        setTimeLeft('Happening Now');
      } else if (diff <= -3600000) {
        setTimeLeft('');
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Starts in ${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`);
      }
    };

    calculateTime();
    // Only tick every 10 seconds to keep UI silky smooth and eliminate frame drops
    const interval = setInterval(calculateTime, 10000);
    return () => clearInterval(interval);
  }, [booking]);

  if (!timeLeft) return null;

  return (
    <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-extrabold border ${
      isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' : 'bg-orange-50/80 text-[#F05A00] border-orange-200'
    }`}>
      <span>{timeLeft}</span>
    </div>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useUserContext();
  const { startCall } = useVoiceCall();
  const [activeTab, setActiveTab] = useState("Active"); // "Active" | "History"

  // Modals state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  // Rating & Review state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingModalData, setRatingModalData] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());

  useEffect(() => {
    // Check local storage for reviewed bookings
    try {
      const reviewed = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('reviewed_booking_')) {
          reviewed.add(k.replace('reviewed_booking_', ''));
        }
      }
      setReviewedBookings(reviewed);
    } catch {}
  }, []);

  const openRatingModal = (data) => {
    setRatingModalData(data);
    setShowRatingModal(true);
  };

  // Verification state
  const [scanStatus, setScanStatus] = useState("idle"); // idle, processing, success, error
  const [scanMessage, setScanMessage] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(true);

  // Dispute state
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(null); // bookingId being cancelled
  const [actionLoading, setActionLoading] = useState(null); // `${bookingId}-${action}`

  const handleHostAction = async (bookingId, action) => {
    setActionLoading(`${bookingId}-${action}`);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action })
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Meeting ${action}ed successfully!`);
        mutate();
      } else {
        toast.error(d.error || `Failed to ${action}`);
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const { data, error, mutate, isLoading } = useSWR(user ? "/api/bookings" : null, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 4000,
    keepPreviousData: true,
  });
  const { data: walletData } = useSWR(user ? "/api/wallet" : null, fetcher, {
    dedupingInterval: 4000,
    keepPreviousData: true,
  });
  const sparksBalance = walletData?.wallet
    ? (walletData.wallet.purchased || 0) + (walletData.wallet.bonus || 0) + (walletData.wallet.creator || 0)
    : null;
  const bookings = (data?.bookings || []).map(normalizeBooking);

  const activeBookings = bookings.filter(b => b.status === "Requested" || b.status === "Accepted" || b.status === "Confirmed");
  const pastBookings = bookings.filter(b => ["Completed", "Rejected", "Cancelled", "Meeting Completed", "Booking Closed", "AutoRefunded", "Disputed", "Canceled"].includes(b.status));

  const displayList = activeTab === "Active" ? activeBookings : pastBookings;

  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const now = Date.now();
  const isMeetingTimePassed = (booking) => {
    if (booking.scheduledAt) {
      return now > new Date(booking.scheduledAt).getTime();
    }
    const created = booking.createdAt ? new Date(booking.createdAt) : null;
    if (!created || isNaN(created.getTime())) return false;
    return now > created.getTime() + 2 * 60 * 60 * 1000; // 2 hours after creation
  };

  // Handle Manual Code Verification -> Starts 20-Minute Live Timer
  const handleVerifyCode = async (codeToVerify) => {
    const code = typeof codeToVerify === 'string' ? codeToVerify : manualCode;
    if (scanStatus === "processing" || scanStatus === "success" || !selectedBooking) return;
    
    const expectedCode = selectedBooking.meetingCode || selectedBooking.meeting_code;
    if (code.trim() === expectedCode) {
      setScanStatus("processing");
      try {
        const res = await fetch("/api/bookings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: selectedBooking.id, action: "start_meeting", code: code.trim() })
        });
        
        const data = await res.json();
        if (data.ok || data.success) {
          setScanStatus("success");
          setScanMessage("Code verified! 20-minute meetup timer started on both phones.");
          setTimeout(() => {
            setShowScanModal(false);
            setScanStatus("idle");
            setManualCode("");
            setSelectedBooking(null);
            mutate();
          }, 1400);
        } else {
          setScanStatus("error");
          setScanMessage(data.error || "Verification failed");
          setTimeout(() => setScanStatus("idle"), 2500);
        }
      } catch (e) {
        setScanStatus("error");
        setScanMessage("Network error during verification.");
        setTimeout(() => setScanStatus("idle"), 2500);
      }
    } else {
      setScanStatus("error");
      setScanMessage("Invalid Code for this meeting.");
      setTimeout(() => setScanStatus("idle"), 2500);
    }
  };

  // Complete / Finish Meeting (Releases Escrow & Opens Rating Modal)
  const handleFinishMeeting = async (booking) => {
    if (!booking) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, action: "complete" })
      });
      const data = await res.json();
      if (data.ok || data.success) {
        toast.success("Meeting completed! Sparks credited to host.");
        mutate();
        
        const otherId = booking.guestId === user.uid ? booking.hostId : booking.guestId;
        const otherName = booking.guestId === user.uid ? booking.hostName : booking.guestName;
        const otherPhoto = booking.guestId === user.uid ? booking.hostPhoto : booking.guestPhoto;
        
        openRatingModal({
          targetUserId: otherId,
          targetName: otherName,
          targetPhoto: otherPhoto,
          contextType: 'meeting',
          contextTitle: booking.title || '1-on-1 Campus Meetup',
          bookingId: booking.id,
        });
      }
    } catch {
      toast.error("Failed to complete meeting.");
    }
  };

  // Handle Cancel Request (guest cancels before host accepts)
  const initiateCancel = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!bookingToCancel || cancelLoading) return;
    setCancelLoading(bookingToCancel.id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingToCancel.id, action: "cancel" })
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Booking cancelled. Sparks refunded.');
        mutate();
        setShowCancelModal(false);
        setBookingToCancel(null);
      } else {
        toast.error(d.error || 'Failed to cancel. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCancelLoading(null);
    }
  };

  const handleDispute = async () => {
    if (!selectedBooking || disputeLoading) return;
    setDisputeLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBooking.id, action: "dispute" })
      });
      const data = await res.json();
      if (data.success) {
        setDisputeSuccess(true);
        setTimeout(() => {
          setShowDisputeModal(false);
          setDisputeSuccess(false);
          setSelectedBooking(null);
          mutate();
        }, 2200);
      } else {
        alert(data.error || "Failed to report issue. Please try again.");
      }
    } catch (e) {
      alert("Network error. Please try again.");
    } finally {
      setDisputeLoading(false);
    }
  };

  const statusColor = (status) => {
    if (status === "Completed" || status === "Meeting Completed") return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (status === "In Progress" || status === "in_progress") return "text-emerald-700 bg-emerald-50 border-emerald-200 animate-pulse";
    if (status === "Rejected" || status === "Cancelled" || status === "Canceled") return "text-rose-600 bg-rose-50 border-rose-100";
    if (status === "AutoRefunded") return "text-amber-600 bg-amber-50 border-amber-100";
    if (status === "Disputed") return "text-orange-600 bg-orange-50 border-orange-100";
    if (status === "Booking Closed") return "text-zinc-500 bg-zinc-50 border-zinc-200";
    return "text-[#F05A00] bg-orange-50 border-orange-100";
  };

  const statusLabel = (status) => {
    if (status === "AutoRefunded") return "Auto Refunded";
    if (status === "Meeting Completed") return "Completed";
    if (status === "In Progress" || status === "in_progress") return "In Progress (Live)";
    if (status === "Booking Closed") return "Closed";
    return status;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-[58px] md:pt-0 pb-20 anim-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-4 py-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Calendar size={20} className="text-[#F05A00]" />
            My Meetings
          </h1>
        </div>
        {/* Sparks balance — helps user know how many Sparks they have before booking */}
        {sparksBalance !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-orange-50 text-[#F05A00] border border-orange-100">
            <Zap size={13} className="fill-[#F05A00] text-[#F05A00]" />
            <span>{sparksBalance.toLocaleString()}</span>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex bg-zinc-100/80 p-1 rounded-xl">
          {["Active", "History"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab}
              {tab === "Active" && activeBookings.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-[#F05A00] text-white text-[9px] font-black rounded-full">
                  {activeBookings.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-6 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="animate-spin mb-2" size={24} />
            <p className="text-xs font-bold">Loading meetings...</p>
          </div>
        )}

        {!isLoading && displayList.length === 0 && (
          <div className="flex flex-col items-center text-center justify-center py-16 px-6 bg-white rounded-2xl border border-dashed border-zinc-200">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[#F05A00] mb-3 border border-orange-100">
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-black text-zinc-900 mb-1">No {activeTab.toLowerCase()} meetings</h3>
            <p className="text-xs text-zinc-500 font-medium">
              {activeTab === "Active" 
                ? "You don't have any upcoming campus meetups right now." 
                : "No past meetups found."}
            </p>
            {activeTab === "Active" && (
              <button 
                onClick={() => router.push("/discover")}
                className="mt-5 bg-zinc-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Find Students to Meet
              </button>
            )}
          </div>
        )}

        {displayList.map(booking => {
          const isGuest = booking.guestId === user.uid;
          const otherPerson = isGuest ? booking.hostName : booking.guestName;
          const otherPersonId = isGuest ? booking.hostId : booking.guestId;
          const otherPersonPhoto = isGuest ? booking.hostPhoto : booking.guestPhoto;
          const roleLabel = isGuest ? "You are joining" : "You are hosting";
          const canReport = isGuest && isMeetingTimePassed(booking) && 
            ["Requested", "Confirmed", "Accepted"].includes(booking.status);

          const finalAvatar = otherPersonPhoto || getCartoonAvatar(otherPersonId || otherPerson);

          return (
            <div 
              key={booking.id} 
              onClick={() => router.push(`/users/${otherPersonId}`)}
              className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_30px_rgba(140,53,115,0.08)] cursor-pointer"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusColor(booking.status)} mb-2`}>
                    {statusLabel(booking.status)}
                  </span>
                  <h3 className="text-[15px] font-black text-zinc-900 leading-tight">
                    {booking.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <img src={finalAvatar} alt={otherPerson} className="w-4 h-4 rounded-full border border-zinc-200 object-cover" />
                    <p className="text-[11px] text-zinc-500 font-bold flex items-center">
                      {roleLabel} 
                      <Link 
                        href={`/users/${otherPersonId}`} 
                        className="text-zinc-800 hover:text-[#F05A00] hover:underline transition-colors ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {otherPerson}
                      </Link>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#F05A00] flex items-center gap-1 justify-end">
                    <Zap size={13} className="fill-[#F05A00] text-[#F05A00]" /> {booking.price}
                  </span>
                </div>
              </div>
              
              {/* Card Details */}
              <div className="flex flex-wrap gap-y-2 gap-x-4 mt-4 bg-zinc-50 rounded-xl p-3 border border-zinc-100/50">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
                  <Calendar size={13} className="text-zinc-400" />
                  {booking.date || "Any Day"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
                  <Clock size={13} className="text-zinc-400" />
                  {booking.time || "Flexible"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 w-full truncate">
                  <MapPin size={13} className="text-zinc-400 flex-shrink-0" />
                  <span className="truncate">{booking.location || "Campus"}</span>
                </div>
              </div>

              {/* Agenda (If exists) */}
              {booking.agenda && (
                <div className="mt-3 p-3 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Meeting Purpose</p>
                  <p className="text-xs text-zinc-700 font-medium leading-relaxed italic">"{booking.agenda}"</p>
                </div>
              )}

              {/* Countdown Timer for Upcoming Bookings */}
              {activeTab === "Active" && booking.status !== "In Progress" && (
                <MeetingCountdownTimer booking={booking} />
              )}

              {/* Live 20-Minute Synchronized Meeting Timer for In-Progress Meets */}
              {activeTab === "Active" && (booking.status === "In Progress" || booking.status === "in_progress") && (
                <Live20MinMeetingTimer booking={booking} onComplete={handleFinishMeeting} />
              )}

              {/* Auto-refund info banner */}
              {booking.status === "AutoRefunded" && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-amber-700">
                    Meeting time passed without QR scan — {booking.price} Sparks auto-refunded.
                  </p>
                </div>
              )}

              {/* Disputed info banner */}
              {booking.status === "Disputed" && (
                <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                  <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-orange-700">
                    Issue reported — Sparks held in escrow pending review.
                  </p>
                </div>
              )}

              {/* Action Buttons (Only for Active tab) */}
              {activeTab === "Active" && (
                <div className="mt-4 flex gap-2">
                  {isGuest ? (
                    <>
                      {/* Cancel button: only for Requested (before host accepts), with instant refund */}
                      {booking.status === "Requested" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); initiateCancel(booking); }}
                          disabled={cancelLoading === booking.id}
                          className="w-12 h-[46px] bg-zinc-50 text-zinc-500 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 active:scale-[0.98] transition-all disabled:opacity-50"
                          title="Cancel Request (full refund)"
                        >
                          {cancelLoading === booking.id
                            ? <Loader2 size={16} className="animate-spin" />
                            : <X size={16} strokeWidth={2.5} />}
                        </button>
                      )}
                      
                      {/* Direct 1-on-1 Chat with Host */}
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/messages?uid=${otherPersonId}`); }}
                        className="w-11 h-[46px] bg-orange-50 text-[#F05A00] border border-orange-200 hover:bg-orange-100 rounded-xl flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer"
                        title="Chat with Host"
                      >
                        <MessageCircle size={16} />
                      </button>

                      {/* Direct 1-on-1 In-App Privacy Voice Call */}
                      {["Accepted", "Confirmed"].includes(booking.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall({
                              targetUserId: otherPersonId,
                              targetName: otherPerson,
                              targetPhoto: otherPersonPhoto,
                              bookingId: booking.id,
                              location: booking.location,
                            });
                          }}
                          className="w-11 h-[46px] bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-xl flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                          title="Call Host (100% Private)"
                        >
                          <Phone size={16} />
                        </button>
                      )}

                      {booking.status === "In Progress" || booking.status === "in_progress" ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleFinishMeeting(booking); }}
                          className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          <CheckCircle2 size={16} /> Finish Meetup
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setShowQrModal(true); }}
                          className="flex-1 bg-zinc-900 text-white rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <QrCode size={16} /> View Ticket
                        </button>
                      )}

                      {canReport && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setShowDisputeModal(true); }}
                          className="w-11 h-[46px] bg-rose-50 text-rose-500 border border-rose-100 rounded-xl flex items-center justify-center hover:bg-rose-100 active:scale-[0.98] transition-all cursor-pointer"
                          title="Report Issue"
                        >
                          <AlertTriangle size={16} strokeWidth={2.5} />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {booking.status === "Requested" ? (
                        <div className="flex gap-2 w-full flex-wrap">
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/messages?uid=${otherPersonId}`); }}
                            className="w-full bg-zinc-100 text-zinc-600 rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.98] transition-all"
                          >
                            <MessageCircle size={16} /> Chat / Propose New Time
                          </button>
                          <div className="flex gap-2 w-full">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleHostAction(booking.id, 'reject'); }}
                              disabled={actionLoading === `${booking.id}-reject`}
                              className="flex-1 bg-rose-50 text-rose-600 rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                              {actionLoading === `${booking.id}-reject` ? <Loader2 size={16} className="animate-spin" /> : 'Decline'}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleHostAction(booking.id, 'accept'); }}
                              disabled={actionLoading === `${booking.id}-accept`}
                              className="flex-1 bg-emerald-500 text-white rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
                            >
                              {actionLoading === `${booking.id}-accept` ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Accept</>}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/messages?uid=${otherPersonId}`); }}
                            className="w-11 h-[46px] bg-orange-50 text-[#F05A00] border border-orange-200 hover:bg-orange-100 rounded-xl flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer"
                            title="Chat with Guest"
                          >
                            <MessageCircle size={16} />
                          </button>

                          {/* Direct 1-on-1 In-App Privacy Voice Call */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startCall({
                                targetUserId: otherPersonId,
                                targetName: otherPerson,
                                targetPhoto: otherPersonPhoto,
                                bookingId: booking.id,
                                location: booking.location,
                              });
                            }}
                            className="w-11 h-[46px] bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-xl flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                            title="Call Guest (100% Private)"
                          >
                            <Phone size={16} />
                          </button>

                          {booking.status === "In Progress" || booking.status === "in_progress" ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleFinishMeeting(booking); }}
                              className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                            >
                              <CheckCircle2 size={16} /> Complete & Get Sparks
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation();
                                setSelectedBooking(booking); 
                                setShowScanModal(true); 
                                setScanStatus("idle");
                                setIsScanning(true);
                                setManualCode("");
                              }}
                              className="flex-1 bg-[#F05A00] text-white rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 hover:bg-[#D94F00] active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(240,90,0,0.3)] cursor-pointer"
                            >
                              <ScanLine size={16} /> Scan Guest QR / Code
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Rating & Review Section for Completed Meetings — BOTH Guest and Host */}
              {["Completed", "Meeting Completed"].includes(booking.status) && (
                <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Meeting Completed</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRatingModal({
                        targetUserId: otherPersonId,
                        targetName: otherPerson,
                        targetPhoto: otherPersonPhoto,
                        contextType: 'meeting',
                        contextTitle: booking.title || '1-on-1 Campus Meetup',
                        bookingId: booking.id,
                      });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs ${
                      reviewedBookings.has(booking.id)
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        : 'bg-[#F05A00] hover:bg-[#D94F00] text-white shadow-xs'
                    }`}
                  >
                    <Star
                      size={13}
                      className={reviewedBookings.has(booking.id) ? 'fill-amber-400 text-amber-500' : 'fill-white text-white'}
                    />
                    <span>{reviewedBookings.has(booking.id) ? 'Rated ★' : `Rate ${isGuest ? 'Host' : 'Guest'}`}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── MODAL: GUEST QR TICKET ─── */}
      {showQrModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[340px] overflow-hidden shadow-2xl anim-scale-in flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-zinc-50">
              <h3 className="text-sm font-black text-zinc-900">Meeting Ticket</h3>
              <button onClick={() => setShowQrModal(false)} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-zinc-500 hover:text-black">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center text-center">
              <p className="text-xs font-bold text-zinc-500 mb-6 max-w-[200px]">
                Show this QR code to <strong className="text-zinc-900">{selectedBooking.hostName || selectedBooking.host_name || 'Host'}</strong> when you meet.
              </p>
              
              <div className="bg-white p-4 rounded-2xl shadow-[0_0_40px_rgba(240,90,0,0.12)] border-2 border-orange-100">
                <QRCode value={selectedBooking.meetingCode || selectedBooking.meeting_code || '123456'} size={180} fgColor="#000" />
              </div>
              
              <div className="mt-8 bg-zinc-50 px-4 py-2 rounded-xl border border-dashed border-zinc-300 w-full">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Manual 6-Digit Code</p>
                <p className="text-xl font-black tracking-[0.3em] text-zinc-900">{selectedBooking.meetingCode || selectedBooking.meeting_code || '------'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CANCEL REQUEST ─── */}
      {showCancelModal && bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[340px] p-6 shadow-2xl anim-scale-in text-center border border-zinc-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-black text-zinc-900 mb-2">Cancel Booking?</h3>
            <p className="text-xs text-zinc-500 font-medium mb-6 leading-relaxed">
              Are you sure you want to cancel this booking request? Your <strong className="text-zinc-800">{bookingToCancel.price} Sparks</strong> will be refunded immediately.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                }}
                disabled={cancelLoading === bookingToCancel.id}
                className="flex-1 py-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading === bookingToCancel.id}
                className="flex-1 bg-rose-500 text-white py-3 rounded-xl text-xs font-black hover:bg-rose-600 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {cancelLoading === bookingToCancel.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>Yes, Cancel</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: HOST VERIFICATION ─── */}
      {showScanModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md anim-fade-in">
          <div className="absolute top-4 right-4 z-50">
             <button onClick={() => { setShowScanModal(false); setManualCode(""); setIsScanning(true); setScanStatus("idle"); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
               <X size={20} strokeWidth={2.5} />
             </button>
          </div>
          
          <div className="w-full max-w-[340px] flex flex-col items-center">
            <h3 className="text-white text-lg font-black mb-2">Verify Meeting</h3>
            <p className="text-white/60 text-xs font-medium mb-6 text-center">
              Enter the 6-digit code from {selectedBooking.guestName}&apos;s phone to receive your Sparks.
            </p>

            <div className="w-full bg-zinc-900/50 p-6 rounded-2xl border border-white/10 relative">
              {scanStatus === "success" ? (
                <div className="absolute inset-0 bg-emerald-500 rounded-2xl flex flex-col items-center justify-center text-white anim-fade-in z-10">
                  <CheckCircle2 size={48} className="mb-2" />
                  <p className="font-black text-base">Verified!</p>
                </div>
              ) : scanStatus === "processing" ? (
                <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center text-white anim-fade-in z-10 backdrop-blur-sm">
                  <Loader2 size={32} className="animate-spin mb-3 text-[#F05A00]" />
                  <p className="font-bold text-xs">Verifying...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Toggle between Scan & Manual */}
                  <div className="flex bg-black/40 p-1 rounded-xl mb-2">
                    <button
                      onClick={() => setIsScanning(true)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        isScanning ? 'bg-[#F05A00] text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Scan QR
                    </button>
                    <button
                      onClick={() => setIsScanning(false)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        !isScanning ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Type Code
                    </button>
                  </div>

                  {isScanning ? (
                    <div className="bg-black rounded-2xl overflow-hidden border border-white/10 relative" style={{ aspectRatio: '1/1' }}>
                      <Scanner
                        onScan={(result) => {
                          if (result && result[0]?.rawValue) {
                            const code = result[0].rawValue;
                            setManualCode(code);
                            if (code.length === 6) {
                              handleVerifyCode(code);
                            }
                          }
                        }}
                        formats={['qr_code']}
                        components={{
                          audio: false,
                          onOff: false,
                          torch: false,
                          zoom: false,
                          tracker: true,
                        }}
                        styles={{
                          container: { width: '100%', height: '100%' },
                        }}
                      />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-white/50 rounded-2xl border-dashed" />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      maxLength={6}
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit code"
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-4 text-center text-2xl font-black text-white tracking-[0.3em] uppercase outline-none focus:border-[#F05A00] transition-colors"
                    />
                  )}

                  {!isScanning && (
                    <button
                      onClick={() => handleVerifyCode(manualCode)}
                      disabled={manualCode.length !== 6}
                      className="w-full bg-[#F05A00] disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-[#D94F00] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Verify & Claim Sparks
                    </button>
                  )}
                </div>
              )}
            </div>

            {scanStatus === "error" && (
              <div className="mt-6 bg-rose-500/20 text-rose-200 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/50 anim-fade-up">
                {scanMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: REPORT ISSUE ─── */}
      {showDisputeModal && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 md:pb-4 bg-black/50 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[380px] overflow-hidden shadow-2xl anim-scale-in">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-rose-500" />
                </div>
                <h3 className="text-sm font-black text-zinc-900">Report Issue</h3>
              </div>
              <button 
                onClick={() => { setShowDisputeModal(false); setDisputeSuccess(false); }}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {disputeSuccess ? (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-base font-black text-zinc-900 mb-2">Issue Reported!</h4>
                <p className="text-xs text-zinc-500 font-medium">
                  Your Sparks are held safely. Auto-refund will process within 1 hour if the meeting didn&apos;t happen.
                </p>
              </div>
            ) : (
              <div className="p-5">
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-5">
                  <p className="text-xs font-bold text-rose-700 leading-relaxed">
                    Did <strong>{selectedBooking.hostName}</strong> not show up for &quot;{selectedBooking.title}&quot;?
                  </p>
                  <p className="text-[11px] text-rose-500 mt-1.5">
                    If the QR code was never scanned, your {selectedBooking.price} Sparks will be auto-refunded within 1 hour.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-5 flex items-start gap-2">
                  <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                    Only report if the meeting genuinely didn&apos;t happen. False reports may affect your account standing.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDisputeModal(false)}
                    className="flex-1 py-3 rounded-xl border border-zinc-200 text-xs font-black text-zinc-600 hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDispute}
                    disabled={disputeLoading}
                    className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {disputeLoading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                    {disputeLoading ? "Reporting..." : "Report Issue"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: RATING & REVIEWS ─── */}
      {showRatingModal && ratingModalData && (
        <RatingReviewModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingModalData(null);
          }}
          targetUserId={ratingModalData.targetUserId}
          targetName={ratingModalData.targetName}
          targetPhoto={ratingModalData.targetPhoto}
          contextType={ratingModalData.contextType || 'meeting'}
          contextTitle={ratingModalData.contextTitle}
          bookingId={ratingModalData.bookingId}
          onSuccess={({ rating }) => {
            if (ratingModalData.bookingId) {
              setReviewedBookings((prev) => new Set([...prev, ratingModalData.bookingId]));
            }
          }}
        />
      )}

    </div>
  );
}
