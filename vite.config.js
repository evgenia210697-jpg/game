import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути: собранную игру можно положить в любую папку хостинга
  base: './',
  build: {
    // Phaser сам по себе весит ~1,4 МБ (≈360 КБ в gzip) — это нормально
    chunkSizeWarningLimit: 1600,
  },
});
