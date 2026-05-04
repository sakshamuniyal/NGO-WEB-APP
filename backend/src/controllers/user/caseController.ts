import { Request, Response } from "express";
import prisma from "../../prisma"; // adjust import as needed

export const getAllCases = async (req: Request, res: Response) => {
  try {
    const cases = await prisma.case.findMany({
      where: { isActive: true }, // Only active/public cases
      orderBy: { createdAt: "desc" },
    });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cases" });
  }
};