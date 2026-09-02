// Public student profile page — /users/[id]
import { fetchProfileAdmin, fetchJoinedCirclesAdmin, fetchReviewsAdmin, fetchUsersAdmin, fetchUserPostsAdmin } from '../../../lib/supabaseQueries';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { getUserAdmin } from '../../../lib/getUserAdmin';
import Link from 'next/link';
import {
  ArrowLeft, GraduationCap, Users, Star,
  Code, Music, Dumbbell, Camera, Rocket, Palette, Gamepad2,
  BookOpen, Coffee, MessageCircle, Zap, Calendar, MapPin,
  CheckCircle, Layers, Heart
} from 'lucide-react';
import { Linkedin, Github } from '../../../components/ui/SocialIcons';
import BookCoffeeButton from '../../../features/users/BookCoffeeButton';
import AcceptBookingButton from '../../../features/users/AcceptBookingButton';
import BlockUserButton from '../../../features/users/BlockUserButton';
import MessageButton from '../../../features/users/MessageButton';
import TipUserButton from '../../../features/users/TipUserButton';
import ProfileCallButton from '../../../components/call/ProfileCallButton';
import ProfileHighlightsSection from '../../../components/ProfileHighlightsSection';
import InstagramEmbed from '../../../components/InstagramEmbed';
import ZoomableProfileAvatar from '../../../components/ZoomableProfileAvatar';
import { calculateMeetupRate } from '../../../lib/pricing';

import { getUserAvatarUrl, getCartoonAvatar } from '../../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

const INTEREST_META = {
  'Coding & Tech':        { Icon: Code,        color: '#3b82f6', label: 'Dev' },
  'Music & Bands':        { Icon: Music,       color: '#F05A00', label: 'Music' },
  'Sports & Fitness':     { Icon: Dumbbell,    color: '#22c55e', label: 'Sports' },
  'Photography & Film':   { Icon: Camera,      color: '#06b6d4', label: 'Photo' },
  'Entrepreneurship':     { Icon: Rocket,      color: '#f97316', label: 'Startup' },
  'Art & Sketching':      { Icon: Palette,     color: '#ec4899', label: 'Art' },
  'Gaming & E-sports':    { Icon: Gamepad2,    color: '#a78bfa', label: 'Gaming' },
  'Literature & Poetry':  { Icon: BookOpen,    color: '#3b82f6', label: 'Lit' },
  'Dance':                { Icon: Star,        color: '#ec4899', label: 'Dance' },
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
    title: profile ? `${profile.full_name} — Meova` : 'Student Profile — Meova',
  };
}

export default async function UserProfilePage({ params }) {
  const { id } = await params;
  const [profile, currentUser, joinedCircles, reviews, allUsers, userPosts] = await Promise.all([
    fetchProfileAdmin(id),
    getUserAdmin(),
    fetchJoinedCirclesAdmin(id),
    fetchReviewsAdmin(id, 10),
    fetchUsersAdmin(8),
    fetchUserPostsAdmin(id, 8),
  ]);

  let activeMeeting = null;
  let pendingBooking = null;
  if (currentUser && currentUser.id !== id) {
    const { data: bookingRows } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .or(`and(host_id.eq.${currentUser.id},guest_id.eq.${id}),and(host_id.eq.${id},guest_id.eq.${currentUser.id})`)
      .in('status', ['Requested', 'Accepted', 'Confirmed'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (bookingRows && bookingRows.length > 0) {
      activeMeeting = bookingRows[0];
      if (activeMeeting.status === 'Requested' && activeMeeting.host_id === currentUser.id) {
        pendingBooking = activeMeeting;
      }
    }
  }

  const hasActiveMeeting = activeMeeting && ['Accepted', 'Confirmed'].includes(activeMeeting.status);

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
  const primaryMeta = INTEREST_META[primaryInterest] || { Icon: Star, color: '#F05A00', label: primaryInterest };
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const completedMeets = (reviews && reviews.length > 0) ? reviews.length : (profile.completed_meets_count || 0);
  const hostRate = calculateMeetupRate(completedMeets);

  return (
    <div className="max-w-[680px] mx-auto anim-fade-in relative pb-12">

      {/* Ambient glow from primary interest color */}
      <div
        className="absolute top-[-80px] left-1/4 w-80 h-80 rounded-full blur-[140px] pointer-events-none -z-10 opacity-30"
        style={{ background: primaryMeta.color }}
      />

      {/* ── HEADER BAR ─────────────────────── */}
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

      {/* ── PROFILE HERO ─────────────────────── */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 mb-6 border border-zinc-100 shadow-sm">
        
        {/* Avatar + Stats Row */}
        <div className="flex items-center justify-between gap-6 mb-4">
          {/* Zoomable Avatar with Ring */}
          <ZoomableProfileAvatar
            src={avatarUrl(profile)}
            alt={profile.full_name || 'User'}
            name={profile.full_name}
            username={profile.username}
            sizeClass="w-20 h-20 sm:w-24 sm:h-24"
            ringColor="#F05A00"
            isIdOn={profile.isIdOn !== false}
          />

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
                {hostRate} <Zap className="w-3.5 h-3.5 fill-current text-[#F05A00] inline" />
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
            {profile.bio || 'Campus Student · Connecting on Meova'}
          </p>
        </div>

        {/* Social Links Row */}
        {(profile.instagram || profile.linkedin || profile.github) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[11px] font-black text-[#F05A00] hover:bg-orange-100 transition-colors border border-orange-100"
              >
                <Camera size={13} />
                <span>@{profile.instagram.replace(/^@/, '')}</span>
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[11px] font-black text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <Linkedin size={13} />
                <span>LinkedIn</span>
              </a>
            )}
            {profile.github && (
              <a
                href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-[11px] font-black text-zinc-800 hover:bg-zinc-200 transition-colors border border-zinc-200"
              >
                <Github size={13} />
                <span>GitHub</span>
              </a>
            )}
          </div>
        )}

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

        {/* Action Buttons */}
        {!isSelf && (
          <div className="flex flex-col gap-2.5 pt-3 border-t border-zinc-100">
            {/* Direct In-App Privacy Call Button if active booking exists */}
            {hasActiveMeeting && (
              <div className="flex items-center gap-2">
                <ProfileCallButton
                  targetUserId={id}
                  targetName={profile.full_name}
                  targetPhoto={avatarUrl(profile)}
                  bookingId={activeMeeting?.id}
                  location={activeMeeting?.location}
                />
              </div>
            )}

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
                    completedMeets={completedMeets}
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

      {/* ── HIGHLIGHTS (INTERESTS CIRCLES + SUGGESTED STUDENTS) ── */}
      <ProfileHighlightsSection 
        interests={interests} 
        allUsers={allUsers} 
        currentUserId={id} 
      />

      {/* ── CAMPUS MOMENTS & POSTS GALLERY ───────────────── */}
      <section className="mb-6 bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-black text-zinc-400 tracking-[0.14em] uppercase flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-[#F05A00]" />
            Campus Moments ({userPosts.length})
          </h2>
        </div>

        {userPosts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userPosts.map(post => {
              const hasImage = post.media_urls && post.media_urls.length > 0;
              const firstImg = hasImage ? post.media_urls[0] : null;

              return (
                <div
                  key={post.id}
                  className="group relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 flex flex-col justify-between aspect-square transition-all duration-200 hover:shadow-md hover:border-orange-200"
                >
                  {hasImage ? (
                    <>
                      <img
                        src={firstImg}
                        alt="Moment"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div className="p-3.5 flex-1 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-zinc-800 line-clamp-4 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  )}

                  <div className="relative z-10 p-2.5 mt-auto flex items-center justify-between text-[10px] font-bold text-white">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                      <Heart size={10} className="fill-rose-500 text-rose-500" />
                      <span>{post.likes_count || 0}</span>
                    </span>
                    <span className="text-[9px] opacity-80 font-medium">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
            <Camera className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-500">No moments shared yet</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Moments posted on the campus feed will appear here</p>
          </div>
        )}
      </section>

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
              Campus Meet / 1-on-1 Session
              <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-500">
                <Zap className="w-2.5 h-2.5 fill-current" /> {hostRate} Sparks
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Spend {hostRate} Sparks to book a 1-on-1 campus meetup or coffee session with {profile.full_name?.split(' ')[0] || 'this student'}. 
              Great for networking, project collaboration, quiet study, or peer mentorship.
            </p>
            <div className="flex items-center gap-4 mt-3">
              {[
                { Icon: Calendar, text: 'Flexible slots' },
                { Icon: MapPin, text: 'Campus Spot' },
                { Icon: CheckCircle, text: 'Instant coordination' },
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
