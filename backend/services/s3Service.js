import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize S3 client - credentials from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

/**
 * Generate a unique file name with original extension
 */
const generateFileName = (originalName) => {
  const extension = originalName.split('.').pop();
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `notes/${timestamp}-${uniqueId}.${extension}`;
};

/**
 * Upload a file buffer to S3
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalName - Original file name (for extension)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<{key: string, url: string}>}
 */
export const uploadFile = async (fileBuffer, originalName, contentType) => {
  try {
    const key = generateFileName(originalName);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    });

    await s3Client.send(command);

    // Generate the public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { key, url };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Upload base64 encoded image to S3
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {string} fileName - Original file name
 * @returns {Promise<{key: string, url: string}>}
 */
export const uploadBase64Image = async (base64Data, fileName = 'image.jpg') => {
  try {
    // Remove data URI prefix if present
    let imageData = base64Data;
    let contentType = 'image/jpeg';

    if (base64Data.includes('data:')) {
      const matches = base64Data.match(/data:([^;]+);base64,(.+)/);
      if (matches) {
        contentType = matches[1];
        imageData = matches[2];
      }
    }

    const buffer = Buffer.from(imageData, 'base64');
    return await uploadFile(buffer, fileName, contentType);
  } catch (error) {
    console.error('Base64 Upload Error:', error);
    throw new Error('Failed to upload base64 image');
  }
};

/**
 * Get a signed URL for temporary access to a private object
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
export const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Signed URL Error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Upload multiple files to S3
 * @param {Array<{buffer: Buffer, originalName: string, contentType: string}>} files
 * @returns {Promise<Array<{key: string, url: string}>>}
 */
export const uploadMultipleFiles = async (files) => {
  try {
    const uploadPromises = files.map(file =>
      uploadFile(file.buffer, file.originalName, file.contentType)
    );

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple Upload Error:', error);
    throw new Error('Failed to upload files');
  }
};

export default {
  uploadFile,
  uploadBase64Image,
  getSignedDownloadUrl,
  deleteFile,
  uploadMultipleFiles
};
