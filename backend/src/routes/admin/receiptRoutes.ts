// backend\src\routes\admin\receiptRoutes.ts
import express from 'express';
import { manualReceipt } from '../../controllers/admin/receiptController';
import { protectAdmin } from '../../middleware/adminAuthMiddleware';

const router = express.Router();

router.use(protectAdmin);

router.post('/receipts/manual', manualReceipt);

export default router; 