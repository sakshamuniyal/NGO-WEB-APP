// backend/src/controllers/admin/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AdminWithRolePrisma } from '../../types/admin';
import prisma from '../../prisma'; // ✅ Import your configured singleton


export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`[loginAdmin] Attempting login for email: ${email}`);
  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });
    if (!admin) {
      console.log(`[loginAdmin] Admin with email ${email} not found.`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      console.log(`[loginAdmin] Invalid password for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!process.env.JWT_SECRET) {
      console.error("[loginAdmin] JWT_SECRET is not defined!");
      return res.status(500).json({ error: 'Server configuration error.' });
    }
    const token = jwt.sign(
      { id: admin.id, email: admin.email, roleId: admin.roleId },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' } // Token expires in 8 hours for testing
    );

    // ⭐ CRITICAL FIX: Ensure 'secure' is false for HTTP localhost, and 'sameSite' is 'Lax' ⭐
    res.cookie('adminToken', token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie (good for security)
      secure: process.env.NODE_ENV === 'production', // ⭐ This will be false in development (HTTP) ⭐
      sameSite: 'none', // ⭐ 'Lax' typically works for cross-origin localhost (frontend on 5173, backend on 5001) ⭐
      maxAge: 8 * 60 * 60 * 1000, // Corresponding cookie maxAge (8 hours in milliseconds)
      path: '/', // Make cookie available to all paths on the domain
    });
    console.log(`[loginAdmin] Admin ${admin.id} logged in successfully, cookie set. Token expires in 8h. Cookie secure: ${process.env.NODE_ENV === 'production'}, sameSite: Lax.`);
    res.json({ admin });
  } catch (error) {
    console.error('[loginAdmin] Login failed due to server error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getAdminStatus = async (req: Request, res: Response) => {
  console.log(`[getAdminStatus] Entering controller. req.admin is:`, req.admin ? 'Defined' : 'Undefined');
  try {
    const admin = req.admin as AdminWithRolePrisma;

    if (!admin) {
      console.log("[getAdminStatus] No admin object on request, returning unauthenticated.");
      return res.status(200).json({ isLoggedIn: false, admin: null });
    }

    console.log(`[getAdminStatus] Admin ${admin.id} found on request, returning authenticated.`);
    res.status(200).json({ isLoggedIn: true, admin });
  } catch (error) {
    console.error('[getAdminStatus] Error fetching admin status:', error);
    res.status(500).json({ error: 'Failed to fetch admin status' });
  }
};

export const logoutAdmin = async (req: Request, res: Response) => {
  console.log('[logoutAdmin] Attempting admin logout.');
  try {
    // Ensure clearCookie uses the same options as setCookie (except maxAge/expires)
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    console.log('[logoutAdmin] Admin token cookie cleared.');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[logoutAdmin] Logout failed due to server error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};
