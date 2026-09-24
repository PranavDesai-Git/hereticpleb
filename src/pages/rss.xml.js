import rss from '@astrojs/rss';

export async function GET(context) {
  const postImportResult = import.meta.glob('./blog/*.md', { eager: true });
  const posts = Object.values(postImportResult);

  return rss({
    title: 'hereticpleb',
    description: 'Unconventional thoughts on faith and dissent.',
    site: context.site || 'https://hereticpleb.com',
    items: posts.map((post) => ({
      title: post.frontmatter.title,
      pubDate: new Date(post.frontmatter.date),
      description: post.frontmatter.description || post.frontmatter.title,
      link: post.url,
    })),
    customData: `<language>en-us</language>`,
  });
}
