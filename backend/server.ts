import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import process from 'process';
import { apiHandler } from './handler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const staticPath = path.join(process.cwd(), 'dist');

// API routes
// FIX: Removed explicit Request/Response types to allow for better type inference by Express. This resolves errors on res.json().
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// FIX: Removed incorrect type assertion. Express handles async handlers, and the handler itself is correctly typed in its definition.
app.post('/api/handler', apiHandler);

// Serve static assets for the frontend
app.use(express.static(staticPath));

// Catch-all route to serve index.html for Single Page Application (SPA) routing
// FIX: Removed explicit Request/Response types to allow for better type inference by Express. This resolves errors on res.sendFile().
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
