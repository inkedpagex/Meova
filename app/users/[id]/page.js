// Public student profile page — /users/[id]
import { fetchProfileAdmin, fetchJoinedCirclesAdmin } from '../../../lib/firebaseAdminQueries';
import { getUserAdmin } from '../../../lib/getUserAdmin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GraduationCap, Users, Star,
  Code, Music, Dumbbell, Camera, Rocket, Palette, Gamepad2,
  BookOpen, Coffee, MessageCircle, Zap, Calendar, MapPin,
  CheckCircle
} from 'lucide-react';
import BookCoffeeButton from '../../../features/users/BookCoffeeButton';

function avatarUrl(seed) {
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed || 'u')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
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

const MOCK_REVIEWS = [
  { id: 1, author: 'Priya M.', avatar: 'priya-reviewer', rating: 5, text: 'Super helpful with DSA doubts. The coffee session was chill and productive!', date: '2 days ago' },
  { id: 2, author: 'Rahul S.', avatar: 'rahul-s', rating: 5, text: 'Explained React hooks so clearly. Definitely booking again.', date: '1 week ago' },
  { id: 3, author: 'Ananya K.', avatar: 'ananya-k', rating: 4, text: 'Great conversation about startups and campus life. Totally worth 50 Sparks!', date: '2 weeks ago' },
];

export async function generateMetadata({ params }) {
  const profile = await fetchProfileAdmin(params.id);
  return {
    title: profile ? `${profile.full_name} — meetuply` : 'Student Profile — meetuply',
  };
}

export default async function UserProfilePage({ params }) {
  const [profile, currentUser, joinedCircles] = await Promise.all([
    fetchProfileAdmin(params.id),
    getUserAdmin(),
    fetchJoinedCirclesAdmin(params.id),
  ]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-neutral-500 mb-4">Profile not found.</p>
        <Link href="/" className="btn btn-ghost text-sm">Go Home</Link>
      </div>
    );
  }

  const isSelf = currentUser?.id === params.id;
  const isLoggedIn = !!currentUser;
  const interests = profile.interests || [];
  const primaryInterest = interests[0];
  const primaryMeta = INTEREST_META[primaryInterest] || { Icon: Star, color: '#6b7280', label: primaryInterest };
  const { Icon: PrimaryIcon } = primaryMeta;
  const avgRating = 4.8;

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
                src={avatarUrl(profile.full_name || params.id)}
                alt={profile.full_name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--bg-elevated)]" />
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
                <BookCoffeeButton
                  targetUserId={params.id}
                  targetName={profile.full_name}
                  isLoggedIn={isLoggedIn}
                  accentColor={primaryMeta.color}
                />
                <Link
                  href={`/messages?user=${encodeURIComponent(profile.full_name || 'Student')}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all bg-[var(--bg-overlay)] border border-[var(--border-subtle)] active:scale-95 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Link>
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
            Reviews ({MOCK_REVIEWS.length})
          </h2>
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-mid)]'}`} />
            ))}
            <span className="text-xs font-black text-[var(--text-primary)] ml-1">{avgRating}</span>
          </div>
        </div>

        <div className="space-y-3">
          {MOCK_REVIEWS.map(review => (
            <div
              key={review.id}
              className="rounded-2xl p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <img src={avatarUrl(review.avatar)} alt={review.author} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-[var(--text-primary)]">{review.author}</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-2.5 h-2.5 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-mid)]'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">{review.text}</p>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-2">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
