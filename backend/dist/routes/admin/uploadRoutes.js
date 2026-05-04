"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/admin/uploadRoutes.ts
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const adminAuthMiddleware_1 = require("../../middleware/adminAuthMiddleware");
// ⭐ Import the new public and private controllers ⭐
const publicUploadController_1 = require("../../controllers/admin/publicUploadController");
const privateUploadController_1 = require("../../controllers/admin/privateUploadController");
const router = express_1.default.Router();
// Configure Multer for in-memory storage (file buffer)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
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
        }
        else {
            cb(new Error(`Invalid file type. Allowed: ${allowedMimes.map(m => m.split('/')[1]).join(', ')}`));
        }
    },
});
// ⭐ NEW ROUTE for PUBLIC file uploads ⭐
// This will be used for case files, website images/videos
router.post('/upload/public', adminAuthMiddleware_1.protectAdmin, upload.single('file'), publicUploadController_1.uploadPublicFile);
// ⭐ NEW ROUTE for PRIVATE file uploads ⭐
// This will be used for donation receipts
router.post('/upload/private', adminAuthMiddleware_1.protectAdmin, upload.single('file'), privateUploadController_1.uploadPrivateFile);
exports.default = router;
