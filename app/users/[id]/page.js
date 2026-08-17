// Public student profile page — /users/[id]
import { fetchProfileAdmin, fetchJoinedCirclesAdmin, fetchReviewsAdmin } from '../../../lib/firebaseAdminQueries';
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
import BlockUserButton from '../../../features/users/BlockUserButton';

import { getUserAvatarUrl, getCartoonAvatar } from '../../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

const INTEREST_META = {
  'Coding & Tech':        { Icon: Code,        color: '#3b82f6', label: 'Dev' },
  'Music & Bands':        { Icon: Music,        color: '#a855f7', label: 'Music' },
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
  const [profile, currentUser, joinedCircles, reviews] = await Promise.all([
    fetchProfileAdmin(id),
    getUserAdmin(),
    fetchJoinedCirclesAdmin(id),
    fetchReviewsAdmin(id, 20),
  ]);

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

      {/* Back nav */}
      <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all mb-8 uppercase tracking-wider">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      {/* ── PROFILE HERO ─────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl mb-6 p-6 md:p-8 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-lg"
      >
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: `linear-gradient(to right, ${primaryMeta.color}, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${primaryMeta.color}08 0%, transparent 60%)` }} />

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--bg-surface)]"
              style={{ border: `2px solid ${primaryMeta.color}40` }}
            >
              <img
                src={avatarUrl(profile.full_name || id)}
                alt={profile.full_name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--bg-elevated)] ${
              profile.isIdOn !== false ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />
          </div>
 
          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                {profile.full_name || 'Student'}
              </h1>
              {/* Rating badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0" style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-black text-yellow-400">{avgRating}</span>
              </div>
            </div>
 
            <p className="text-sm text-[var(--text-secondary)] mb-3 flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
              <GraduationCap className="w-4 h-4 text-[var(--text-muted)]" />
              {profile.year} Year · {profile.branch}
            </p>
 
            {/* Bio */}
            {profile.bio ? (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 font-semibold">{profile.bio}</p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic leading-relaxed mb-4 font-semibold">No bio added yet.</p>
            )}
 
            {/* Interest tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {interests.map(interest => {
                const meta = INTEREST_META[interest] || { Icon: Star, color: '#6b7280' };
                const { Icon } = meta;
                return (
                  <div
                    key={interest}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm"
                    style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}20` }}
                  >
                    <Icon className="w-3 h-3" />
                    {interest}
                  </div>
                );
              })}
            </div>
 
            {/* CTA buttons */}
            {!isSelf && (
              <div className="flex gap-2.5 flex-wrap">
                {profile.isIdOn !== false ? (
                  <BookCoffeeButton
                    targetUserId={id}
                    targetName={profile.full_name}
                    isLoggedIn={isLoggedIn}
                    accentColor={primaryMeta.color}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 uppercase tracking-wider select-none">
                    ID Offline
                  </div>
                )}
                <Link
                  href={`/messages?user=${encodeURIComponent(profile.full_name || 'Student')}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all bg-[var(--bg-overlay)] border border-[var(--border-subtle)] active:scale-95 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Link>
                <BlockUserButton targetUid={id} targetName={profile.full_name || 'Student'} isLoggedIn={isLoggedIn} />
              </div>
            )}
            {isSelf && (
              <Link href="/profile" className="btn btn-ghost text-xs px-4 py-2.5 flex items-center gap-2 w-fit">
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>

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

      {/* ── INSTAGRAM PROFILE EMBED ────────────────── */}
      {profile.instagram && (
        <div className="rounded-3xl p-5 mb-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-md space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <span className="text-[#e1306c]">📸</span> Host Instagram Vibe
          </h3>
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] h-[480px]">
            <iframe
              src={
                profile.instagram.startsWith('http') 
                  ? `${profile.instagram.replace(/\/$/, '')}/embed/` 
                  : `https://www.instagram.com/${profile.instagram.replace(/^@/, '')}/embed/`
              }
              className="w-full h-full border-none"
              allowFullScreen
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
            {/* Fallback open button in case of browser/CSP restrictions */}
            <div className="absolute bottom-4 right-4 z-10">
              <a
                href={
                  profile.instagram.startsWith('http') 
                    ? profile.instagram 
                    : `https://www.instagram.com/${profile.instagram.replace(/^@/, '')}/`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#e1306c] hover:bg-[#c13584] text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                Open Instagram ↗
              </a>
            </div>
          </div>
        </div>
      )}

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
                    <img src={avatarUrl(review.authorId || 'user')} alt={review.authorName} className="w-full h-full object-cover" />
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
