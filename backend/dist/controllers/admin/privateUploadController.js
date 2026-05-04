"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPrivateFile = void 0;
const uploadService_1 = require("../../services/admin/uploadService"); // Import the private specific function
// Controller to handle a single private file upload
const uploadPrivateFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const { file } = req;
    const { folder } = req.body; // Expect a 'folder' field from frontend (e.g., 'donation-receipts')
    if (!folder) {
        return res.status(400).json({ message: 'Subfolder (e.g., "donation-receipts") is required for upload.' });
    }
    // Basic validation for allowed private subfolders
    const allowedPrivateSubfolders = ['donation-receipts']; // Add other private subfolders as needed
    if (!allowedPrivateSubfolders.includes(folder)) {
        return res.status(400).json({ message: 'Invalid private subfolder specified.' });
    }
    try {
        const fileUrl = await (0, uploadService_1.uploadPrivateFileToS3)(file.buffer, file.mimetype, file.originalname, folder // This is the subfolder, 'private/' is added by the service
        );
        res.status(200).json({ message: 'File uploaded successfully', fileUrl });
    }
    catch (error) {
        console.error("Error in uploadPrivateFile controller:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during private file upload.";
        res.status(500).json({ message: errorMessage });
    }
};
exports.uploadPrivateFile = uploadPrivateFile;
