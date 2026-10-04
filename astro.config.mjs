import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://godobject.dev',
  integrations: [sitemap()],
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
