import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/fontmaker/',
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      mangle: { toplevel: true },
      compress: { passes: 2 },
    },
  },
});
