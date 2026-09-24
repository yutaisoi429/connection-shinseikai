import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative base lets the same build work on both a GitHub project page
// (/<repository>/) and a custom domain.
export default defineConfig({
  plugins: [react()],
  base: './',
});
