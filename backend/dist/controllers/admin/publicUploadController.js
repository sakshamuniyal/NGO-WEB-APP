"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPublicFile = void 0;
const uploadService_1 = require("../../services/admin/uploadService"); // Import the public specific function
// Controller to handle a single public file upload
const uploadPublicFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const { file } = req;
    const { folder } = req.body; // Expect a 'folder' field from frontend (e.g., 'cases/{caseId}/pdf')
    if (!folder) {
        return res.status(400).json({ message: 'Subfolder (e.g., "cases/{caseId}/pdf") is required for upload.' });
    }
    // Allow folders like cases/{caseId}/pdf, cases/{caseId}/images, cases/{caseId}/videos
    const folderPattern = /^cases\/[a-f0-9\-]+\/(pdf|images|videos)$/;
    if (!folderPattern.test(folder)) {
        return res.status(400).json({ message: 'Invalid public subfolder specified. Must be cases/{caseId}/pdf, cases/{caseId}/images, or cases/{caseId}/videos.' });
    }
    try {
        const fileUrl = await (0, uploadService_1.uploadPublicFileToS3)(file.buffer, file.mimetype, file.originalname, folder // This is the subfolder, 'public/' is added by the service
        );
        res.status(200).json({ message: 'File uploaded successfully', fileUrl });
    }
    catch (error) {
        console.error("Error in uploadPublicFile controller:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during public file upload.";
        res.status(500).json({ message: errorMessage });
    }
};
exports.uploadPublicFile = uploadPublicFile;
