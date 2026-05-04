// src/routes/admin/authRoutes.ts
import express from 'express';
import { loginAdmin, getAdminStatus, logoutAdmin } from '../../controllers/admin/authController';
import { protectAdmin } from '../../middleware/adminAuthMiddleware';

const router = express.Router();

router.post("/login", (req, res, next) => { console.log("Login route hit"); next(); }, loginAdmin);
router.get("/auth/status", protectAdmin, getAdminStatus);
router.post("/logout", protectAdmin, logoutAdmin);

export default router;