import esbuild from 'esbuild';
import cpx from 'cpx';
import { rm } from 'fs/promises';
import 'dotenv/config';

console.log('Starting build process...');

// Robustly check for the API_KEY and provide a clear error message if it's missing.
if (!process.env.API_KEY) {
  console.error(`
    \x1b[31m[BUILD ERROR]\x1b[0m API_KEY is missing.
    
    To fix this, you need to provide your Gemini API key.
    
    \x1b[33mFor Local Development:\x1b[0m
    1. Create a file named '.env' in the root of your project.
    2. Add the following line to it:
       API_KEY="YOUR_GEMINI_API_KEY_HERE"
    
    \x1b[33mFor Deployment (e.g., Cloudflare Pages):\x1b[0m
    1. Go to your project's settings in your deployment provider.
    2. Find the 'Environment Variables' section.
    3. Add a new variable with the name 'API_KEY' and your key as the value.
    
    The build will not proceed without the API_KEY.
  `);
  process.exit(1);
}


try {
  // Clean the dist directory
  await rm('dist', { recursive: true, force: true });
  console.log('Cleaned dist directory.');

  // Run esbuild
  await esbuild.build({
    entryPoints: ['index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    loader: { '.tsx': 'tsx' },
    define: {
      'process.env.NODE_ENV': '"production"',
      // The check above ensures API_KEY is defined, so we can use it directly.
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    },
    logLevel: 'info',
  });
  console.log('esbuild bundling complete.');

  // Copy static files
  const copyFiles = (source, dest) => {
    return new Promise((resolve, reject) => {
      cpx.copy(source, dest, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Copied ${source} to ${dest}`);
          resolve();
        }
      });
    });
  };

  await copyFiles('index.html', 'dist');
  await copyFiles('src/styles/**', 'dist/src/styles');
  await copyFiles('{manifest.json,sw.js,favicon.svg,_headers,_redirects}', 'dist');
  
  console.log('Build process completed successfully!');

} catch (e) {
  console.error('Build process failed:', e);
  process.exit(1);
}
