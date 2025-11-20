
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiHandler } from './handler.js';
import * as crudHandler from './crudHandler.js';
import { getSettings, updateSettings } from './settingsHandler.js';
import { getMemory, updateMemory, clearMemory } from './memoryHandler.js';
import { getAvailableModelsHandler } from './modelsHandler.js';
import { initDataStore, HISTORY_PATH } from './data-store.js';

async function startServer() {
  // --- Initialize Data Store ---
  await initDataStore();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // --- CORS Configuration ---
  // Define allowed origins for development and production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000'
  ];

  // Add environment-specific allowed origins (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(origin => allowedOrigins.push(origin.trim()));
  }
  // Vercel deployment automatically adds its URL to the allowlist for production security
  if (process.env.VERCEL_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
  }

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl requests, or same-origin relative fetches)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked unauthorized request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Version'],
    credentials: true,
  };

  // Cast handlers to 'any' to avoid TypeScript overload mismatches with Express types
  app.options('*', cors(corsOptions) as any);
  app.use(cors(corsOptions) as any);
  app.use(express.json({ limit: '50mb' }) as any);

  // Version Check Middleware
  const appVersion = process.env.APP_VERSION;
  if (appVersion) {
    app.use('/api', ((req: any, res: any, next: any) => {
      const clientVersion = req.header('X-Client-Version');
      if (clientVersion && clientVersion !== appVersion) {
        console.warn(`[VERSION_MISMATCH] Client: ${clientVersion}, Server: ${appVersion}.`);
        return res.status(409).json({
          error: 'version_mismatch',
          message: 'Your application version is out of date. Please refresh the page to get the latest version.',
        });
      }
      next();
    }) as any);
    console.log(`[SERVER] Running version: ${appVersion}`);
  }

  const staticPath = path.join((process as any).cwd(), 'dist');

  // API routes
  // Using 'as any' for handlers to bypass strict RequestHandler type checks
  app.get('/api/health', ((req: any, res: any) => res.json({ status: 'ok' })) as any);
  
  app.get('/api/models', getAvailableModelsHandler as any);

  app.post('/api/handler', apiHandler as any);
  app.get('/api/handler', apiHandler as any);

  app.get('/api/history', crudHandler.getHistory as any);
  app.delete('/api/history', crudHandler.deleteAllHistory as any);
  app.get('/api/chats/:chatId', crudHandler.getChat as any);
  app.post('/api/chats/new', crudHandler.createNewChat as any);
  app.put('/api/chats/:chatId', crudHandler.updateChat as any);
  app.delete('/api/chats/:chatId', crudHandler.deleteChat as any);
  app.post('/api/import', crudHandler.importChat as any);

  app.get('/api/settings', getSettings as any);
  app.put('/api/settings', updateSettings as any);

  app.get('/api/memory', getMemory as any);
  app.put('/api/memory', updateMemory as any);
  app.delete('/api/memory', clearMemory as any);

  // Serve static assets (Frontend)
  app.use(express.static(staticPath) as any);
  
  // Mount the HISTORY_PATH to /uploads so that files in data/history/{folder}/file/ are accessible.
  app.use('/uploads', express.static(HISTORY_PATH) as any);

  app.get('*', ((req: any, res: any) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  }) as any);

  app.listen(PORT, () => {
    console.log(`[SERVER] Backend server is running on http://localhost:${PORT}`);
    console.log(`[SERVER] CORS enabled for: ${allowedOrigins.join(', ') || 'Same-Origin Only'}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  (process as any).exit(1);
});