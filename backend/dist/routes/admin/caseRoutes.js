"use strict";
// backend\src\routes\admin\caseRoutes.ts
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
const express_1 = __importDefault(require("express"));
const caseController = __importStar(require("../../controllers/admin/caseController"));
const roleMiddleware_1 = require("../../middleware/roleMiddleware"); // Assumes this populates req.admin.role.permissions
const adminAuthMiddleware_1 = require("../../middleware/adminAuthMiddleware"); // Ensure this is imported correctly
const validationMiddleware_1 = require("../../middleware/validationMiddleware"); // Import your validation middleware
const router = express_1.default.Router();
// Common middleware for all routes in this router that need admin protection
router.use(adminAuthMiddleware_1.protectAdmin); // Apply protectAdmin to all routes in this router
// Middleware for request body validation (You would define these in validationMiddleware.ts)
// For simplicity, these are commented out. Re-enable with actual Zod validation if you have it.
// import { validateCaseCreate, validateCaseUpdate } from '../../middleware/validationMiddleware';
// POST /admin/cases - Create a new case
router.post('/cases', (0, roleMiddleware_1.checkPermission)('create_case'), validationMiddleware_1.validateCaseCreate, // Re-enable if you have a Zod/Joi validation middleware
caseController.createCase);
// GET /admin/cases - Retrieve list of cases
router.get('/cases', (0, roleMiddleware_1.checkPermission)('view_cases'), caseController.getCases);
// PUT /admin/cases/:id - Update a case
router.put('/cases/:id', (0, roleMiddleware_1.checkPermission)('edit_case'), validationMiddleware_1.validateCaseUpdate, // Re-enable if you have a Zod/Joi validation middleware
caseController.updateCase);
// DELETE /admin/cases/:id - Delete a case
router.delete('/cases/:id', (0, roleMiddleware_1.checkPermission)('delete_case'), caseController.deleteCase);
// GET /admin/cases/:id - Retrieve a specific case
router.get('/cases/:id', (0, roleMiddleware_1.checkPermission)('view_cases'), caseController.getCaseById);
exports.default = router;
