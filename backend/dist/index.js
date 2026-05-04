"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/user/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/user/userRoutes"));
const donationRoutes_1 = __importDefault(require("./routes/user/donationRoutes")); // User-facing donation routes
const authRoutes_2 = __importDefault(require("./routes/admin/authRoutes"));
const caseRoutes_1 = __importDefault(require("./routes/admin/caseRoutes"));
const donationRoutes_2 = __importDefault(require("./routes/admin/donationRoutes")); // Admin-facing donation routes
const uploadRoutes_1 = __importDefault(require("./routes/admin/uploadRoutes")); // File upload routes
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:5001'];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json()); // Parses incoming JSON requests
app.use((0, cookie_parser_1.default)()); // Parses cookies from incoming requests
// General purpose request logger - placed very early to catch all incoming requests
app.use((req, res, next) => {
    console.log(`[Global Request Logger] ${req.method} ${req.originalUrl} - Headers: ${JSON.stringify(req.headers.cookie)}`);
    next();
});
// CSP Header - important for browser security
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "script-src 'self'; connect-src 'self' http://localhost:5001; frame-src 'none'; object-src 'none'");
    next();
});
// --- ⭐ ROUTE REGISTRATION ORDER IS CRITICAL ⭐ ---
// Register ADMIN-SPECIFIC routes first to ensure they take precedence for '/api/admin/*' paths
app.use("/api/admin", authRoutes_2.default);
console.log("Registered /api/admin auth routes.");
app.use("/api/admin", caseRoutes_1.default);
console.log("Registered /api/admin case routes.");
app.use('/api/admin', uploadRoutes_1.default);
app.use("/api/admin", donationRoutes_2.default); // This should catch /api/admin/donations
console.log("Registered /api/admin donation routes.");
// Register USER-RELATED routes AFTER admin routes
app.use("/api", authRoutes_1.default);
console.log("Registered /api userAuthRoutes.");
app.use("/api", userRoutes_1.default);
console.log("Registered /api userRoutes.");
app.use("/api", donationRoutes_1.default); // This will catch /api/donations (user-facing)
console.log("Registered /api donationRoutes (user).");
// Fallback for unhandled routes - if a request makes it here, it means no route matched
app.use((req, res) => {
    console.warn(`[Global 404 Handler] Route Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl} - Route Not Found.` });
});
// ⭐ Comprehensive Error Handling Middleware - MUST be the LAST middleware ⭐
// This catches errors thrown by any middleware or route handler above.
app.use((err, req, res, next) => {
    console.error(`[Global Error Handler] Caught Error for ${req.method} ${req.originalUrl}:`, err);
    // Default status code for errors
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let errorMessage = err.message || 'An unexpected error occurred.';
    // Example: Handle specific error types if needed
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401; // Unauthorized for JWT issues
        errorMessage = 'Invalid or expired token. Please log in again.';
    }
    // Add other custom error handling if needed, e.g., Zod validation errors, Prisma errors
    res.status(statusCode).json({
        message: errorMessage,
        // Include stack trace only in development for security
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Backend initialization complete.');
});
