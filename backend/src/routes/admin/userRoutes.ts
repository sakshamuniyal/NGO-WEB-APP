import express from 'express';
import { lookupUser, getAllAdminsHandler, updateAdminRoleHandler, createAdminHandler, getAllRolesAndPermissionsHandler, updateAdminPermissionsHandler, deleteAdminHandler } from '../../controllers/admin/userController';
import { protectAdmin } from '../../middleware/adminAuthMiddleware';

const router = express.Router();

router.use(protectAdmin);

// GET /admin/users/lookup?name=...&phoneNumber=...&id=...
router.get('/users/lookup', lookupUser);

// GET /admin/admins - list all admins (superadmin only)
router.get('/admins', getAllAdminsHandler);

// POST /admin/admins - create new admin (superadmin only)
router.post('/admins', createAdminHandler);

// PUT /admin/admins/role - update admin role (superadmin only)
router.put('/admins/role', updateAdminRoleHandler);

// GET /admin/roles-permissions - get all roles and permissions
router.get('/roles-permissions', getAllRolesAndPermissionsHandler);

// PUT /admin/admins/permissions - update admin role and permissions
router.put('/admins/permissions', updateAdminPermissionsHandler);

// DELETE /admin/admins - delete admin (delete_admin permission required)
router.delete('/admins', deleteAdminHandler);

export default router; 