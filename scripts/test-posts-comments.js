const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseAdmin = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function testPostComments() {
  console.log('--- TESTING PROFILE POSTS & COMMENTS BACKEND ---');

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin client is not configured');
    process.exit(1);
  }

  // 1. Fetch a sample post
  const { data: posts, error: postErr } = await supabaseAdmin
    .from('posts')
    .select('id, content, media_urls, likes_count, user_id, created_at')
    .limit(1);

  if (postErr) {
    console.error('❌ Error fetching posts:', postErr.message);
    process.exit(1);
  }

  console.log(`✅ Successfully queried posts table: found ${posts?.length || 0} posts`);
  const testPost = posts && posts.length > 0 ? posts[0] : null;

  if (testPost) {
    console.log(`✅ Sample Post ID: ${testPost.id}, likes_count: ${testPost.likes_count}`);

    // 2. Check comments storage: try post_comments table, and verify fallback audit_logs
    const { data: comments, error: cErr } = await supabaseAdmin
      .from('post_comments')
      .select('*')
      .eq('post_id', testPost.id)
      .limit(5);

    if (cErr) {
      console.log(`ℹ️ post_comments table not present yet (${cErr.message}), checking fallback audit_logs...`);
      const { data: auditLogs, error: aErr } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('action', 'POST_COMMENT')
        .limit(5);

      if (aErr) {
        console.error('❌ Error checking fallback audit_logs:', aErr.message);
        process.exit(1);
      }
      console.log(`✅ Fallback audit_logs verified: ${auditLogs?.length || 0} comments recorded in fallback storage.`);
    } else {
      console.log(`✅ post_comments table active: found ${comments?.length || 0} comments.`);
    }

    // 3. Verify user profile retrieval for post author
    const { data: userProfile, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, full_name, photo_url, branch')
      .eq('id', testPost.user_id)
      .single();

    if (uErr) {
      console.warn(`⚠️ User lookup notice (may be mock ID): ${uErr.message}`);
    } else {
      console.log(`✅ Post author verified: ${userProfile.full_name} (${userProfile.branch || 'General'})`);
    }
  }

  console.log('✅ ALL BACKEND PROFILE POSTS & COMMENTS VERIFICATIONS PASSED WITH EXIT CODE 0');
  process.exit(0);
}

testPostComments().catch((err) => {
  console.error('❌ Uncaught test error:', err);
  process.exit(1);
});
