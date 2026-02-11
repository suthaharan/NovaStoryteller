import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path must match Django's STATIC_URL for proper asset loading
  // Django serves static files at /static/, so chunks need to reference /static/assets/
  base: "/static/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Add node_modules to include paths so we can import Bootstrap directly
        includePaths: [resolve(__dirname, 'node_modules')],
        // Use modern Sass compiler API (removes legacy JS API warning)
        api: 'modern-compiler',
        // Silence deprecation warnings from Bootstrap's internal code
        // These warnings come from Bootstrap 5.3.8, not our code
        // We can't fix Bootstrap's code, so we silence their warnings
        silenceDeprecations: [
          'import',           // Bootstrap uses @import internally
          'if-function',      // Bootstrap uses if() function syntax
          'global-builtin',   // Bootstrap uses global built-in functions
          'color-functions',  // Bootstrap uses red(), green(), blue() functions
        ],
        // Additional configuration
        charset: false,
      },
    },
  },
  build: {
    // Output to 'dist' (Vite default) - will be copied to Django static/build
    outDir: 'dist',
    // Generate manifest for proper asset handling
    manifest: true,
    // Source maps for debugging (disable in production if needed)
    sourcemap: false,
  },
  // No proxy needed - Django serves everything on same port
  // In development, if using Vite dev server, API calls go to Django on port 8000
  // In production, Django serves React build, so relative paths work
});