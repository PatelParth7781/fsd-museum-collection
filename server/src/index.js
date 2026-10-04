import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import artifactRoutes from './routes/artifacts.js';
import categoryRoutes from './routes/categories.js';
import artistRoutes from './routes/artists.js';
import periodRoutes from './routes/periods.js';
import locationRoutes from './routes/locations.js';
import exhibitionRoutes from './routes/exhibitions.js';
import reviewRoutes from './routes/reviews.js';
import cartRoutes from './routes/cart.js';
import curatorRoutes from './routes/curator.js';
import auditRoutes from './routes/audit.js';
import uploadRoutes from './routes/upload.js';
import favoriteRoutes from './routes/favorites.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/exhibitions', exhibitionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/curator', curatorRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/favorites', favoriteRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ error: `Not Found - ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Museum Collection Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
});

export default app;
