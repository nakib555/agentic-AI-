import esbuild from 'esbuild';
import cpx from 'cpx';
import { rm } from 'fs/promises';
import 'dotenv/config';

console.log('Starting build process...');

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
      // This will take the API_KEY from the environment (either .env file or shell)
      // and safely embed it in the built code.
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
