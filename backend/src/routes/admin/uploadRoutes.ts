// backend/src/routes/admin/uploadRoutes.ts
import express from 'express';
import multer from 'multer';
import { protectAdmin } from '../../middleware/adminAuthMiddleware';
// ⭐ Import the new public and private controllers ⭐
import { uploadPublicFile } from '../../controllers/admin/publicUploadController';
import { uploadPrivateFile } from '../../controllers/admin/privateUploadController';


const router = express.Router();

// Configure Multer for in-memory storage (file buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // Increased limit to 150MB for videos (adjust as needed)
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', // Images
      'application/pdf', // PDFs
      'video/mp4', 'video/quicktime', 'video/webm' // Videos
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedMimes.map(m => m.split('/')[1]).join(', ')}`));
    }
  },
});

// ⭐ NEW ROUTE for PUBLIC file uploads ⭐
// This will be used for case files, website images/videos
router.post('/upload/public', protectAdmin, upload.single('file'), uploadPublicFile);

// ⭐ NEW ROUTE for PRIVATE file uploads ⭐
// This will be used for donation receipts
router.post('/upload/private', protectAdmin, upload.single('file'), uploadPrivateFile);

export default router;
