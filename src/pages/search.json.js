export async function GET() {
  const postsGlob = import.meta.glob('./blog/*.md', { eager: true });
  const postsRawGlob = import.meta.glob('./blog/*.md', { query: '?raw', import: 'default', eager: true });

  const posts = Object.entries(postsGlob).map(([path, post]) => {
    const rawContent = (postsRawGlob[path] || '');
    
    // Strip frontmatter
    let content = rawContent.replace(/^---[\s\S]*?---/, '');

    // Pre-compress text for search index
    content = content
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // simplify links to text
      .replace(/```[\s\S]*?```/g, (codeBlock) => {
        return codeBlock.replace(/```[a-z]*/gi, '').replace(/\s+/g, ' ');
      })
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/#{1,6}\s+/g, '') // headings
      .replace(/<[^>]*>/g, '') // html tags
      .replace(/[*_~]/g, '') // formatting
      .replace(/\s+/g, ' ') // collapse all whitespace into single spaces
      .trim();

    return {
      title: post.frontmatter.title || '',
      url: post.url,
      date: post.frontmatter.date ? new Date(post.frontmatter.date).toISOString().split('T')[0] : '',
      description: (post.frontmatter.description || '').replace(/\s+/g, ' ').trim(),
      content: content
    };
  });

  return new Response(JSON.stringify(posts), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
