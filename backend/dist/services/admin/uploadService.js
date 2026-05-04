"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPrivateFileToS3 = exports.uploadPublicFileToS3 = void 0;
// backend/src/services/admin/uploadService.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // Not directly used in upload, but useful for private file access
const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const s3Client = new client_s3_1.S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const generateS3Url = (key) => `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
/**
 * Uploads a file to the 'public/' prefix in S3.
 * These files are expected to be publicly readable based on bucket policy.
 * @param fileBuffer The file content as a Buffer.
 * @param mimetype The MIME type of the file (e.g., 'image/jpeg', 'application/pdf').
 * @param originalFilename The original filename (used for extension).
 * @param subfolder The subfolder within 'public/' (e.g., 'cases/pdfs', 'website/images').
 * @returns The public URL of the uploaded file.
 */
const uploadPublicFileToS3 = async (fileBuffer, mimetype, originalFilename, subfolder) => {
    const fileExtension = originalFilename.split('.').pop();
    const uniqueFileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
    const s3Key = `public/${subfolder}/${uniqueFileName}`; // Explicitly public path
    const params = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
    };
    try {
        const command = new client_s3_1.PutObjectCommand(params);
        await s3Client.send(command);
        console.log(`Public file uploaded successfully to S3: ${generateS3Url(s3Key)}`);
        return generateS3Url(s3Key);
    }
    catch (error) {
        console.error('Error uploading public file to S3:', error);
        throw new Error('Failed to upload public file to S3.');
    }
};
exports.uploadPublicFileToS3 = uploadPublicFileToS3;
/**
 * Uploads a file to the 'private/' prefix in S3.
 * These files are expected to be private and require authentication/pre-signed URLs for access.
 * @param fileBuffer The file content as a Buffer.
 * @param mimetype The MIME type of the file.
 * @param originalFilename The original filename.
 * @param subfolder The subfolder within 'private/' (e.g., 'donation-receipts').
 * @returns The full S3 URL of the uploaded private file (for internal storage/tracking).
 */
const uploadPrivateFileToS3 = async (fileBuffer, mimetype, originalFilename, subfolder) => {
    const fileExtension = originalFilename.split('.').pop();
    const uniqueFileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
    const s3Key = `private/${subfolder}/${uniqueFileName}`; // Explicitly private path
    const params = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
    };
    try {
        const command = new client_s3_1.PutObjectCommand(params);
        await s3Client.send(command);
        console.warn(`Private file uploaded successfully to S3: ${generateS3Url(s3Key)}. Direct access requires pre-signed URL.`);
        return generateS3Url(s3Key); // Store full URL in database
    }
    catch (error) {
        console.error('Error uploading private file to S3:', error);
        throw new Error('Failed to upload private file to S3.');
    }
};
exports.uploadPrivateFileToS3 = uploadPrivateFileToS3;
