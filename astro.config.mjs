import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hereticpleb.vercel.app',
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
