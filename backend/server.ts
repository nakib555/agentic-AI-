
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

  // Explicitly cast cors handler to any to resolve overload mismatch with app.options
  app.options('*', cors(corsOptions) as any);
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
  app.get('/api/models', getAvailableModelsHandler);

  app.post('/api/handler', apiHandler);
  app.get('/api/handler', apiHandler);

  app.get('/api/history', crudHandler.getHistory);
  app.delete('/api/history', crudHandler.deleteAllHistory);
  app.get('/api/chats/:chatId', crudHandler.getChat);
  app.post('/api/chats/new', crudHandler.createNewChat);
  app.put('/api/chats/:chatId', crudHandler.updateChat);
  app.delete('/api/chats/:chatId', crudHandler.deleteChat);
  app.post('/api/import', crudHandler.importChat);

  app.get('/api/settings', getSettings);
  app.put('/api/settings', updateSettings);

  app.get('/api/memory', getMemory);
  app.put('/api/memory', updateMemory);
  app.delete('/api/memory', clearMemory);

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
