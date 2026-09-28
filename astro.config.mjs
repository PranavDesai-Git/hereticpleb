import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hereticpleb.vercel.app',
  markdown: {
    shikiConfig: {
      theme: 'dark-plus'
    }
  }
});
