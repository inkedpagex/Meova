export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meova.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/messages/', '/settings/', '/blocked/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/favicon.ico', '/favicon*.png', '/favicon-*.png', '/icon-*.png', '/icon*.png', '/logo*.png', '/apple-touch-icon.png'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
