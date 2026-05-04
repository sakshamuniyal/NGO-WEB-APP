"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCaseUpdate = exports.validateCaseCreate = void 0;
const zod_1 = require("zod");
const CaseCreateSchema = zod_1.z.object({
    patientName: zod_1.z.string().min(1),
    age: zod_1.z.number().int().positive(),
    nationality: zod_1.z.string().min(1),
    typeOfCase: zod_1.z.enum(['HEALTH', 'EDUCATION', 'OTHER']),
    description: zod_1.z.string().min(1),
    targetAmount: zod_1.z.number().positive(),
});
const CaseUpdateSchema = zod_1.z.object({
    patientName: zod_1.z.string().min(1).optional(),
    age: zod_1.z.number().int().positive().optional(),
    nationality: zod_1.z.string().min(1).optional(),
    typeOfCase: zod_1.z.enum(['HEALTH', 'EDUCATION', 'OTHER']).optional(),
    description: zod_1.z.string().min(1).optional(),
    targetAmount: zod_1.z.number().positive().optional(),
});
const validateCaseCreate = (req, res, next) => {
    try {
        CaseCreateSchema.parse(req.body);
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.errors });
    }
};
exports.validateCaseCreate = validateCaseCreate;
const validateCaseUpdate = (req, res, next) => {
    try {
        CaseUpdateSchema.parse(req.body);
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.errors });
    }
};
exports.validateCaseUpdate = validateCaseUpdate;
