import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on GitHub Pages and as a hosted artifact.
  base: './',
  build: {
    target: 'es2022',
    // The hosted page only allows fonts from Google or data URIs, so fonts and default photos are inlined.
    assetsInlineLimit: (file: string) =>
      file.endsWith('.woff2') || file.replace(/\\/g, '/').includes('/brochure/defaults/')
        ? true
        : undefined,
    chunkSizeWarningLimit: 2500,
  },
});
