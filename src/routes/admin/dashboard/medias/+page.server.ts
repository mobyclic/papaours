import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Données de test - en production, charger depuis la base de données
  const medias = [
    {
      id: 'media:1',
      title: 'Question Image 1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
      size: '245 KB',
      created_at: '2025-01-20T10:00:00Z'
    },
    {
      id: 'media:2',
      title: 'Audio Question Français',
      type: 'audio',
      url: null,
      size: '1.2 MB',
      created_at: '2025-01-18T14:30:00Z'
    },
    {
      id: 'media:3',
      title: 'Vidéo explicative',
      type: 'video',
      url: null,
      size: '15 MB',
      created_at: '2025-01-15T09:15:00Z'
    }
  ];

  return {
    medias
  };
};
