import type { ImageMetadata } from 'astro';

// Eagerly import raster images from src/assets
const assetImages = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/*.{jpeg,jpg,png,gif,webp,avif}',
  { eager: true }
);

export interface ResolvedImage {
  src: string;
  imageMetadata?: ImageMetadata;
  alt?: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Resolves a frontmatter image reference (from public/, src/assets/, or remote URL)
 * into a usable image path or object.
 */
export function resolveImage(
  image: string | { url?: string; src?: string; alt?: string } | undefined | null,
  fallbackAlt = ''
): ResolvedImage | null {
  if (!image) return null;

  let rawSrc = '';
  let alt = fallbackAlt;

  if (typeof image === 'string') {
    rawSrc = image.trim();
  } else if (typeof image === 'object') {
    rawSrc = (image.src || image.url || '').trim();
    if (image.alt) alt = image.alt;
  }

  if (!rawSrc) return null;

  // Remote URL
  if (rawSrc.startsWith('http://') || rawSrc.startsWith('https://')) {
    return { src: rawSrc, alt, width: 1280, height: 720 };
  }

  // Check if it matches an asset in src/assets
  // Handles "../../assets/name.ext", "/src/assets/name.ext", "name.ext", etc.
  const filename = rawSrc.split('/').pop()?.split('?')[0];
  if (filename) {
    const assetKey = `../assets/${filename}`;
    if (assetKey in assetImages) {
      const asset = assetImages[assetKey].default;
      return {
        src: asset.src,
        imageMetadata: asset,
        alt,
        width: asset.width,
        height: asset.height,
        format: asset.format,
      };
    }
  }

  // File from public/ directory
  const publicSrc = rawSrc.startsWith('/') ? rawSrc : `/${rawSrc}`;
  return {
    src: publicSrc,
    alt,
    width: 1280,
    height: 720,
  };
}

/**
 * Returns an absolute URL string for Open Graph / Twitter cards / RSS enclosures.
 */
export function getAbsoluteImageUrl(
  image: string | { url?: string; src?: string; alt?: string } | undefined | null,
  siteUrl: string | URL = 'https://godobject.dev'
): string | null {
  const resolved = resolveImage(image);
  if (!resolved) return null;

  if (resolved.src.startsWith('http://') || resolved.src.startsWith('https://')) {
    return resolved.src;
  }

  const base = typeof siteUrl === 'string' ? siteUrl : siteUrl.href;
  try {
    return new URL(resolved.src, base).href;
  } catch {
    return resolved.src;
  }
}
