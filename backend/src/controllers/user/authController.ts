// src/controllers/user/authController.ts
import { Request, Response } from "express";
import { sendOTPRequest, verifyOTP } from "../../services/user/authService";
import jwt from "jsonwebtoken";
import prisma from '../../prisma'; 

export const getAuthStatus = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ isLoggedIn: false, user: null });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; phoneNumber: string; isProfileComplete: boolean; email?: string };
    const userFromDb = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { address: true },
    });

    if (userFromDb) {
      res.json({
        isLoggedIn: true,
        user: {
          id: userFromDb.id,
          phoneNumber: userFromDb.phoneNumber,
          firstName: userFromDb.firstName,
          lastName: userFromDb.lastName,
          companyName: userFromDb.companyName,
          email: userFromDb.email,
          panCard: userFromDb.panCard,
          createdAt: userFromDb.createdAt.toISOString(),
          updatedAt: userFromDb.updatedAt.toISOString(),
          address: userFromDb.address,
          isProfileComplete: decoded.isProfileComplete,
        },
      });
    } else {
      res.json({ isLoggedIn: false, user: null });
    }
  } catch (e) {
    console.error("JWT verification or user fetch failed for /status:", e);
    res.clearCookie("token", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    res.json({ isLoggedIn: false, user: null });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  res.status(200).json({ message: "Logged out successfully" });
};

export const requestOTP = async (req: Request, res: Response) => {
  const { fullPhoneNumber } = req.body;
  if (!fullPhoneNumber) {
    return res.status(400).json({ message: "Phone number is required." });
  }
  try {
    await sendOTPRequest(fullPhoneNumber);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Something went wrong while requesting OTP." });
  }
};

export const handleVerifyOTP = async (req: Request, res: Response) => {
  const { fullPhoneNumber, otp } = req.body;
  if (!fullPhoneNumber || !otp) {
    return res.status(400).json({ message: "Phone number and OTP are required." });
  }
  try {
    const result = await verifyOTP(fullPhoneNumber, otp, res); // Added res parameter
    res.status(200).json({
      message: "OTP verified successfully",
      isNewUser: result.isNewUser,
      isProfileComplete: result.isProfileComplete,
      user: result.user,
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid OTP or server error." });
  }
};