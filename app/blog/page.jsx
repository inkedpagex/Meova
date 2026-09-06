import BlogClient from './BlogClient';

export const metadata = {
  title: 'Meova Campus Blog — Stories, Guides & Student Updates',
  description: 'Read the latest campus guides, student stories, meetup tips, and platform updates from the Meova team.',
  alternates: { canonical: 'https://meova.in/blog' },
  openGraph: {
    title: 'Meova Campus Blog — Stories, Guides & Student Updates',
    description: 'Campus guides, meetup tips, circle stories, and product news from Meova.',
    url: 'https://meova.in/blog',
    siteName: 'Meova',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
