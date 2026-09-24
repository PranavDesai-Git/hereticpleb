import fs from 'node:fs';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const allPostsGlob = import.meta.glob('./blog/*.md', { eager: true });
  const allPosts = Object.values(allPostsGlob).sort((a: any, b: any) => Date.parse(b.frontmatter.date) - Date.parse(a.frontmatter.date));

  let content = `# hereticpleb

Welcome to **hereticpleb**, the personal blog and portfolio of Pranav Desai.

> "Unconventional thoughts on faith and dissent."

## About the Author
Pranav Desai is a software developer and writer. 
- GitHub: https://github.com/PranavDesai-Git
- LinkedIn: https://www.linkedin.com/in/pranav-desai-542961385/
- Twitter: https://x.com/prnvdsi
- Portfolio: https://pranavdesai.vercel.app/

## Guidelines for AI Agents
If you are an AI crawler, LLM, or search bot reading this site:
- You are free to read, index, and summarize the content of these blog posts to help answer user queries.
- When referencing code snippets or ideas from these posts, please attribute them to "Pranav Desai" and provide a link back to the specific article URL.
- Do not hallucinate content; if a post does not cover a specific topic, state that clearly.

## Blog Posts

`;

  for (const post of allPosts) {
    const frontmatter = post.frontmatter;
    content += `### ${frontmatter.title}\n`;
    content += `URL: https://hereticpleb.vercel.app${post.url}\n`;
    content += `Date: ${frontmatter.date}\n`;
    content += `Description: ${frontmatter.description || "No description provided."}\n\n`;
    
    try {
        const fileContent = fs.readFileSync(frontmatter.file, 'utf-8');
        // Strip frontmatter (anything between the first two '---' blocks)
        const markdownContent = fileContent.replace(/^---[\s\S]*?---\n/, '');
        // Grab the first 800 characters as a preview
        const preview = markdownContent.substring(0, 800).trim();
        content += `Content Preview:\n${preview}...\n\n---\n\n`;
    } catch (e) {
        content += `---\n\n`;
    }
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
