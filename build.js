import esbuild from 'esbuild';
import cpx from 'cpx';
import { rm, readFile, writeFile } from 'fs/promises';
import 'dotenv/config';
import { execSync } from 'child_process';
import path from 'path';

console.log('Starting production build process...');

try {
  // 0. Get build version from git hash
  let version;
  try {
    version = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    console.warn('Failed to get git hash, using timestamp as version.');
    version = Date.now().toString();
  }
  console.log(`Building version: ${version}`);

  const define = {
    'process.env.NODE_ENV': '"production"',
    'process.env.APP_VERSION': JSON.stringify(version),
  };

  // 1. Clean the dist directory
  await rm('dist', { recursive: true, force: true });
  console.log('Cleaned dist directory.');

  // 2. Build Frontend
  await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    loader: { 
      '.tsx': 'tsx', 
      '.ts': 'ts',
      '.json': 'json',
      '.woff': 'file',
      '.woff2': 'file',
      '.ttf': 'file',
      '.eot': 'file'
    },
    define,
    minify: true,
    sourcemap: true,
    logLevel: 'info',
  });
  console.log('Frontend bundling complete.');
  
  // 3. Build Backend Server
  await esbuild.build({
    entryPoints: ['backend/server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: 'dist/server.cjs',
    packages: 'external', // Do not bundle node_modules for the backend
    define,
    minify: false, // Disable minification for better stack traces
    sourcemap: true,
    logLevel: 'info',
  });
  console.log('Backend server bundling complete.');

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
  await copyFiles('src/styles/**', 'dist/styles');
  // Exclude sw.js from bulk copy, handle it specifically below
  await copyFiles('{manifest.json,favicon.svg}', 'dist');

  // 5. Compile Tailwind CSS
  console.log('Compiling Tailwind CSS...');
  try {
    execSync('npx tailwindcss -i ./src/styles/main.css -o ./dist/styles/main.css --minify', { stdio: 'inherit' });
    console.log('Tailwind CSS compiled successfully.');
  } catch (err) {
    console.error('Tailwind CSS compilation failed:', err);
    process.exit(1);
  }

  // 6. Process and Copy Service Worker
  console.log('Processing Service Worker...');
  let swContent = await readFile('sw.js', 'utf-8');
  swContent = swContent.replace('{{VERSION}}', version);
  await writeFile('dist/sw.js', swContent);
  console.log('Service Worker injected with version and copied.');
  
  console.log('\nProduction build completed successfully!');

} catch (e) {
  console.error('Build process failed:', e);
  process.exit(1);
}