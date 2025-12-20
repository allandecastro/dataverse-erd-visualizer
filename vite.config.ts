import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWebResource = mode === 'webresource';

  return {
    plugins: [
      react(),
      // Custom plugin to copy and rename logo for web resource
      isWebResource && {
        name: 'copy-logo-webresource',
        closeBundle() {
          const srcPath = path.resolve(__dirname, 'public/logo.svg');
          const destPath = path.resolve(__dirname, 'dist/webresource/adc_dataverseerdvisualizerlogo.svg');
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      },
      // Custom plugin to transform HTML for Dataverse web resources
      isWebResource && {
        name: 'transform-html-for-dataverse',
        transformIndexHtml(html) {
          // Remove Vite-specific attributes and adjust paths for Dataverse
          let transformed = html
            .replace(/type="module"\s*/g, '')
            .replace(/crossorigin\s*/g, '')
            .replace(/\s*<link rel="icon"[^>]*>/g, '')
            .replace(/href="\/([^"]+)"/g, 'href="$1"')
            .replace(/src="\/([^"]+)"/g, 'src="$1"');

          // Move script from head to end of body for proper DOM loading
          // Extract script tag from head
          const scriptMatch = transformed.match(/<script\s+src="([^"]+)"[^>]*><\/script>/);
          if (scriptMatch) {
            const scriptTag = scriptMatch[0];
            const scriptSrc = scriptMatch[1];
            // Remove script from wherever it is
            transformed = transformed.replace(scriptTag, '');
            // Add script at the end of body with defer as backup
            transformed = transformed.replace(
              '</body>',
              `  <script defer src="${scriptSrc}"></script>\n  </body>`
            );
          }

          return transformed;
        }
      }
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Disable public folder copy for webresource (we copy logo manually with correct name)
    publicDir: isWebResource ? false : 'public',
    build: {
      outDir: isWebResource ? 'dist/webresource' : 'dist',
      sourcemap: !isWebResource,
      minify: isWebResource ? 'terser' : 'esbuild',
      rollupOptions: {
        output: {
          // For web resource, create a single bundle
          manualChunks: isWebResource ? undefined : {
            'react-vendor': ['react', 'react-dom'],
          },
          // Web resource naming with adc_ prefix (Allan De Castro)
          entryFileNames: isWebResource ? 'adc_dataverseerdvisualizer.js' : 'assets/[name]-[hash].js',
          chunkFileNames: isWebResource ? 'adc_dataverseerdvisualizer-[name].js' : 'assets/[name]-[hash].js',
          assetFileNames: isWebResource ? 'adc_dataverseerdvisualizer.[ext]' : 'assets/[name]-[hash].[ext]',
        },
      },
      // Optimize for web resource
      ...(isWebResource && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      }),
    },
    // Dev server configuration
    server: {
      port: 3000,
      open: true,
    },
  };
});