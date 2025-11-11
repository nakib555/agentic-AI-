import esbuild from 'esbuild';
import cpx from 'cpx';
import { rm } from 'fs/promises';
import 'dotenv/config';

console.log('Starting production build process...');

try {
  // 1. Clean the dist directory
  await rm('dist', { recursive: true, force: true });
  console.log('Cleaned dist directory.');

  // 2. Build Frontend
  await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    loader: { '.tsx': 'tsx' },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    minify: true,
    sourcemap: true,
    logLevel: 'info',
  });
  console.log('Frontend bundling complete.');
  
  // 3. Build Backend Worker
  await esbuild.build({
    entryPoints: ['backend/server.ts'],
    bundle: true,
    format: 'esm', // Use ES module format for workers
    outfile: 'dist/_worker.js', // Cloudflare Pages convention for the worker file
    minify: true,
    sourcemap: true,
    logLevel: 'info',
  });
  console.log('Backend worker bundling complete.');

  // 4. Copy static files
  const copyFiles = (source, dest) => {
    return new Promise((resolve, reject) => {
      cpx.copy(source, dest, (err) => {
        if (err) reject(err);
        else {
          console.log(`Copied ${source} to ${dest}`);
          resolve();
        }
      });
    });
  };

  await copyFiles('index.html', 'dist');
  await copyFiles('src/styles/**', 'dist/src/styles');
  await copyFiles('{manifest.json,sw.js,favicon.svg,_headers,_redirects}', 'dist');
  
  console.log('\nProduction build completed successfully!');

} catch (e) {
  console.error('Build process failed:', e);
  process.exit(1);
}