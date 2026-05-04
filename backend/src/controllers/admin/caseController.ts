import { Request, Response, NextFunction } from 'express';
import * as caseService from '../../services/admin/caseService';
import { CaseType, CaseCreateInput, CaseUpdateInput, AdminWithRolePrisma } from '../../types/admin';
import { adminHasPermission } from '../../utils/adminPermissions';

// GET /api/admin/cases - Retrieve list of cases
export const getCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.admin as AdminWithRolePrisma;
    if (!adminHasPermission(admin, 'view_cases')) {
      return res.status(403).json({ error: 'Missing permission: view_cases' });
    }
    const { typeOfCase, isActive, page, limit } = req.query;

    const filters = {
      typeOfCase: typeOfCase as CaseType | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    };

    const cases = await caseService.getAdminCases(filters);
    res.json(cases); // This will be array of backend's 'Case' type
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/cases - Create a new case
export const createCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.admin as AdminWithRolePrisma;
    if (!admin) {
      // This should ideally be caught by protectAdmin middleware, but good for type safety
      return res.status(401).json({ error: 'Unauthorized: Admin not found' });
    }
    if (!adminHasPermission(admin, 'create_case')) {
      return res.status(403).json({ error: 'Missing permission: create_case' });
    }
    const caseData: CaseCreateInput = req.body; // Use backend's CaseCreateInput type

    const newCase = await caseService.createCase(caseData, admin.id); // Pass adminId
    res.status(201).json(newCase); // This will be backend's 'Case' type
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/cases/:id - Update a case
export const updateCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.admin as AdminWithRolePrisma;
    if (!adminHasPermission(admin, 'edit_case')) {
      return res.status(403).json({ error: 'Missing permission: edit_case' });
    }
    const { id } = req.params;
    const caseData: CaseUpdateInput = req.body; // Use backend's CaseUpdateInput type

    const updatedCase = await caseService.updateCase(id, caseData);
    if (!updatedCase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(updatedCase); // This will be backend's 'Case' type
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/cases/:id - Delete a case
export const deleteCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.admin as AdminWithRolePrisma;
    if (!adminHasPermission(admin, 'delete_case')) {
      return res.status(403).json({ error: 'Missing permission: delete_case' });
    }
    const { id } = req.params;
    const deleted = await caseService.deleteCase(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Case not found or could not be deleted' });
    }
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/cases/:id - Retrieve a specific case
export const getCaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.admin as AdminWithRolePrisma;
    if (!adminHasPermission(admin, 'view_cases')) {
      return res.status(403).json({ error: 'Missing permission: view_cases' });
    }
    const { id } = req.params;
    const caseData = await caseService.getCaseById(id);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseData); // This will be backend's 'Case' type
  } catch (error) {
    next(error);
  }
};
