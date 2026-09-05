// Public student profile page — /users/[id]
import { fetchProfileAdmin, fetchJoinedCirclesAdmin, fetchReviewsAdmin, fetchUsersAdmin, fetchUserPostsAdmin } from '../../../lib/supabaseQueries';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { getUserAdmin } from '../../../lib/getUserAdmin';
import Link from 'next/link';
import {
  ArrowLeft, GraduationCap, Users, Star,
  Code, Music, Dumbbell, Camera, Rocket, Palette, Gamepad2,
  BookOpen, Coffee, MessageCircle, Zap, Calendar, MapPin,
  CheckCircle, Layers, Heart, Building2, Tag, ShieldAlert
} from '@/lib/icons';
import { Linkedin, Github } from '../../../components/ui/SocialIcons';
import BookCoffeeButton from '../../../features/users/BookCoffeeButton';
import AcceptBookingButton from '../../../features/users/AcceptBookingButton';
import BlockUserButton from '../../../features/users/BlockUserButton';
import MessageButton from '../../../features/users/MessageButton';
import ProfileCallButton from '../../../components/call/ProfileCallButton';
import ProfileHighlightsSection from '../../../components/ProfileHighlightsSection';
import ZoomableProfileAvatar from '../../../components/ZoomableProfileAvatar';
import HostBadge from '../../../components/HostBadge';
import LiveUserStatusBadge from '../../../components/LiveUserStatusBadge';
import { calculateMeetupRate } from '../../../lib/pricing';
import { getUserAvatarUrl, getCartoonAvatar } from '../../../utils/avatar';

function avatarUrl(userOrSeed) {
  if (userOrSeed && typeof userOrSeed === 'object') return getUserAvatarUrl(userOrSeed);
  return getCartoonAvatar(userOrSeed);
}

const InstagramIcon = ({ size = 14 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <p className="text-[#78716C] mb-4 text-sm font-medium">Profile not found.</p>
        <Link href="/" className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-bold text-xs uppercase tracking-wider">
          Go Home
        </Link>
      </div>
    );
  }

  const isSelf = currentUser?.id === id;
  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  if (profile.isBlocked && !isAdmin && !isSelf) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 p-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1C1917]">User Unavailable</h2>
          <p className="text-sm text-[#78716C] font-medium">This profile is no longer available on the platform.</p>
        </div>
        <Link href="/" className="px-5 py-2.5 rounded-full bg-[#1C1917] text-white font-bold text-xs">
          Go Home
        </Link>
      </div>
    );
  }

  const interests = profile.interests || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const completedMeets = (reviews && reviews.length > 0) ? reviews.length : (profile.completed_meets_count || 0);
  const hostRate = calculateMeetupRate(completedMeets);

  const yearLabel = profile.year ? (profile.year.toLowerCase().includes('year') ? profile.year : `${profile.year} Year`) : '1st Year';
  const branchLabel = profile.branch || 'General';
  const universityLabel = profile.university || 'GLA University, Mathura';

  return (
    <div className="max-w-[640px] mx-auto px-4 py-2 space-y-4 pb-28">

      {/* ── TOP NAV BAR ─────────────────────── */}
      <div className="flex items-center justify-between py-2 border-b border-[var(--border-hairline)]">
        <Link 
          href="/" 
          className="p-2 -ml-2 rounded-full hover:bg-[var(--accent-tint-10)] transition-colors text-[var(--text-primary)] cursor-pointer"
          title="Back to feed"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </Link>
        <div className="flex items-center gap-1.5 font-bold text-base text-[var(--text-primary)] tracking-tight">
          <span>@{profile.username || profile.full_name?.toLowerCase().replace(/\s+/g, '') || 'student'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        {!isSelf ? (
          <BlockUserButton targetUid={id} targetName={profile.full_name || 'Student'} isLoggedIn={isLoggedIn} iconOnly={true} />
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* ── PROFILE HEADER CARD ─────────────────────── */}
      <div className="bg-[var(--bg-surface)] rounded-[28px] p-6 border border-[var(--border-hairline)] shadow-xs flex flex-col items-center text-center relative overflow-hidden">
        
        {/* 96px Avatar with Accent Ring */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full p-1 border-[3px] border-[var(--accent)] bg-[var(--bg-surface)] flex items-center justify-center flex-shrink-0 shadow-md">
            <ZoomableProfileAvatar
              src={avatarUrl(profile)}
              alt={profile.full_name || 'User'}
              name={profile.full_name}
              username={profile.username}
              sizeClass="w-full h-full"
              ringColor="transparent"
              isIdOn={profile.isIdOn !== false}
            />
          </div>
        </div>

        {/* Name */}
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
          {profile.full_name || 'Student'}
        </h1>

        {/* Handle + Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {profile.username && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-hairline)]">
              @{profile.username}
            </span>
          )}
          <HostBadge role={profile.role} size="sm" />
          {profile.isLiveOnCampus && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Near You
            </span>
          )}
        </div>

        {/* Year · Branch */}
        <p className="text-[14px] font-semibold text-[var(--text-secondary)] mt-2">
          {yearLabel} · {branchLabel}
        </p>

        {/* University */}
        <p className="text-[13px] font-medium text-[var(--text-secondary)] mt-0.5">
          {universityLabel}
        </p>

        {/* Bio */}
        <p className="text-[14px] leading-relaxed mt-3 text-[var(--text-secondary)] max-w-[90%] italic">
          {profile.bio || 'No bio yet.'}
        </p>

        {/* Social Links Row */}
        {(profile.instagram || profile.linkedin || profile.github) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {profile.instagram && (
              <a 
                href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-tint-10)] text-[11px] font-bold text-[var(--accent)] hover:bg-[var(--accent-tint-20)] transition-colors border border-[var(--accent-tint-20)]"
              >
                <InstagramIcon size={13} />
                <span>@{profile.instagram.replace(/^@/, '')}</span>
              </a>
            )}
            {profile.linkedin && (
              <a 
                href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-[11px] font-bold text-blue-500 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-base)] text-[11px] font-bold text-[var(--text-primary)] hover:bg-[var(--accent-tint-10)] transition-colors border border-[var(--border-hairline)]"
              >
                <Github size={13} />
                <span>GitHub</span>
              </a>
            )}
          </div>
        )}

        {/* Stats Counters */}
        <div className="w-full grid grid-cols-3 gap-2 py-4 my-4 border-y border-[var(--border-hairline)]">
          <div>
            <span className="block text-lg font-bold text-[var(--text-primary)] leading-tight">
              {completedMeets}
            </span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Meets</span>
          </div>
          <div>
            <span className="block text-lg font-bold text-[var(--text-primary)] leading-tight flex items-center justify-center gap-1">
              {avgRating || 'New'} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
            </span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Rating</span>
          </div>
          <div>
            <span className="block text-lg font-bold text-[var(--accent)] leading-tight flex items-center justify-center gap-1">
              {hostRate} <Zap className="w-3.5 h-3.5 fill-current text-[var(--accent)] inline" />
            </span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Rate</span>
          </div>
        </div>

        {/* Actions Row */}
        {!isSelf ? (
          <div className="w-full space-y-2.5">
            {/* Direct Privacy Call if active booking exists */}
            {hasActiveMeeting && (
              <ProfileCallButton
                targetUserId={id}
                targetName={profile.full_name}
                targetPhoto={avatarUrl(profile)}
                bookingId={activeMeeting?.id}
                location={activeMeeting?.location}
              />
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              {pendingBooking ? (
                <div className="flex-1">
                  <AcceptBookingButton booking={pendingBooking} className="w-full" />
                </div>
              ) : profile.isIdOn !== false ? (
                <div className="flex-1">
                  <BookCoffeeButton
                    targetUserId={id}
                    targetName={profile.full_name}
                    targetPhoto={avatarUrl(profile)}
                    isLoggedIn={isLoggedIn}
                    completedMeets={completedMeets}
                  />
                </div>
              ) : (
                <div className="flex-1 py-3 rounded-full text-xs font-bold text-center text-rose-600 bg-rose-500/10 border border-rose-500/20">
                  Currently Offline
                </div>
              )}

              <div className="flex-1">
                <MessageButton targetUid={id} />
              </div>
            </div>
          </div>
        ) : (
          <Link 
            href="/profile" 
            className="w-full h-12 rounded-full text-[14px] font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer uppercase tracking-wider"
          >
            Edit Profile
          </Link>
        )}
      </div>

      {/* ── HIGHLIGHTS & INTERESTS INTERACTIVE CAPSULES (WITH PEER EXPLORATION) ── */}
      <ProfileHighlightsSection 
        interests={interests} 
        allUsers={allUsers} 
        currentUserId={id} 
      />

      {/* ── CAMPUS MOMENTS GALLERY ───────────────── */}
      <section className="bg-[var(--bg-surface)] rounded-[28px] p-5 border border-[var(--border-hairline)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold text-[var(--text-secondary)] tracking-[0.14em] uppercase flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
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
                  className="group relative rounded-[16px] overflow-hidden border border-[#E7E5E4] bg-[#FAFAF8] flex flex-col justify-between aspect-square transition-all duration-200 hover:shadow-[0_4px_16px_rgba(28,25,23,0.08)] hover:border-[var(--accent-tint-20)]"
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
                      <p className="text-xs font-semibold text-[#1C1917] line-clamp-4 leading-relaxed">
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
          <div className="text-center py-8 rounded-[16px] bg-[#FAFAF8] border border-dashed border-[#E7E5E4]">
            <Camera className="w-6 h-6 text-[#A8A29E] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#78716C]">No moments shared yet</p>
            <p className="text-[10px] text-[#A8A29E] mt-0.5">Moments posted on the campus feed will appear here</p>
          </div>
        )}
      </section>

    </div>
  );
}
