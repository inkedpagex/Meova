// Public student profile page — /users/[id]
import { fetchProfileAdmin, fetchJoinedCirclesAdmin, fetchReviewsAdmin, fetchUsersAdmin } from '../../../lib/firebaseAdminQueries';
import { adminDb } from '../../../lib/firebaseAdmin';
import { getUserAdmin } from '../../../lib/getUserAdmin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GraduationCap, Users, Star,
  Code, Music, Dumbbell, Camera, Rocket, Palette, Gamepad2,
  BookOpen, Coffee, MessageCircle, Zap, Calendar, MapPin,
  CheckCircle, Layers
} from 'lucide-react';
import BookCoffeeButton from '../../../features/users/BookCoffeeButton';
import AcceptBookingButton from '../../../features/users/AcceptBookingButton';
import BlockUserButton from '../../../features/users/BlockUserButton';
import MessageButton from '../../../features/users/MessageButton';
import TipUserButton from '../../../features/users/TipUserButton';
import ProfileHighlightsSection from '../../../components/ProfileHighlightsSection';
import InstagramEmbed from '../../../components/InstagramEmbed';

import { getUserAvatarUrl, getCartoonAvatar } from '../../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

const INTEREST_META = {
  'Coding & Tech':        { Icon: Code,        color: '#3b82f6', label: 'Dev' },
  'Music & Bands':        { Icon: Music,        color: '#b5609d', label: 'Music' },
  'Sports & Fitness':     { Icon: Dumbbell,     color: '#22c55e', label: 'Sports' },
  'Photography & Film':   { Icon: Camera,       color: '#06b6d4', label: 'Photo' },
  'Entrepreneurship':     { Icon: Rocket,       color: '#f97316', label: 'Startup' },
  'Art & Sketching':      { Icon: Palette,      color: '#ec4899', label: 'Art' },
  'Gaming & E-sports':    { Icon: Gamepad2,     color: '#a78bfa', label: 'Gaming' },
  'Literature & Poetry':  { Icon: BookOpen,     color: '#3b82f6', label: 'Lit' },
  'Dance':                { Icon: Star,         color: '#ec4899', label: 'Dance' },
};

// Helper: format relative date from ISO string
function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const profile = await fetchProfileAdmin(id);
  return {
    title: profile ? `${profile.full_name} — meetuply` : 'Student Profile — meetuply',
  };
}

export default async function UserProfilePage({ params }) {
  const { id } = await params;
  const [profile, currentUser, joinedCircles, reviews, allUsers] = await Promise.all([
    fetchProfileAdmin(id),
    getUserAdmin(),
    fetchJoinedCirclesAdmin(id),
    fetchReviewsAdmin(id, 20),
    fetchUsersAdmin(50),
  ]);

  let pendingBooking = null;
  if (currentUser && currentUser.id !== id) {
    const snap = await adminDb.collection('bookings')
      .where('hostId', '==', currentUser.id)
      .where('guestId', '==', id)
      .where('status', '==', 'Requested')
      .limit(1)
      .get();
    if (!snap.empty) {
      pendingBooking = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-neutral-500 mb-4">Profile not found.</p>
        <Link href="/" className="btn btn-ghost text-sm">Go Home</Link>
      </div>
    );
  }

  const isSelf = currentUser?.id === id;
  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  if (profile.isBlocked && !isAdmin && !isSelf) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <CheckCircle className="w-8 h-8" /> 
        </div>
        <div>
          <h2 className="text-lg font-black text-zinc-900">User Unavailable</h2>
          <p className="text-sm text-zinc-500 font-medium">This profile is no longer available on the platform.</p>
        </div>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs mt-2">Go Home</Link>
      </div>
    );
  }
  const interests = profile.interests || [];
  const primaryInterest = interests[0];
  const primaryMeta = INTEREST_META[primaryInterest] || { Icon: Star, color: '#6b7280', label: primaryInterest };
  const { Icon: PrimaryIcon } = primaryMeta;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-[680px] mx-auto anim-fade-in relative">

      {/* Ambient glow from primary interest color */}
      <div
        className="absolute top-[-80px] left-1/4 w-80 h-80 rounded-full blur-[140px] pointer-events-none -z-10 opacity-30"
        style={{ background: primaryMeta.color }}
      />



      {/* ── INSTAGRAM HEADER BAR ─────────────────────── */}
      <div className="flex items-center justify-between py-3 mb-4 border-b border-zinc-100">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1.5 font-black text-base text-zinc-900 tracking-tight">
          <span>@{profile.username || profile.full_name?.toLowerCase().replace(/\s+/g, '') || 'student'}</span>
          <CheckCircle className="w-4 h-4 fill-blue-500 text-white" />
        </div>
        {!isSelf ? (
          <BlockUserButton targetUid={id} targetName={profile.full_name || 'Student'} isLoggedIn={isLoggedIn} iconOnly={true} />
        ) : (
          <div className="w-7" />
        )}
      </div>

      {/* ── INSTAGRAM PROFILE HERO ─────────────────────── */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 mb-6 border border-zinc-100 shadow-sm">
        
        {/* Avatar + Stats Row */}
        <div className="flex items-center justify-between gap-6 mb-4">
          {/* Left: Instagram Avatar with Gradient Ring */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px]" style={{ background: '#F05A00' }}>
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-zinc-100">
                <img
                  src={avatarUrl(profile)}
                  alt={profile.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Live Indicator */}
            {profile.isIdOn !== false && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            )}
          </div>

          {/* Right: Stats Counters */}
          <div className="flex-1 flex items-center justify-around text-center">
            <div>
              <span className="block text-base sm:text-lg font-black text-zinc-900 leading-tight">
                {reviews.length}
              </span>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Meets</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-black text-zinc-900 leading-tight flex items-center justify-center gap-0.5">
                {avgRating || 'New'} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
              </span>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Rating</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-black text-[#F05A00] leading-tight flex items-center justify-center gap-0.5">
                {profile.rate || 100} <Zap className="w-3.5 h-3.5 fill-current text-[#F05A00] inline" />
              </span>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Rate</span>
            </div>
          </div>
        </div>

        {/* Bio & Details Section */}
        <div className="space-y-1 mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-black text-zinc-900">
              {profile.full_name || 'Student'}
            </h1>
            {profile.isBlocked && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-600 border border-red-200">
                BLOCKED
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-[#F05A00] border border-orange-100 shadow-2xs">
              <CheckCircle className="w-3 h-3 text-[#F05A00] fill-orange-50" />
              <span>{reviews.length || 1} Meets Completed</span>
            </span>
          </div>

          <p className="text-xs font-bold text-[#F05A00] flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            {profile.year || '1st'} Year · {profile.branch || 'General'}
          </p>

          <p className="text-xs text-zinc-700 font-medium leading-relaxed pt-1 whitespace-pre-line">
            {profile.bio || '🎓 GLA Student · Connecting on Meetuply! 🚀'}
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {profile.isLiveOnCampus && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live On Campus
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">
            <CheckCircle className="w-3 h-3 text-blue-500" /> Verified Student
          </span>
        </div>

        {/* Action Buttons (Instagram 2-Column Style) */}
        {!isSelf && (
          <div className="flex flex-col gap-2.5 pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-2.5">
              {pendingBooking ? (
                <div className="flex-1">
                  <AcceptBookingButton booking={pendingBooking} className="w-full text-xs" />
                </div>
              ) : profile.isIdOn !== false ? (
                <div className="flex-1">
                  <BookCoffeeButton
                    targetUserId={id}
                    targetName={profile.full_name}
                    targetPhoto={avatarUrl(profile)}
                    isLoggedIn={isLoggedIn}
                    accentColor={primaryMeta.color}
                  />
                </div>
              ) : (
                <div className="flex-1 py-2.5 rounded-xl text-xs font-bold text-center text-rose-500 bg-rose-50 border border-rose-100">
                  Offline
                </div>
              )}

              <MessageButton targetUid={id} />
            </div>
            
            <div className="flex items-center gap-2.5">
              <TipUserButton targetUid={id} targetName={profile.full_name || 'Student'} />
            </div>
          </div>
        )}

        {isSelf && (
          <Link href="/profile" className="block w-full text-center py-2.5 rounded-xl text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors">
            Edit Profile
          </Link>
        )}
      </div>

      {/* ── INSTAGRAM HIGHLIGHTS (INTERESTS CIRCLES + SUGGESTED STUDENTS) ── */}
      <ProfileHighlightsSection 
        interests={interests} 
        allUsers={allUsers} 
        currentUserId={id} 
      />

      {/* ── COFFEE SESSION INFO ───────────────── */}
      {profile.isIdOn !== false && (
        <div
          className="rounded-2xl p-5 mb-6 flex items-start gap-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-md"
        >
          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${primaryMeta.color}12`, border: `1px solid ${primaryMeta.color}20` }}>
            <Layers className="w-5 h-5" style={{ color: primaryMeta.color }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)] mb-1 flex items-center gap-2">
              Reserve Workspace Cabin
              <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-500">
                <Zap className="w-2.5 h-2.5 fill-current" /> 50 Sparks
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Spend 50 Sparks to reserve an active workspace cabin slot hosted by {profile.full_name?.split(' ')[0] || 'this student'}. 
              Great for co-working, quiet study, or getting peer mentorship and code/design reviews.
            </p>
            <div className="flex items-center gap-4 mt-3">
              {[
                { Icon: Calendar, text: 'Flexible slots' },
                { Icon: MapPin, text: 'Study Cabin' },
                { Icon: CheckCircle, text: 'Auto approval' },
              ].map(({ Icon, text }) => (
                <span key={text} className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <Icon className="w-3 h-3 text-[var(--accent)]" /> {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INSTAGRAM EMBED ────────────────── */}
      <InstagramEmbed instagramInput={profile.instagram} />

      {/* ── COMMUNITIES ───────────────────────── */}
      {joinedCircles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[11px] font-black text-[var(--text-muted)] tracking-[0.14em] uppercase mb-4 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[var(--accent)]" /> Active Circles
          </h2>
          <div className="flex flex-wrap gap-2">
            {joinedCircles.map(c => (
              <Link
                key={c.id}
                href={`/circles/${c.id}`}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all hover:bg-[var(--bg-hover)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] shadow-sm"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── REVIEWS ───────────────────────────── */}
      <section className="pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[11px] font-black text-[var(--text-muted)] tracking-[0.14em] uppercase flex items-center gap-2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            Reviews ({reviews.length})
          </h2>
          {avgRating && (
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(Number(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-mid)]'}`} />
              ))}
              <span className="text-xs font-black text-[var(--text-primary)] ml-1">{avgRating}</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-10 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <Star className="w-8 h-8 text-[var(--border-mid)] mx-auto mb-3" />
            <p className="text-xs font-bold text-[var(--text-muted)]">No reviews yet</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Reviews appear after completed bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div
                key={review.id}
                className="rounded-2xl p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <img
                      src={avatarUrl(review.authorId || 'user')}
                      alt={review.authorName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-[var(--text-primary)]">{review.authorName || 'Student'}</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i <= (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-mid)]'}`} />
                        ))}
                      </div>
                    </div>
                    {review.written && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">{review.written}</p>
                    )}
                    <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-2">{timeAgo(review.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
