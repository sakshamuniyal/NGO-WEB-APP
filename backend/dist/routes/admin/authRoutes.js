"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin/authRoutes.ts
const express_1 = __importDefault(require("express"));
const authController_1 = require("../../controllers/admin/authController");
const adminAuthMiddleware_1 = require("../../middleware/adminAuthMiddleware");
const router = express_1.default.Router();
router.post("/login", (req, res, next) => { console.log("Login route hit"); next(); }, authController_1.loginAdmin);
router.get("/auth/status", adminAuthMiddleware_1.protectAdmin, authController_1.getAdminStatus);
router.post("/logout", adminAuthMiddleware_1.protectAdmin, authController_1.logoutAdmin);
exports.default = router;
