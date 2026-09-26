import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hereticpleb.com',
  markdown: {
    shikiConfig: {
      theme: 'dark-plus'
    }
  }
});
