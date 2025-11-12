import 'dotenv/config';
// FIX: Use explicit Request and Response types from express to avoid global DOM type collisions.
// FIX: Alias Request and Response from express to avoid collision with global DOM types.
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
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
// FIX: Use correctly typed `Request` and `Response`.
// FIX: Use aliased express types to resolve type conflicts.
app.get('/api/health', (req: ExpressRequest, res: ExpressResponse) => res.json({ status: 'ok' }));
app.post('/api/handler', apiHandler);
app.get('/api/handler', apiHandler);


// Serve static assets for the frontend
app.use(express.static(staticPath));

// Catch-all route to serve index.html for Single Page Application (SPA) routing
// FIX: Use correctly typed `Request` and `Response`.
// FIX: Use aliased express types to resolve type conflicts.
app.get('*', (req: ExpressRequest, res: ExpressResponse) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[SERVER] Backend server is running on http://localhost:${PORT}`);
});
