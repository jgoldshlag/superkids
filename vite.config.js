import { defineConfig } from 'vite';

// Relative base so the build works at https://jgoldshlag.github.io/superkids/
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000, // Phaser is big; that's fine
  },
});
