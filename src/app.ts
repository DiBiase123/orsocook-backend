// src/app.ts - VERSIONE FUNZIONANTE SU RENDER CON GITHUB PAGES
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import recipeRoutes from './routes/recipeRoutes';
import categoryRoutes from './routes/categoryRoutes';
import authRoutes from './routes/authRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import commentRoutes from './routes/commentRoutes';

// Carica variabili ambiente
dotenv.config();

const app = express();

// Middleware - CORS configurato per GitHub Pages
app.use(cors({
  origin: [
    'https://dibiase123.github.io',     // ✅ GitHub Pages production
    'http://localhost:5000',            // ✅ Sviluppo locale
    'http://10.0.2.2:5000',            // ✅ Android emulator
    'http://127.0.0.1:5000'            // ✅ Localhost alternativo
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'orso-cook-api',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/comments', commentRoutes);

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err: any, req, res, next) => {
  console.error('❌ Errore server:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app;