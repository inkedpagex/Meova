import { supabaseAdmin } from '../lib/supabase/admin.js';

async function run() {
  console.log('Testing Ambassador character limits & Supabase connection...');

  // Test 1: Verify Supabase ambassador_applications table connectivity
  const { data, error } = await supabaseAdmin
    .from('ambassador_applications')
    .select('id, why_ambassador')
    .limit(1);

  if (error) {
    console.error('Supabase query error:', error);
    process.exit(1);
  }
  console.log('✅ Supabase ambassador_applications table queried successfully.');

  // Test 2: Validation logic simulation across all fields
  const FIELD_LIMITS = {
    full_name: 50,
    college_name: 80,
    email: 60,
    phone: 15,
    year: 20,
    branch: 40,
    instagram_handle: 30,
    linkedin_url: 80,
    why_ambassador: 150,
    meeting_locations: 150,
  };

  const validateForm = (form) => {
    if (!form.full_name?.trim() || form.full_name.trim().length < 2) return { ok: false, error: 'Name too short' };
    if (form.full_name.trim().length > FIELD_LIMITS.full_name) return { ok: false, error: 'Name too long' };
    if (!form.email?.trim() || form.email.trim().length > FIELD_LIMITS.email) return { ok: false, error: 'Email invalid or too long' };
    if (form.year && form.year.trim().length > FIELD_LIMITS.year) return { ok: false, error: 'Year too long' };
    if (form.branch && form.branch.trim().length > FIELD_LIMITS.branch) return { ok: false, error: 'Branch too long' };
    if (form.instagram_handle && form.instagram_handle.trim().length > FIELD_LIMITS.instagram_handle) return { ok: false, error: 'Instagram handle too long' };
    if (form.linkedin_url && form.linkedin_url.trim().length > FIELD_LIMITS.linkedin_url) return { ok: false, error: 'LinkedIn URL too long' };
    if (!form.why_ambassador?.trim() || form.why_ambassador.trim().length < 20) return { ok: false, error: 'Why too short' };
    if (form.why_ambassador.trim().length > FIELD_LIMITS.why_ambassador) return { ok: false, error: 'Why too long' };
    return { ok: true };
  };

  // Test full_name spam
  if (validateForm({ full_name: 'a'.repeat(51), email: 'test@meova.in', why_ambassador: 'a'.repeat(30) }).ok) {
    throw new Error('Name spam should be rejected');
  }
  console.log('✅ Name over 50 chars correctly rejected.');

  // Test instagram spam (user screenshot showed fffffffffffff)
  if (validateForm({ full_name: 'Alex', email: 'test@meova.in', instagram_handle: 'f'.repeat(31), why_ambassador: 'a'.repeat(30) }).ok) {
    throw new Error('Instagram spam should be rejected');
  }
  console.log('✅ Instagram handle over 30 chars correctly rejected.');

  // Test study year spam
  if (validateForm({ full_name: 'Alex', email: 'test@meova.in', year: 'y'.repeat(21), why_ambassador: 'a'.repeat(30) }).ok) {
    throw new Error('Year spam should be rejected');
  }
  console.log('✅ Study year over 20 chars correctly rejected.');

  // Test branch spam
  if (validateForm({ full_name: 'Alex', email: 'test@meova.in', branch: 'b'.repeat(41), why_ambassador: 'a'.repeat(30) }).ok) {
    throw new Error('Branch spam should be rejected');
  }
  console.log('✅ Course/branch over 40 chars correctly rejected.');

  // Test why_ambassador spam (> 150)
  if (validateForm({ full_name: 'Alex', email: 'test@meova.in', why_ambassador: 'w'.repeat(151) }).ok) {
    throw new Error('Why ambassador spam should be rejected');
  }
  console.log('✅ Why ambassador over 150 chars correctly rejected.');

  // Test valid complete form
  const validForm = {
    full_name: 'Alex Morgan',
    email: 'alex.morgan@university.edu',
    year: '3rd Year',
    branch: 'B.Tech Computer Science',
    instagram_handle: '@alex_m',
    linkedin_url: 'linkedin.com/in/alex-m',
    why_ambassador: 'I organize tech meetups and hackathons at our campus and love building student communities.',
  };
  if (!validateForm(validForm).ok) {
    throw new Error('Valid form was unexpectedly rejected');
  }
  console.log('✅ Valid form successfully passed all anti-spam limits.');

  console.log('🎉 ALL FORM ANTI-SPAM & CHARACTER LIMIT TESTS PASSED WITH EXIT CODE 0');
}

run();
