import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { getUserAdmin } from '../../../lib/getUserAdmin';
import { ArrowLeft, Sparkles, Home } from '@/lib/icons';
import PostCardClient from './PostCardClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!id) return { title: 'Post — Meova' };

  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('id, author_name, content, media_urls')
    .eq('id', id)
    .maybeSingle();

  if (!post) {
    return { title: 'Post Not Found — Meova' };
  }

  const title = `${post.author_name || 'Campus Student'} on Meova`;
  const desc = post.content ? post.content.slice(0, 150) : 'Check out this campus moment on Meova';
  const img = post.media_urls?.[0] || 'https://meova.in/icon.png';

  return {
    title: `${title} | Campus Feed`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `https://meova.in/posts/${id}`,
      siteName: 'Meova',
      images: [{ url: img }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [img],
    },
  };
}

export default async function SinglePostPage({ params }) {
  const { id } = await params;
  if (!id) notFound();

  const user = await getUserAdmin();

  // Fetch post
  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  // Check if current user liked it
  let initialIsLiked = false;
  if (user) {
    const { data: likeDoc } = await supabaseAdmin
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.uid)
      .maybeSingle();
    initialIsLiked = Boolean(likeDoc);
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 pt-3 sm:pt-6 px-3 sm:px-4">
      <div className="max-w-lg mx-auto space-y-3.5">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200/80 text-xs font-black text-zinc-700 hover:text-[#F05A00] hover:border-orange-200 transition-all shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Campus Feed</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#F05A00]"
          >
            <Sparkles size={14} />
            <span>Meova</span>
          </Link>
        </div>

        {/* Post Card */}
        <PostCardClient
          post={post}
          initialIsLiked={initialIsLiked}
          currentUserId={user?.uid || null}
          currentUserRole={user?.role || null}
        />

        {/* Bottom Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-orange-500 to-[#D94F00] text-white shadow-lg shadow-orange-500/15 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black">Join your campus network</h4>
            <p className="text-[10px] text-white/80 font-medium">Connect, meet, and collaborate with students.</p>
          </div>
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-black hover:bg-orange-50 transition-colors shrink-0 shadow-xs"
          >
            Open Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
