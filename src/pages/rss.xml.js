import rss from '@astrojs/rss';
import { getAbsoluteImageUrl } from '../utils/images';

export async function GET(context) {
  const postImportResult = import.meta.glob('./blog/*.md', { eager: true });
  const posts = Object.values(postImportResult)
    .filter((post) => (import.meta.env.DEV || !post.frontmatter?.draft) && post.frontmatter?.date && (post.frontmatter?.title || post.frontmatter?.description))
    .sort(
      (a, b) => Date.parse(b.frontmatter.date) - Date.parse(a.frontmatter.date)
    );
  const siteUrl = context.site || 'https://godobject.dev';

  return rss({
    title: 'godObject',
    description: 'Tech Rants and Build Logs of godObject',
    site: siteUrl,
    xmlns: {
      media: 'http://search.yahoo.com/mrss/',
    },
    items: posts.map((post) => {
      const imageUrl = getAbsoluteImageUrl(post.frontmatter.image, siteUrl);
      let mimeType = 'image/jpeg';
      if (imageUrl) {
        if (imageUrl.endsWith('.png')) mimeType = 'image/png';
        else if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';
        else if (imageUrl.endsWith('.svg')) mimeType = 'image/svg+xml';
        else if (imageUrl.endsWith('.gif')) mimeType = 'image/gif';
      }

      return {
        title: post.frontmatter.title,
        pubDate: new Date(post.frontmatter.date),
        description: post.frontmatter.description || post.frontmatter.title,
        link: post.url,
        ...(imageUrl
          ? {
              enclosure: {
                url: imageUrl,
                length: 0,
                type: mimeType,
              },
              customData: `<media:content url="${imageUrl}" medium="image" type="${mimeType}" />`,
            }
          : {}),
      };
    }),
    customData: `<language>en-us</language>`,
  });
}

