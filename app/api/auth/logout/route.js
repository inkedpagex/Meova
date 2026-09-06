import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = '__Meova_session';

const COOKIES_TO_CLEAR = [
  SESSION_COOKIE_NAME,
  '__Meova_session',
  '__Meova_admin_session',
  '__Meova_profile_overrides',
  '__Meova_pc',
  'sb-access-token',
  'sb-auth-token',
  'supabase-auth-token',
];

function applyClearCookies(response) {
  const isProd = process.env.NODE_ENV === 'production';
  const domains = isProd ? ['.meova.in', 'meova.in', ''] : [''];

  COOKIES_TO_CLEAR.forEach((name) => {
    domains.forEach((domain) => {
      const domainAttr = domain ? `; Domain=${domain}` : '';
      response.headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isProd ? '; Secure' : ''}${domainAttr}`
      );
    });
  });

  return response;
}

export async function GET(request) {
  const isProd = process.env.NODE_ENV === 'production';
  const host = request.headers.get('host') || '';
  const cleanHost = host.replace(/^(app|admin|ambassador)\./, '');
  const loginUrl = isProd
    ? 'https://meova.in/login'
    : `${request.nextUrl.protocol}//${cleanHost}/login`;

  const response = NextResponse.redirect(loginUrl);
  return applyClearCookies(response);
}

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  return applyClearCookies(response);
}
