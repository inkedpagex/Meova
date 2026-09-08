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
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
