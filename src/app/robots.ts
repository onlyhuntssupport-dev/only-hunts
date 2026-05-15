import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/outfitter/dashboard/', '/hunter/dashboard/'],
    },
    sitemap: 'https://www.only-hunts.com/sitemap.xml',
  };
}