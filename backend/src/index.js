require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require("socket.io");
const resultFetcherService = require('./app/services/result-fetcher.service');
const { startHeartbeat } = require('./db/models');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Configure this for production later
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Matka King Backend API', status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/v1', require('./app/routes'));

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Something went wrong!'
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`[DEBUG] Backend Server Restarted at ${new Date().toISOString()}`);
    resultFetcherService.init(); // Start Cron Jobs
    startHeartbeat(); // Start DB heartbeat to prevent sleep
});

// Socket.io connection (basic)
io.on("connection", (socket) => {
    console.log("New client connected", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
    });
});

module.exports = { app, io };
