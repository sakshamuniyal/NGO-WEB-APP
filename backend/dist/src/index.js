"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/user/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/user/userRoutes"));
const donationRoutes_1 = __importDefault(require("./routes/user/donationRoutes"));
const authRoutes_2 = __importDefault(require("./routes/admin/authRoutes"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:5001']; // Add any additional origins
// CORS options
const corsOptions = {
    origin: (origin, callback) => {
        // Check if the origin is allowed
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow the request
        }
        else {
            callback(new Error('Not allowed by CORS')); // Reject the request
        }
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    credentials: true, // Allow credentials (optional)
};
// Enable CORS
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// app.use((req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     "script-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'"
//   );
//   next();
// });
// Admin authentication routes
// These routes will be prefixed with /api/admin
app.use("/api/admin", authRoutes_2.default); // This mounts adminAuthRoutes at /api/admin
// User authentication and other user-related routes
app.use("/api", authRoutes_1.default); // User auth routes (e.g., /api/auth/status, /api/request-otp)
app.use("/api", userRoutes_1.default); // User routes (e.g., /api/users)
app.use("/api", donationRoutes_1.default); // Donation routes (e.g., /api/donations)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
