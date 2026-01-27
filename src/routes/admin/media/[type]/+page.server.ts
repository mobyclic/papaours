import type { ServerLoadEvent } from "@sveltejs/kit";
import { listCloudflareFiles, type CloudflareFile } from "$lib/cloudflare";

const TYPE_MAP: Record<string, CloudflareFile['type']> = {
  'photos': 'photo',
  'photo': 'photo',
  'vidéo': 'video',
  'video': 'video',
  'audio': 'audio',
  'animations': 'animation',
  'animation': 'animation',
};

const TYPE_LABELS: Record<string, string> = {
  'photo': 'Photos',
  'video': 'Vidéos',
  'audio': 'Audio',
  'animation': 'Animations',
};

export const load = async ({ params }: ServerLoadEvent) => {
  const typeSlug = params.type?.toLowerCase() || 'photos';
  const fileType = TYPE_MAP[typeSlug] || 'photo';
  const typeLabel = TYPE_LABELS[fileType] || 'Médias';

  let files: CloudflareFile[] = [];
  let error: string | null = null;

  try {
    const result = await listCloudflareFiles({ type: fileType });
    files = result.files;
  } catch (e) {
    console.error('Error listing files:', e);
    error = 'Impossible de charger les fichiers depuis Cloudflare R2';
    
    // Mock data for development/demo
    const mockFiles: CloudflareFile[] = [
      {
        key: 'quiz/sample-image-1.jpg',
        filename: 'sample-image-1.jpg',
        url: 'https://picsum.photos/400/300?random=1',
        size: 245000,
        lastModified: new Date('2025-01-20'),
        mimeType: 'image/jpeg',
        type: 'photo' as const
      },
      {
        key: 'quiz/sample-image-2.png',
        filename: 'sample-image-2.png',
        url: 'https://picsum.photos/400/300?random=2',
        size: 189000,
        lastModified: new Date('2025-01-19'),
        mimeType: 'image/png',
        type: 'photo' as const
      },
      {
        key: 'quiz/sample-image-3.webp',
        filename: 'sample-image-3.webp',
        url: 'https://picsum.photos/400/300?random=3',
        size: 156000,
        lastModified: new Date('2025-01-18'),
        mimeType: 'image/webp',
        type: 'photo' as const
      },
    ];
    files = mockFiles.filter(f => f.type === fileType);
  }

  return {
    files,
    fileType,
    typeLabel,
    typeSlug,
    error,
  };
};
