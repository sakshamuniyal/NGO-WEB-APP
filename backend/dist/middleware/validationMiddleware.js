"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCaseUpdate = exports.validateCaseCreate = void 0;
const zod_1 = require("zod");
const CaseCreateSchema = zod_1.z.object({
    patientName: zod_1.z.string().min(1),
    age: zod_1.z.coerce.number().int().positive(), // ⭐ Added .coerce ⭐
    nationality: zod_1.z.string().min(1),
    typeOfCase: zod_1.z.enum(['HEALTH', 'EDUCATION', 'OTHER']),
    description: zod_1.z.string().min(1),
    targetAmount: zod_1.z.coerce.number().positive(), // ⭐ Added .coerce ⭐
    title: zod_1.z.string().min(1), // Required for create
    // Add other fields from your input that are missing in the schema
    pdfUrls: zod_1.z.array(zod_1.z.string()).optional(),
    imageUrls: zod_1.z.array(zod_1.z.string()).optional(),
    videoUrls: zod_1.z.array(zod_1.z.string()).optional(),
    phoneNumber: zod_1.z.string().optional(), // Assuming phone number is a string
    permanentAddress: zod_1.z.string().optional(),
    currentAddress: zod_1.z.string().optional(),
});
const CaseUpdateSchema = zod_1.z.object({
    patientName: zod_1.z.string().min(1).optional(),
    age: zod_1.z.coerce.number().int().positive().optional(), // ⭐ Added .coerce ⭐
    nationality: zod_1.z.string().min(1).optional(),
    typeOfCase: zod_1.z.enum(['HEALTH', 'EDUCATION', 'OTHER']).optional(),
    description: zod_1.z.string().min(1).optional(),
    targetAmount: zod_1.z.coerce.number().positive().optional(), // ⭐ Added .coerce ⭐
    title: zod_1.z.string().min(1).optional(), // Optional for update
    // Add other fields from your input that are missing in the schema
    pdfUrls: zod_1.z.array(zod_1.z.string()).optional(),
    imageUrls: zod_1.z.array(zod_1.z.string()).optional(),
    videoUrls: zod_1.z.array(zod_1.z.string()).optional(),
    phoneNumber: zod_1.z.string().optional(),
    permanentAddress: zod_1.z.string().optional(),
    currentAddress: zod_1.z.string().optional(),
});
const validateCaseCreate = (req, res, next) => {
    try {
        // ⭐ CRITICAL FIX: Assign the parsed data back to req.body ⭐
        req.body = CaseCreateSchema.parse(req.body);
        next();
    }
    catch (error) {
        console.log("Validation error in validateCaseCreate:", req.body);
        console.error("Zod Errors:", error.errors);
        res.status(400).json({ error: error.errors });
    }
};
exports.validateCaseCreate = validateCaseCreate;
const validateCaseUpdate = (req, res, next) => {
    try {
        // ⭐ CRITICAL FIX: Assign the parsed data back to req.body ⭐
        req.body = CaseUpdateSchema.parse(req.body); // Apply for update as well for consistency
        next();
    }
    catch (error) {
        console.log("Validation error in validateCaseUpdate:", req.body);
        console.error("Zod Errors:", error.errors);
        res.status(400).json({ error: error.errors });
    }
};
exports.validateCaseUpdate = validateCaseUpdate;
