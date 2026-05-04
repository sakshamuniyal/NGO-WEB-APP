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
// src/routes/admin/caseRoutes.ts
const express_1 = __importDefault(require("express"));
const caseController = __importStar(require("../../controllers/admin/caseController"));
const roleMiddleware_1 = require("../../middleware/roleMiddleware");
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
const router = express_1.default.Router();
// POST /admin/cases - Create a new case
router.post('/', (0, roleMiddleware_1.checkPermission)('create_case'), validationMiddleware_1.validateCaseCreate, async (req, res, next) => {
    try {
        if (!req.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const caseData = await caseController.createCase(req.body, req.admin.id);
        res.status(201).json(caseData);
    }
    catch (error) {
        next(error);
    }
});
// GET /admin/cases - Retrieve list of cases
router.get('/', (0, roleMiddleware_1.checkPermission)('view_cases'), async (req, res, next) => {
    try {
        const { typeOfCase, isActive, page = '1', limit = '10' } = req.query;
        const cases = await caseController.getCases({
            typeOfCase: typeOfCase,
            isActive: isActive ? (isActive === 'true') : undefined,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });
        res.json(cases);
    }
    catch (error) {
        next(error);
    }
});
// PUT /admin/cases/:id - Update a case
router.put('/:id', (0, roleMiddleware_1.checkPermission)('edit_case'), validationMiddleware_1.validateCaseUpdate, async (req, res, next) => {
    try {
        if (!req.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const updatedCase = await caseController.updateCase(id, req.body);
        if (!updatedCase)
            return res.status(404).json({ error: 'Case not found' });
        res.json(updatedCase);
    }
    catch (error) {
        next(error);
    }
});
// DELETE /admin/cases/:id - Delete a case
router.delete('/:id', (0, roleMiddleware_1.checkPermission)('delete_case'), async (req, res, next) => {
    try {
        if (!req.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const deleted = await caseController.deleteCase(id);
        if (!deleted)
            return res.status(404).json({ error: 'Case not found' });
        res.json({ message: 'Case deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
// GET /admin/cases/:id - Retrieve a specific case
router.get('/:id', (0, roleMiddleware_1.checkPermission)('view_cases'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const caseData = await caseController.getCaseById(id);
        if (!caseData)
            return res.status(404).json({ error: 'Case not found' });
        res.json(caseData);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
