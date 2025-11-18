"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketIO = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cron = __importStar(require("node-cron"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const meter_routes_1 = __importDefault(require("./routes/meter.routes"));
const area_routes_1 = __importDefault(require("./routes/area.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const consumption_routes_1 = __importDefault(require("./routes/consumption.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const alert_routes_1 = __importDefault(require("./routes/alert.routes"));
const sim_routes_1 = __importDefault(require("./routes/sim.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const remote_routes_1 = __importDefault(require("./routes/remote.routes"));
const obis_routes_1 = __importDefault(require("./routes/obis.routes"));
const template_routes_1 = __importDefault(require("./routes/template.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const dlms_routes_1 = __importDefault(require("./routes/dlms.routes"));
const loadProfile_routes_1 = __importDefault(require("./routes/loadProfile.routes"));
const powerQuality_routes_1 = __importDefault(require("./routes/powerQuality.routes"));
// Import services
const meterStatus_service_1 = require("./services/meterStatus.service");
const alert_service_1 = require("./services/alert.service");
const anomalyDetection_service_1 = require("./services/anomalyDetection.service");
const aiMonitoring_service_1 = __importDefault(require("./services/aiMonitoring.service"));
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Create Socket.io server
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Global Socket.io instance
exports.socketIO = io;
// Database connection with retry logic
const connectDB = async (retries = 5) => {
    const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds socket timeout
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
    };
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose_1.default.connect(process.env.MONGODB_URI, options);
            console.log('✅ Connected to MongoDB');
            console.log(`📊 Database: ${mongoose_1.default.connection.name}`);
            console.log(`🌍 Host: ${mongoose_1.default.connection.host}`);
            // Initialize services after DB connection
            initializeServices();
            return;
        }
        catch (err) {
            console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message);
            if (i < retries - 1) {
                const delay = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff, max 10s
                console.log(`⏳ Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            else {
                console.error('💥 Failed to connect to MongoDB after all retries');
                process.exit(1);
            }
        }
    }
};
// Handle connection events
mongoose_1.default.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
});
// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose_1.default.connection.close();
    console.log('🛑 MongoDB connection closed due to app termination');
    process.exit(0);
});
// Connect to database
connectDB();
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/meters', meter_routes_1.default);
app.use('/api/areas', area_routes_1.default);
app.use('/api/customers', customer_routes_1.default);
app.use('/api/consumption', consumption_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/alerts', alert_routes_1.default);
app.use('/api/sims', sim_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/remote', remote_routes_1.default);
app.use('/api/obis', obis_routes_1.default);
app.use('/api/templates', template_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/dlms', dlms_routes_1.default);
app.use('/api/load-profile', loadProfile_routes_1.default);
app.use('/api/power-quality', powerQuality_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected'
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
            await meterStatus_service_1.MeterStatusService.checkMeterStatus();
        }
        catch (error) {
            console.error('Error checking meter status:', error);
        }
    });
    // Run anomaly detection (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
        try {
            await anomalyDetection_service_1.AnomalyDetectionService.detectAnomalies();
        }
        catch (error) {
            console.error('Error in anomaly detection:', error);
        }
    });
    // Run AI monitoring and analysis (every 15 minutes)
    cron.schedule('*/15 * * * *', async () => {
        try {
            await aiMonitoring_service_1.default.detectAnomalies();
            console.log('✓ AI monitoring completed');
        }
        catch (error) {
            console.error('Error in AI monitoring:', error);
        }
    });
    // Clean old events (daily at midnight)
    cron.schedule('0 0 * * *', async () => {
        try {
            await alert_service_1.AlertService.cleanOldAlerts();
        }
        catch (error) {
            console.error('Error cleaning old alerts:', error);
        }
    });
}
// Error handling middleware
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=server.js.map