import { Request, Response } from 'express';
import { listGalleryImagesFromS3 } from '../services/admin/uploadService';

export async function getGalleryImages(_req: Request, res: Response) {
  try {
    const items = await listGalleryImagesFromS3();
    res.json({ items });
  } catch (error) {
    console.error('[gallery] getGalleryImages:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Gallery unavailable.',
      items: [],
    });
  }
}
