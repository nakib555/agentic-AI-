import 'dotenv/config';
// Fix: Import Request and Response types directly from express to resolve type errors.
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import process from 'process';
import { apiHandler } from './handler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// Enable Cross-Origin Resource Sharing for all origins to allow frontend-backend communication.
app.use(cors({
  origin: '*', // Allow any origin
  methods: ['GET', 'POST', 'OPTIONS'], // Allow common methods, including pre-flight
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow common headers
}));
app.use(express.json({ limit: '50mb' }));

const staticPath = path.join(process.cwd(), 'dist');

// API routes
// Fix: Use Request and Response types from express.
app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok' }));
app.post('/api/handler', apiHandler);
app.get('/api/handler', apiHandler);


// Serve static assets for the frontend
app.use(express.static(staticPath));

// Catch-all route to serve index.html for Single Page Application (SPA) routing
// Fix: Use Request and Response types from express.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[SERVER] Backend server is running on http://localhost:${PORT}`);
});
