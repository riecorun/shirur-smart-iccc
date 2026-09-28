import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server } from 'socket.io';
import { CONFIG } from './config';
import { apiRouter } from './routes/apiRoutes';
import { wialonService } from './services/wialonService';
import { db } from './database/store';

const app = express();
const server = http.createServer(app);

// Socket.IO for Real-Time Fleet Telemetry
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// REST API Endpoints
app.use('/api', apiRouter);

// Serve Frontend Client Single-Page Application
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Fallback to index.html for SPA routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Socket.IO Connection Handler
io.on('connection', socket => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // Send initial snapshot of vehicles and active alerts
  socket.emit('fleet:telemetry', {
    timestamp: new Date().toISOString(),
    vehicles: Array.from(db.vehicles.values()),
    alertsCount: Array.from(db.alerts.values()).filter(a => a.status === 'OPEN').length
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Attach socket to Wialon live GPS service and start live telemetry polling
wialonService.setSocketServer(io);
wialonService.startLivePolling(10); // 10-second live sync from Wialon API

// Start Server
server.listen(CONFIG.port, () => {
  console.log('================================================================');
  console.log(`🏛️  SHIRUR NAGAR PARISHAD - AI-ICCC ENGINE ACTIVE`);
  console.log(`🚀 Server listening on http://localhost:${CONFIG.port}`);
  console.log(`📡 Wialon GPS Gateway: ${db.settings.wialon.connectionStatus}`);
  console.log(`🤖 AI Municipal Assistant: Online`);
  console.log(`🛰️  Real-time Vehicles: ${db.vehicles.size} units on live tracking`);
  console.log('================================================================');
});
