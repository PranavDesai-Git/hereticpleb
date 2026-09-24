export async function GET() {
  const postsGlob = import.meta.glob('./blog/*.md', { eager: true });
  const posts = Object.values(postsGlob).map((post) => ({
    title: post.frontmatter.title,
    url: post.url,
    date: post.frontmatter.date,
    description: post.frontmatter.description
  }));
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' }
  });
}
