import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const CaseCreateSchema = z.object({
  patientName: z.string().min(1),
  age: z.coerce.number().int().positive(), // ⭐ Added .coerce ⭐
  nationality: z.string().min(1),
  typeOfCase: z.enum(['HEALTH', 'EDUCATION', 'OTHER']),
  description: z.string().min(1),
  targetAmount: z.coerce.number().positive(), // ⭐ Added .coerce ⭐
  // Allow explicit control of active status on create; default to true if omitted
  isActive: z.boolean().default(true),
  title: z.string().min(1), // Required for create
  // Add other fields from your input that are missing in the schema
  pdfUrls: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  videoUrls: z.array(z.string()).optional(),
  phoneNumber: z.string().optional(), // Assuming phone number is a string
  permanentAddress: z.string().optional(),
  currentAddress: z.string().optional(),
});

const CaseUpdateSchema = z.object({
  patientName: z.string().min(1).optional(),
  age: z.coerce.number().int().positive().optional(), // ⭐ Added .coerce ⭐
  nationality: z.string().min(1).optional(),
  typeOfCase: z.enum(['HEALTH', 'EDUCATION', 'OTHER']).optional(),
  description: z.string().min(1).optional(),
  targetAmount: z.coerce.number().positive().optional(), // ⭐ Added .coerce ⭐
  // Allow toggling active status when editing
  isActive: z.boolean().optional(),
  title: z.string().min(1).optional(), // Optional for update
  // Add other fields from your input that are missing in the schema
  pdfUrls: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  videoUrls: z.array(z.string()).optional(),
  phoneNumber: z.string().optional(),
  permanentAddress: z.string().optional(),
  currentAddress: z.string().optional(),
});

export const validateCaseCreate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // ⭐ CRITICAL FIX: Assign the parsed data back to req.body ⭐
    req.body = CaseCreateSchema.parse(req.body);
    next();
  } catch (error) {
    console.log("Validation error in validateCaseCreate:", req.body);
    console.error("Zod Errors:", (error as z.ZodError).errors);
    res.status(400).json({ error: (error as z.ZodError).errors });
  }
};

export const validateCaseUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // ⭐ CRITICAL FIX: Assign the parsed data back to req.body ⭐
    req.body = CaseUpdateSchema.parse(req.body); // Apply for update as well for consistency
    next();
  } catch (error) {
    console.log("Validation error in validateCaseUpdate:", req.body);
    console.error("Zod Errors:", (error as z.ZodError).errors);
    res.status(400).json({ error: (error as z.ZodError).errors });
  }
};
