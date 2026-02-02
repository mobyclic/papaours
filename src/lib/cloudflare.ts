import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { 
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET_NAME,
  CLOUDFLARE_R2_PUBLIC_URL
} from '$env/static/private';

const R2_ENDPOINT = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
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
      Bucket: CLOUDFLARE_R2_BUCKET_NAME || 'papaours',
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    const publicUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

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
      Bucket: CLOUDFLARE_R2_BUCKET_NAME || 'papaours',
      Key: key,
    });

    await s3Client.send(command);
    console.log('✅ File deleted from R2:', key);
  } catch (error) {
    console.error('❌ Delete failed:', error);
    throw new Error('Failed to delete file from Cloudflare R2');
  }
}

export interface CloudflareFile {
  key: string;
  filename: string;
  url: string;
  size: number;
  lastModified: Date;
  mimeType: string;
  type: 'photo' | 'video' | 'audio' | 'animation' | 'other';
}

function getMimeTypeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    // Animations
    'lottie': 'application/json',
    'json': 'application/json',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function getFileType(mimeType: string, key: string): CloudflareFile['type'] {
  if (mimeType.startsWith('image/')) {
    // Check for animated formats
    if (mimeType === 'image/gif' || key.includes('animation') || key.includes('lottie')) {
      return 'animation';
    }
    return 'photo';
  }
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (key.endsWith('.lottie') || (mimeType === 'application/json' && key.includes('animation'))) {
    return 'animation';
  }
  return 'other';
}

export interface ListFilesOptions {
  prefix?: string;
  type?: 'photo' | 'video' | 'audio' | 'animation' | 'other' | 'all';
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListFilesResult {
  files: CloudflareFile[];
  nextToken?: string;
  totalCount: number;
}

export async function listCloudflareFiles(options: ListFilesOptions = {}): Promise<ListFilesResult> {
  try {
    const { prefix = '', type = 'all', maxKeys = 100, continuationToken } = options;
    
    const command = new ListObjectsV2Command({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME || 'papaours',
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);
    const publicUrl = CLOUDFLARE_R2_PUBLIC_URL || '';

    const files: CloudflareFile[] = (response.Contents || [])
      .filter(obj => obj.Key && !obj.Key.endsWith('/')) // Exclude folders
      .map(obj => {
        const key = obj.Key!;
        const filename = key.split('/').pop() || key;
        const mimeType = getMimeTypeFromKey(key);
        const fileType = getFileType(mimeType, key);
        
        return {
          key,
          filename,
          url: `${publicUrl}/${key}`,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          mimeType,
          type: fileType,
        };
      })
      .filter(file => type === 'all' || file.type === type);

    return {
      files,
      nextToken: response.NextContinuationToken,
      totalCount: response.KeyCount || files.length,
    };
  } catch (error) {
    console.error('❌ List files failed:', error);
    throw new Error('Failed to list files from Cloudflare R2');
  }
}
