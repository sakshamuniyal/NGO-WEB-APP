"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user/authRoutes.ts
const express_1 = __importDefault(require("express"));
const authController_1 = require("../../controllers/user/authController");
const router = express_1.default.Router();
router.get("/auth/status", authController_1.getAuthStatus);
router.post("/auth/logout", authController_1.logout);
router.post("/auth/request-otp", authController_1.requestOTP);
router.post("/auth/verify-otp", authController_1.handleVerifyOTP); // Updated to use handleVerifyOTP
exports.default = router;
