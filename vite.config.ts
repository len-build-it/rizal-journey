import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on GitHub Pages and as a hosted artifact.
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2500,
  },
});
