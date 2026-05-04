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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCaseById = exports.deleteCase = exports.updateCase = exports.createCase = exports.getCases = void 0;
const caseService = __importStar(require("../../services/admin/caseService"));
// GET /api/admin/cases - Retrieve list of cases
const getCases = async (req, res, next) => {
    try {
        const { typeOfCase, isActive, page, limit } = req.query;
        const filters = {
            typeOfCase: typeOfCase,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        };
        const cases = await caseService.getAdminCases(filters);
        res.json(cases); // This will be array of backend's 'Case' type
    }
    catch (error) {
        next(error);
    }
};
exports.getCases = getCases;
// POST /api/admin/cases - Create a new case
const createCase = async (req, res, next) => {
    try {
        const admin = req.admin;
        if (!admin) {
            // This should ideally be caught by protectAdmin middleware, but good for type safety
            return res.status(401).json({ error: 'Unauthorized: Admin not found' });
        }
        const caseData = req.body; // Use backend's CaseCreateInput type
        const newCase = await caseService.createCase(caseData, admin.id); // Pass adminId
        res.status(201).json(newCase); // This will be backend's 'Case' type
    }
    catch (error) {
        next(error);
    }
};
exports.createCase = createCase;
// PUT /api/admin/cases/:id - Update a case
const updateCase = async (req, res, next) => {
    try {
        const { id } = req.params;
        const caseData = req.body; // Use backend's CaseUpdateInput type
        const updatedCase = await caseService.updateCase(id, caseData);
        if (!updatedCase) {
            return res.status(404).json({ error: 'Case not found' });
        }
        res.json(updatedCase); // This will be backend's 'Case' type
    }
    catch (error) {
        next(error);
    }
};
exports.updateCase = updateCase;
// DELETE /api/admin/cases/:id - Delete a case
const deleteCase = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await caseService.deleteCase(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Case not found or could not be deleted' });
        }
        res.json({ message: 'Case deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCase = deleteCase;
// GET /api/admin/cases/:id - Retrieve a specific case
const getCaseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const caseData = await caseService.getCaseById(id);
        if (!caseData) {
            return res.status(404).json({ error: 'Case not found' });
        }
        res.json(caseData); // This will be backend's 'Case' type
    }
    catch (error) {
        next(error);
    }
};
exports.getCaseById = getCaseById;
