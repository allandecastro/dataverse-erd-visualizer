import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const appVersion = packageJson.version;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWebResource = mode === 'webresource';

  return {
    // Inject version as global constant
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
      react(),
      // Custom plugin to copy logo and rename HTML for web resource
      isWebResource && {
        name: 'webresource-post-build',
        closeBundle() {
          const distPath = path.resolve(__dirname, 'dist/webresource');

          // Copy and rename logo
          const logoSrc = path.resolve(__dirname, 'public/logo.svg');
          const logoDest = path.resolve(distPath, 'adc_dataverseerdvisualizerlogo.svg');
          if (fs.existsSync(logoSrc)) {
            fs.copyFileSync(logoSrc, logoDest);
            console.log('✓ Logo copied: adc_dataverseerdvisualizerlogo.svg');
          } else {
            console.warn('⚠ Logo not found:', logoSrc);
          }

          // Rename index.html to adc_dataverseerdvisualizer.html
          const htmlSrc = path.resolve(distPath, 'index.html');
          const htmlDest = path.resolve(distPath, 'adc_dataverseerdvisualizer.html');
          if (fs.existsSync(htmlSrc)) {
            fs.renameSync(htmlSrc, htmlDest);
            console.log('✓ HTML renamed: adc_dataverseerdvisualizer.html');
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
          // For web resource, output IIFE format (not ESM) for Dataverse compatibility
          format: isWebResource ? 'iife' : undefined,
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