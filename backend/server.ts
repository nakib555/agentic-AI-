import 'dotenv/config';
// FIX: Import Request and Response types directly from express to resolve type conflicts, using aliases.
// The previous fix was insufficient. Using direct, non-aliased types from express.
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import process from 'process';
import { apiHandler } from './handler.js';
import * as crudHandler from './crudHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares

// Define CORS options
const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};

// Explicitly handle pre-flight requests for all routes.
// This ensures the browser receives a valid CORS response before sending the actual API request.
app.options('*', cors(corsOptions)); 
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

const staticPath = path.join(process.cwd(), 'dist');
const uploadsPath = path.join(process.cwd(), 'data', 'uploads');

// API routes
// FIX: Explicitly type req and res to use aliased express types.
// The previous fix was insufficient. Using direct, non-aliased types from express.
app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok' }));

// Streaming and complex tasks handler
app.post('/api/handler', apiHandler);
app.get('/api/handler', apiHandler);

// CRUD routes for chat history
app.get('/api/history', crudHandler.getHistory);
app.delete('/api/history', crudHandler.deleteAllHistory);
app.get('/api/chats/:chatId', crudHandler.getChat);
app.post('/api/chats/new', crudHandler.createNewChat);
app.put('/api/chats/:chatId', crudHandler.updateChat);
app.delete('/api/chats/:chatId', crudHandler.deleteChat);
app.post('/api/import', crudHandler.importChat);

// Serve static assets for the frontend and uploads
app.use(express.static(staticPath));
app.use('/uploads', express.static(uploadsPath));


// Catch-all route to serve index.html for Single Page Application (SPA) routing
// FIX: Explicitly type req and res to use aliased express types.
// The previous fix was insufficient. Using direct, non-aliased types from express.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[SERVER] Backend server is running on http://localhost:${PORT}`);
});