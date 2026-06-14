import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();

import UserRoutes from './routes/user.js';
import AdminRoutes from './routes/admin.js';
import TournamentRoutes from './routes/tournaments.js';
import TournamentFormRoutes from './routes/tournamentsForm.js';
import MediaRoutes from './routes/media.js';
import ProductRoutes from './routes/products.js';
import BracketRoutes from './routes/brackets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global request logging middleware
app.use((req, res, next) => {
  const bodyText = req.body ? JSON.stringify(req.body).substring(0, 100) : '<empty or multipart body>';
  console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('📦 Body:', bodyText);
  next();
});

app.use('/api/users', UserRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/tournaments', TournamentRoutes);
app.use('/api/media', MediaRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/tournamentsForm', TournamentFormRoutes);
app.use('/api/brackets', BracketRoutes);

app.get('/api/config', (req, res) => {
  return res.status(200).json({
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
});

export default app;                            
