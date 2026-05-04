import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';

import userAuthRoutes from './routes/user/authRoutes';
import userRoutes from './routes/user/userRoutes';
import donationRoutes from './routes/user/donationRoutes'; // User-facing donation routes
import adminAuthRoutes from './routes/admin/authRoutes';
import adminCaseRoutes from './routes/admin/caseRoutes';
import adminDonationRoutes from './routes/admin/donationRoutes'; // Admin-facing donation routes
import uploadRoutes from './routes/admin/uploadRoutes'; // File upload routes
import cors from 'cors';
import cookieParser from 'cookie-parser';
import adminUserRoutes from './routes/admin/userRoutes';
import adminReceiptRoutes from './routes/admin/receiptRoutes';
import caseRoutes from "./routes/user/caseRoutes";
import contactRoutes from './routes/contactRoutes';
import galleryRoutes from './routes/galleryRoutes';


const app = express();

const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:5001'];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    console.log(`[CORS Check] Incoming Origin: ${origin}`);
    console.log(`[CORS Check] Allowed List: ${allowedOrigins.join(', ')}`);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({
  verify: (req, _res, buf) => {
    // Keep a copy of the raw payload so payment webhooks can verify signatures.
    (req as Request & { rawBody?: string }).rawBody = buf.toString();
  },
})); // Parses incoming JSON requests
app.use(cookieParser()); // Parses cookies from incoming requests

// General purpose request logger - placed very early to catch all incoming requests
app.use((req, res, next) => {
  console.log(`[Global Request Logger] ${req.method} ${req.originalUrl} - Headers: ${JSON.stringify(req.headers.cookie)}`);
  next();
});

// CSP Header - important for browser security
app.use((req, res, next) => {
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.BACKEND_URL
    : 'http://localhost:5001';

  res.setHeader(
    "Content-Security-Policy",
    `script-src 'self' https://www.google.com https://www.gstatic.com; connect-src 'self' ${backendUrl} https://www.google.com; frame-src https://www.google.com; object-src 'none'`
  );
  next();
});

// Base route for Vercel health checks and environment verification
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'NGO-WEB-APP Backend API',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});
// Register ADMIN-SPECIFIC routes first to ensure they take precedence for '/api/admin/*' paths
app.use("/api/admin", adminAuthRoutes);
console.log("Registered /api/admin auth routes.");

app.use("/api/admin", adminCaseRoutes);
console.log("Registered /api/admin case routes.");

app.use('/api/admin', uploadRoutes)

app.use("/api/admin", adminDonationRoutes); // This should catch /api/admin/donations
console.log("Registered /api/admin donation routes.");

app.use('/admin', adminUserRoutes);
app.use('/admin', adminReceiptRoutes);

// Register USER-RELATED routes AFTER admin routes
app.use("/api", userAuthRoutes);
console.log("Registered /api userAuthRoutes.");

app.use("/api", caseRoutes);


app.use("/api", userRoutes);
console.log("Registered /api userRoutes.");

app.use("/api", donationRoutes); // This will catch /api/donations (user-facing)
console.log("Registered /api donationRoutes (user).");

app.use("/api", contactRoutes);
console.log("Registered /api contactRoutes.");

app.use("/api", galleryRoutes);
console.log("Registered /api galleryRoutes.");

// Fallback for unhandled routes - if a request makes it here, it means no route matched
app.use((req, res) => {
  console.warn(`[Global 404 Handler] Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl} - Route Not Found.` });
});

// ⭐ Comprehensive Error Handling Middleware - MUST be the LAST middleware ⭐
// This catches errors thrown by any middleware or route handler above.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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


if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Backend initialization complete.');
  });
}

export default app;