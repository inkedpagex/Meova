import { getUserAdmin } from '../../lib/getUserAdmin';
import { fetchUsersAdmin, fetchCirclesAdmin } from '../../lib/firebaseAdminQueries';
import Link from 'next/link';
import { Search, Users, UserCheck } from 'lucide-react';
import { CircleAvatar } from '../../components/CircleAvatar';

export const metadata = { title: 'Discover — meetuply' };

function avatarUrl(seed) {
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed || 'u')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const TAG_MAP = {
  'Coding & Tech':   'tag-blue',
  'Music & Bands':   'tag-purple',
  'Sports & Fitness':'tag-green',
  'Dance':           'tag-pink',
  'Gaming & E-sports':'tag-orange',
  'Photography & Film':'tag-cyan',
  'Entrepreneurship':'tag-orange',
  'Art & Sketching': 'tag-pink',
};

function PersonRow({ user: u }) {
  return (
    <div className="card flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-all cursor-pointer"
      style={{ background:'var(--bg-elevated)', borderRadius:14, border:'1px solid var(--border-subtle)' }}>
      <div style={{ width:46, height:46, borderRadius:'50%', overflow:'hidden', border:'1px solid var(--border-subtle)', flexShrink:0 }}>
        <img src={avatarUrl(u.full_name || u.id)} alt={u.full_name} className="w-full h-full" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', lineHeight:1.2 }}>{u.full_name}</p>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{u.year} Year · {u.branch}</p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {(u.interests || []).slice(0,2).map(tag => (
            <span key={tag} className={`tag ${TAG_MAP[tag] || 'tag-neutral'}`}>{tag}</span>
          ))}
        </div>
      </div>
      <button className="btn btn-ghost flex-shrink-0" style={{ fontSize:12, padding:'7px 16px' }}>
        Connect
      </button>
    </div>
  );
}

function CircleRow({ circle }) {
  const initials = circle.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <Link href={`/circles/${circle.id}`}
      className="card flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-all cursor-pointer"
      style={{ background:'var(--bg-elevated)', borderRadius:14, border:'1px solid var(--border-subtle)', display:'flex' }}>
      <CircleAvatar name={circle.name} size={46} radius={12} />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', lineHeight:1.2 }}>{circle.name}</p>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{circle.category} · {circle.member_count} members</p>
      </div>
      <button className="btn btn-outline flex-shrink-0" style={{ fontSize:12, padding:'7px 16px' }} onClick={e => e.preventDefault()}>
        Join
      </button>
    </Link>
  );
}

export default async function DiscoverPage() {
  const currentUser = await getUserAdmin();
  const [users, circles] = await Promise.all([
    fetchUsersAdmin(50),
    fetchCirclesAdmin(),
  ]);

  const people = currentUser ? users.filter(u => u.id !== currentUser.id) : users;

  const FILTERS = ['All', 'Coding', 'Music', 'Sports', 'Gaming', 'Art', 'Entrepreneurship'];

  return (
    <div style={{ maxWidth: 680 }} className="anim-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.04em', color:'var(--text-primary)' }}>Discover</h1>
        <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>
          Find students, communities, and projects on your campus
        </p>
      </div>

      {/* Search bar (cosmetic — full search needs client component) */}
      <div className="glass flex items-center gap-3"
        style={{ borderRadius:14, padding:'12px 16px', marginBottom:20 }}>
        <Search size={16} style={{ color:'var(--text-muted)', flexShrink:0 }} />
        <span style={{ fontSize:14, color:'var(--text-muted)', fontWeight:400 }}>
          Search people, circles, events…
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scroll pb-1" style={{ marginBottom:28 }}>
        {FILTERS.map((f, i) => (
          <button key={f} className={i === 0 ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ flexShrink:0, fontSize:12, padding:'7px 16px' }}>
            {f}
          </button>
        ))}
      </div>

      {/* People section */}
      <section style={{ marginBottom:36 }}>
        <div className="section-header">
          <div className="flex items-center gap-2">
            <UserCheck size={16} style={{ color:'var(--text-muted)' }} />
            <h2 className="section-title" style={{ fontSize:16 }}>Students ({people.length})</h2>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {people.slice(0, 20).map(u => <PersonRow key={u.id} user={u} />)}
        </div>
      </section>

      {/* Circles section */}
      <section>
        <div className="section-header">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color:'var(--text-muted)' }} />
            <h2 className="section-title" style={{ fontSize:16 }}>Communities ({circles.length})</h2>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {circles.map(c => <CircleRow key={c.id} circle={c} />)}
        </div>
      </section>
    </div>
  );
}
