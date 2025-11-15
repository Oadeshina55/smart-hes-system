import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as cron from 'node-cron';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import meterRoutes from './routes/meter.routes';
import areaRoutes from './routes/area.routes';
import customerRoutes from './routes/customer.routes';
import consumptionRoutes from './routes/consumption.routes';
import eventRoutes from './routes/event.routes';
import alertRoutes from './routes/alert.routes';
import simRoutes from './routes/sim.routes';
import dashboardRoutes from './routes/dashboard.routes';
import remoteRoutes from './routes/remote.routes';
import obisRoutes from './routes/obis.routes';
import templateRoutes from './routes/template.routes';
import aiRoutes from './routes/ai.routes';

// Import services
import { MeterStatusService } from './services/meterStatus.service';
import { AlertService } from './services/alert.service';
import { AnomalyDetectionService } from './services/anomalyDetection.service';
import aiMonitoringService from './services/aiMonitoring.service';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Socket.io instance
export const socketIO = io;

// Database connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Initialize services after DB connection
    initializeServices();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/consumption', consumptionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sims', simRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/remote', remoteRoutes);
app.use('/api/obis', obisRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Join room based on user role
  socket.on('join-room', (data) => {
    socket.join(data.room);
    console.log(`Socket ${socket.id} joined room: ${data.room}`);
  });
  
  // Handle meter data updates
  socket.on('meter-update', async (data) => {
    // Broadcast meter update to all clients
    io.emit('meter-status-change', data);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Initialize services
function initializeServices() {
  // Start meter status monitoring (every 30 seconds)
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await MeterStatusService.checkMeterStatus();
    } catch (error) {
      console.error('Error checking meter status:', error);
    }
  });
  
  // Run anomaly detection (every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    try {
      await AnomalyDetectionService.detectAnomalies();
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  });

  // Run AI monitoring and analysis (every 15 minutes)
  cron.schedule('*/15 * * * *', async () => {
    try {
      await aiMonitoringService.detectAnomalies();
      console.log('✓ AI monitoring completed');
    } catch (error) {
      console.error('Error in AI monitoring:', error);
    }
  });

  // Clean old events (daily at midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      await AlertService.cleanOldAlerts();
    } catch (error) {
      console.error('Error cleaning old alerts:', error);
    }
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 WebSocket server is ready`);
});

export default app;
