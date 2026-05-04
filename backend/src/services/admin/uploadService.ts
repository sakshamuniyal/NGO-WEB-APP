// backend/src/services/admin/uploadService.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // Not directly used in upload, but useful for private file access

const AWS_REGION = process.env.AWS_REGION!;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const generateS3Url = (key: string) => `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

/**
 * Uploads a file to the 'public/' prefix in S3.
 * These files are expected to be publicly readable based on bucket policy.
 * @param fileBuffer The file content as a Buffer.
 * @param mimetype The MIME type of the file (e.g., 'image/jpeg', 'application/pdf').
 * @param originalFilename The original filename (used for extension).
 * @param subfolder The subfolder within 'public/' (e.g., 'cases/pdfs', 'website/images').
 * @returns The public URL of the uploaded file.
 */
export const uploadPublicFileToS3 = async (
  fileBuffer: Buffer,
  mimetype: string,
  originalFilename: string,
  subfolder: string
): Promise<string> => {
  const fileExtension = originalFilename.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const s3Key = `public/${subfolder}/${uniqueFileName}`; // Explicitly public path

  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    console.log(`Public file uploaded successfully to S3: ${generateS3Url(s3Key)}`);
    return generateS3Url(s3Key);
  } catch (error) {
    console.error('Error uploading public file to S3:', error);
    throw new Error('Failed to upload public file to S3.');
  }
};

/**
 * Uploads a file to the 'private/' prefix in S3.
 * These files are expected to be private and require authentication/pre-signed URLs for access.
 * @param fileBuffer The file content as a Buffer.
 * @param mimetype The MIME type of the file.
 * @param originalFilename The original filename.
 * @param subfolder The subfolder within 'private/' (e.g., 'donation-receipts').
 * @returns The full S3 URL of the uploaded private file (for internal storage/tracking).
 */
export const uploadPrivateFileToS3 = async (
  fileBuffer: Buffer,
  mimetype: string,
  originalFilename: string,
  subfolder: string
): Promise<string> => {
  const fileExtension = originalFilename.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const s3Key = `private/${subfolder}/${uniqueFileName}`; // Explicitly private path

  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    console.warn(`Private file uploaded successfully to S3: ${generateS3Url(s3Key)}. Direct access requires pre-signed URL.`);
    return generateS3Url(s3Key); // Store full URL in database
  } catch (error) {
    console.error('Error uploading private file to S3:', error);
    throw new Error('Failed to upload private file to S3.');
  }
};

/**
 * Generates a temporary secure URL for a private S3 file.
 * @param s3Url The full S3 URL stored in the database.
 * @param expiresIn Time in seconds (default 3600 = 1 hour).
 */
export const getPrivateFileUrl = async (s3Url: string, expiresIn = 3600): Promise<string> => {
  if (!s3Url) return '';

  // Extract the Key from the full URL
  // Example: https://bucket.s3.region.amazonaws.com/private/receipts/file.pdf
  // We need: private/receipts/file.pdf
  const urlParts = s3Url.split('.com/');
  const key = urlParts[1];

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw new Error('Could not generate secure access link.');
  }
};

const GALLERY_IMAGE_KEY = /\.(jpe?g|png|gif|webp|avif)$/i;

export type GalleryListItem = { key: string; url: string };

/**
 * Lists image objects under the gallery prefix (default: public/gallery/).
 * URLs are pre-signed GET links by default so private buckets work; set AWS_S3_GALLERY_PRESIGN=false for direct public URLs.
 */
export const listGalleryImagesFromS3 = async (): Promise<GalleryListItem[]> => {
  if (!AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('[gallery] S3 credentials or bucket not configured; returning empty gallery.');
    return [];
  }

  const prefix = process.env.AWS_S3_GALLERY_PREFIX || 'public/gallery/';
  const usePresign = process.env.AWS_S3_GALLERY_PRESIGN !== 'false';
  const expiresIn = Number(process.env.AWS_S3_GALLERY_URL_TTL_SEC) || 3600;
  const maxTotal = Math.min(Number(process.env.AWS_S3_GALLERY_MAX_KEYS) || 200, 1000);

  const items: GalleryListItem[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: AWS_S3_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: Math.min(500, maxTotal),
        ContinuationToken: continuationToken,
      });
      const page = await s3Client.send(listCommand);
      const contents = page.Contents ?? [];

      for (const obj of contents) {
        if (items.length >= maxTotal) break;
        if (!obj.Key || obj.Key.endsWith('/')) continue;
        if (!GALLERY_IMAGE_KEY.test(obj.Key)) continue;

        const url = usePresign
          ? await getSignedUrl(
              s3Client,
              new GetObjectCommand({ Bucket: AWS_S3_BUCKET_NAME, Key: obj.Key }),
              { expiresIn }
            )
          : generateS3Url(obj.Key);

        items.push({ key: obj.Key, url });
      }

      continuationToken =
        page.IsTruncated && items.length < maxTotal ? page.NextContinuationToken : undefined;
    } while (continuationToken);

    return items.sort((a, b) => a.key.localeCompare(b.key));
  } catch (error) {
    console.error('[gallery] Failed to list S3 objects:', error);
    throw new Error('Could not load gallery from storage.');
  }
};
