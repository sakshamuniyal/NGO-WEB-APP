//backend\src\controllers\admin\receiptController.ts
import { Request, Response } from 'express';
import { generateAndSendReceipt } from '../../services/admin/receiptService';

export async function manualReceipt(req: Request, res: Response) {
  try {
    const { firstName, lastName, title, address, phoneNumber, pan, modeOfPayment, amount, createdAt, email } = req.body;
    if (!firstName || !title || !modeOfPayment || !amount || !createdAt || !email || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields (including phoneNumber).' });
    }
    const result = await generateAndSendReceipt({ firstName, lastName, title, address, phoneNumber, pan, modeOfPayment, amount, createdAt, email });
    res.json(result);
  } catch (error) {
    console.error('[manualReceipt] Error:', error);
    res.status(500).json({ error: 'Failed to generate/send receipt', details: error instanceof Error ? error.message : error });
  }
} 