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
    const currentUid = user.id || user.uid;
    const { data: likeDoc } = await supabaseAdmin
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', currentUid)
      .maybeSingle();
    initialIsLiked = Boolean(likeDoc);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-20 pt-3 sm:pt-6 px-3 sm:px-4">
      <div className="max-w-lg mx-auto space-y-3.5">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E7E5E4]/80 text-xs font-bold text-[#78716C] hover:text-[#6D28D9] hover:border-[#E4D9F7] transition-all shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Campus Feed</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9]"
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

        {/* Bottom Banner (Neo-Minimalist Flat Surface) */}
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] text-black shadow-xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-black">Join your campus network</h4>
            <p className="text-[10.5px] text-black/60 font-bold">Connect, meet, and collaborate with students.</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-[#6D28D9] text-white text-xs font-bold hover:bg-[#5B21B6] transition-colors shrink-0 shadow-xs"
          >
            Open Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
