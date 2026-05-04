import { Request, Response } from 'express';
import { lookupUser as lookupUserService, getAllAdmins, updateAdminRole, createAdmin, getAllRolesAndPermissions, updateAdminPermissions, deleteAdmin } from '../../services/admin/userAdminServices';
import { adminHasPermission } from '../../utils/adminPermissions';

function queryParamToString(value: Request['query'][string]): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export async function lookupUser(req: Request, res: Response) {
  const name = queryParamToString(req.query.name);
  const phoneNumber = queryParamToString(req.query.phoneNumber);
  const id = queryParamToString(req.query.id);

  if (!name && !phoneNumber && !id) {
    return res.status(400).json({ error: 'Provide at least one search parameter: name, phoneNumber, or id.' });
  }
  try {
    const users = await lookupUserService({ name, phoneNumber, id });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup user', details: error instanceof Error ? error.message : error });
  }
}

export async function getAllAdminsHandler(req: Request, res: Response) {
  if (!adminHasPermission(req.admin, 'view_admin')) {
    return res.status(403).json({ error: 'Missing permission: view_admin' });
  }
  try {
    const admins = await getAllAdmins();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins', details: error instanceof Error ? error.message : error });
  }
}

export async function updateAdminRoleHandler(req: Request, res: Response) {
  if (!adminHasPermission(req.admin, 'edit_admin')) {
    return res.status(403).json({ error: 'Missing permission: edit_admin' });
  }
  const { adminId, roleId } = req.body;
  if (!adminId || !roleId) {
    return res.status(400).json({ error: 'adminId and roleId are required.' });
  }
  try {
    const updated = await updateAdminRole(adminId, roleId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin role', details: error instanceof Error ? error.message : error });
  }
}

export async function createAdminHandler(req: Request, res: Response) {
  if (!adminHasPermission(req.admin, 'create_admin')) {
    return res.status(403).json({ error: 'Missing permission: create_admin' });
  }
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password || !roleId) {
    return res.status(400).json({ error: 'name, email, password, and roleId are required.' });
  }
  try {
    const created = await createAdmin({ name, email, password, roleId });
    res.json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin', details: error instanceof Error ? error.message : error });
  }
}

export async function getAllRolesAndPermissionsHandler(req: Request, res: Response) {
  if (!adminHasPermission(req.admin, 'edit_admin')) {
    return res.status(403).json({ error: 'Missing permission: edit_admin' });
  }
  try {
    const data = await getAllRolesAndPermissions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles/permissions', details: error instanceof Error ? error.message : error });
  }
}

export async function updateAdminPermissionsHandler(req: Request, res: Response) {
  if (!adminHasPermission(req.admin, 'edit_admin')) {
    return res.status(403).json({ error: 'Missing permission: edit_admin' });
  }
  const { adminId, roleId, permissionIds } = req.body;
  if (!adminId || !roleId || !Array.isArray(permissionIds)) {
    return res.status(400).json({ error: 'adminId, roleId, and permissionIds are required.' });
  }
  try {
    const updated = await updateAdminPermissions(adminId, roleId, permissionIds);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin permissions', details: error instanceof Error ? error.message : error });
  }
}

export async function deleteAdminHandler(req: Request, res: Response) {
  if (!adminHasPermission(req.admin, 'delete_admin')) {
    return res.status(403).json({ error: 'Missing permission: delete_admin' });
  }
  const { adminId } = req.body;
  if (!adminId) {
    return res.status(400).json({ error: 'adminId is required.' });
  }
  try {
    await deleteAdmin(adminId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete admin', details: error instanceof Error ? error.message : error });
  }
} 