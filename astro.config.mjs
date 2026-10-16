import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

function getDraftPathnames() {
  const pagesDir = path.resolve('src/pages');
  const draftPaths = new Set();
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (match && /^draft:\s*(true|["']true["']|yes)\b/im.test(match[1])) {
            const rel = path.relative(pagesDir, fullPath).replace(/\\/g, '/');
            const routePath = '/' + rel.replace(/\.md$/, '').replace(/\/index$/, '');
            draftPaths.add(routePath);
          }
        } catch {}
      }
    }
  }
  walk(pagesDir);
  return draftPaths;
}

function draftIntegration() {
  return {
    name: 'draft-filter',
    hooks: {
      'astro:build:start': ({ setPrerenderer }) => {
        setPrerenderer((defaultPrerenderer) => ({
          ...defaultPrerenderer,
          async getStaticPaths() {
            const paths = await defaultPrerenderer.getStaticPaths();
            return paths.filter(({ route }) => {
              if (route.component && route.component.endsWith('.md')) {
                try {
                  const content = fs.readFileSync(route.component, 'utf-8');
                  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                  if (match && /^draft:\s*(true|["']true["']|yes)\b/im.test(match[1])) {
                    return false;
                  }
                } catch {}
              }
              return true;
            });
          }
        }));
      }
    }
  };
}

export default defineConfig({
  site: 'https://godobject.dev',
  integrations: [
    draftIntegration(),
    sitemap({
      filter: (page) => {
        const draftPaths = getDraftPathnames();
        for (const draftPath of draftPaths) {
          if (page.includes(draftPath)) {
            return false;
          }
        }
        return true;
      }
    })
  ],
  prefetch: true,
  compressHTML: true,
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'dark-plus'
      },
      defaultColor: false
    }
  },
  redirects: {
    '/blog': '/'
  }
});
