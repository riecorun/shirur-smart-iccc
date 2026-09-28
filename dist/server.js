"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const apiRoutes_1 = require("./routes/apiRoutes");
const wialonService_1 = require("./services/wialonService");
const store_1 = require("./database/store");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Socket.IO for Real-Time Fleet Telemetry
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT']
    }
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check for Cloud / Hostinger PaaS reverse proxy
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP', service: 'Shirur Smart ICCC', timestamp: new Date().toISOString() });
});
// REST API Endpoints
app.use('/api', apiRoutes_1.apiRouter);
// Serve Frontend Client Single-Page Application
const publicDir = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicDir));
// Fallback to index.html for SPA routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
    }
    res.sendFile(path_1.default.join(publicDir, 'index.html'));
});
// Socket.IO Connection Handler
io.on('connection', socket => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);
    // Send initial snapshot of vehicles and active alerts
    socket.emit('fleet:telemetry', {
        timestamp: new Date().toISOString(),
        vehicles: Array.from(store_1.db.vehicles.values()),
        alertsCount: Array.from(store_1.db.alerts.values()).filter(a => a.status === 'OPEN').length
    });
    socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
});
// Attach socket to Wialon live GPS service and start live telemetry polling
wialonService_1.wialonService.setSocketServer(io);
wialonService_1.wialonService.startLivePolling(10); // 10-second live sync from Wialon API
// Start Server (Supports Hostinger, PaaS, and dual-stack IPv4/IPv6 localhost reverse proxies)
const PORT = process.env.PORT || config_1.CONFIG.port || 3000;
server.on('error', (err) => {
    console.error('[SERVER ERROR]', err);
});
server.listen(PORT, () => {
    console.log('================================================================');
    console.log(`🏛️  SHIRUR NAGAR PARISHAD - AI-ICCC ENGINE ACTIVE`);
    console.log(`🚀 Server listening on port ${PORT} (Dual-stack IPv4/IPv6)`);
    console.log(`📡 Wialon GPS Gateway: ${store_1.db.settings.wialon.connectionStatus}`);
    console.log(`🤖 AI Municipal Assistant: Online`);
    console.log(`🛰️  Real-time Vehicles: ${store_1.db.vehicles.size} units on live tracking`);
    console.log('================================================================');
});
