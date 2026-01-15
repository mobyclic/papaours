import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ENDPOINT = `https://${import.meta.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function uploadToCloudflare(
  file: File,
  folder: string = 'quiz'
): Promise<UploadResult> {
  try {
    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: import.meta.env.CLOUDFLARE_R2_BUCKET_NAME || 'papaours',
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    const publicUrl = `${import.meta.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    return {
      url: publicUrl,
      key,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw new Error('Failed to upload file to Cloudflare R2');
  }
}

export async function deleteFromCloudflare(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: import.meta.env.CLOUDFLARE_R2_BUCKET_NAME || 'papaours',
      Key: key,
    });

    await s3Client.send(command);
    console.log('✅ File deleted from R2:', key);
  } catch (error) {
    console.error('❌ Delete failed:', error);
    throw new Error('Failed to delete file from Cloudflare R2');
  }
}
