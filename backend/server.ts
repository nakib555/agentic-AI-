
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

  // Middlewares
  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Version'],
  };

  // Explicitly cast cors handler to express.RequestHandler to resolve overload mismatch
  app.options('*', cors(corsOptions) as unknown as express.RequestHandler);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '50mb' }));

  // Version Check Middleware
  const appVersion = process.env.APP_VERSION;
  if (appVersion) {
    // Using 'any' types for req, res, next to avoid type conflicts between Express versions/definitions
    app.use('/api', (req: any, res: any, next: any) => {
      const clientVersion = req.header('X-Client-Version');
      if (clientVersion && clientVersion !== appVersion) {
        console.warn(`[VERSION_MISMATCH] Client: ${clientVersion}, Server: ${appVersion}.`);
        return res.status(409).json({
          error: 'version_mismatch',
          message: 'Your application version is out of date. Please refresh the page to get the latest version.',
        });
      }
      next();
    });
    console.log(`[SERVER] Running version: ${appVersion}`);
  }

  const staticPath = path.join((process as any).cwd(), 'dist');

  // API routes
  app.get('/api/health', (req: any, res: any) => res.json({ status: 'ok' }));
  
  // Cast handlers to express.RequestHandler to avoid type incompatibility with 'req' parameter
  app.get('/api/models', getAvailableModelsHandler as express.RequestHandler);

  app.post('/api/handler', apiHandler as express.RequestHandler);
  app.get('/api/handler', apiHandler as express.RequestHandler);

  app.get('/api/history', crudHandler.getHistory as express.RequestHandler);
  app.delete('/api/history', crudHandler.deleteAllHistory as express.RequestHandler);
  app.get('/api/chats/:chatId', crudHandler.getChat as express.RequestHandler);
  app.post('/api/chats/new', crudHandler.createNewChat as express.RequestHandler);
  app.put('/api/chats/:chatId', crudHandler.updateChat as express.RequestHandler);
  app.delete('/api/chats/:chatId', crudHandler.deleteChat as express.RequestHandler);
  app.post('/api/import', crudHandler.importChat as express.RequestHandler);

  app.get('/api/settings', getSettings as express.RequestHandler);
  app.put('/api/settings', updateSettings as express.RequestHandler);

  app.get('/api/memory', getMemory as express.RequestHandler);
  app.put('/api/memory', updateMemory as express.RequestHandler);
  app.delete('/api/memory', clearMemory as express.RequestHandler);

  // Serve static assets (Frontend)
  app.use(express.static(staticPath));
  
  // Mount the HISTORY_PATH to /uploads so that files in data/history/{folder}/file/ are accessible.
  // The structure is data/history/{FolderName}/file/{filename}
  // The URL will be /uploads/{FolderName}/file/{filename}
  app.use('/uploads', express.static(HISTORY_PATH));

  app.get('*', (req: any, res: any) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`[SERVER] Backend server is running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  (process as any).exit(1);
});
