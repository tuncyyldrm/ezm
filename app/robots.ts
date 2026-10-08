import { MetadataRoute } from 'next';
import { getAbsoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login'],
    },
    sitemap: getAbsoluteUrl('/sitemap.xml'),
  };
}