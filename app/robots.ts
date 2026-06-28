import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login'], 
    },
    // .xml uzantısı zorunlu değildir. Google bu rotayı doğrudan tarayabilir.
    sitemap: 'https://ezmoto.vercel.app/sitemap',
  };
}