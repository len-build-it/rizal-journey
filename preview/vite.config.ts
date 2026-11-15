import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname),
  base: './',
  build: {
    outDir: resolve(__dirname, '../dist-preview'),
    emptyOutDir: true,
    assetsInlineLimit: (file: string) => (file.endsWith('.woff2') ? true : undefined),
    rollupOptions: {
      input: { kit: resolve(__dirname, 'kit.html'), brochure: resolve(__dirname, 'brochure.html') },
    },
  },
});
