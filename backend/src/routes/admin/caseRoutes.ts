// backend\src\routes\admin\caseRoutes.ts

import express, { Request, Response, NextFunction } from 'express';
import * as caseController from '../../controllers/admin/caseController';
import { checkPermission } from '../../middleware/roleMiddleware'; // Assumes this populates req.admin.role.permissions
import { protectAdmin } from '../../middleware/adminAuthMiddleware'; // Ensure this is imported correctly
import { AdminWithRolePrisma } from '../../types/admin'; // For req.admin type assertion, assuming this type is correct
import { validateCaseCreate, validateCaseUpdate } from '../../middleware/validationMiddleware'; // Import your validation middleware


const router = express.Router();

// Common middleware for all routes in this router that need admin protection
router.use(protectAdmin); // Apply protectAdmin to all routes in this router

// Middleware for request body validation (You would define these in validationMiddleware.ts)
// For simplicity, these are commented out. Re-enable with actual Zod validation if you have it.
// import { validateCaseCreate, validateCaseUpdate } from '../../middleware/validationMiddleware';


// POST /admin/cases - Create a new case
router.post(
  '/cases',
  checkPermission('create_case'),
  validateCaseCreate, // Re-enable if you have a Zod/Joi validation middleware
  caseController.createCase
);

// GET /admin/cases - Retrieve list of cases
router.get(
  '/cases',
  checkPermission('view_cases'),
  caseController.getCases
);

// PUT /admin/cases/:id - Update a case
router.put(
  '/cases/:id',
  checkPermission('edit_case'),
  validateCaseUpdate, // Re-enable if you have a Zod/Joi validation middleware
  caseController.updateCase
);

// DELETE /admin/cases/:id - Delete a case
router.delete(
  '/cases/:id',
  checkPermission('delete_case'),
  caseController.deleteCase
);

// GET /admin/cases/:id - Retrieve a specific case
router.get(
  '/cases/:id',
  checkPermission('view_cases'),
  caseController.getCaseById
);

export default router;
