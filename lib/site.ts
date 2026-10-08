export function getBaseUrl(): string {
  const rawUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmoto.com.tr').trim();

  if (!rawUrl) {
    return 'https://ezmoto.com.tr';
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    try {
      return new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`).origin;
    } catch {
      return 'https://ezmoto.com.tr';
    }
  }
}

export function getAbsoluteUrl(path = '/') {
  return new URL(path, `${getBaseUrl()}/`).toString();
}
