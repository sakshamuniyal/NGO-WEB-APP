// src/routes/user/authRoutes.ts
import express from "express";
import { getAuthStatus, logout, requestOTP, handleVerifyOTP } from "../../controllers/user/authController";

const router = express.Router();

router.get("/auth/status", getAuthStatus);
router.post("/auth/logout", logout);
router.post("/auth/request-otp", requestOTP);
router.post("/auth/verify-otp", handleVerifyOTP); // Updated to use handleVerifyOTP

export default router;