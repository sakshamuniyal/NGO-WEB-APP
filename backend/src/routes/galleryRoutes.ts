import express from 'express';
import { getGalleryImages } from '../controllers/galleryController';

const router = express.Router();

router.get('/gallery', getGalleryImages);

export default router;
