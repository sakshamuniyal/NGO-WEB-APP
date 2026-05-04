// In backend/src/routes/user/caseRoutes.ts (or similar)
import express from "express";
import { getAllCases } from "../../controllers/user/caseController";

const router = express.Router();

router.get("/cases", getAllCases);

export default router;