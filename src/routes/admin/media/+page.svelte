<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, Eye, Search, Image, Video, Music, FileText } from "lucide-svelte";

  interface MediaItem {
    id: string;
    title?: string;
    type?: string;
    url?: string;
    size?: string | number;
  }

  let { data }: { data: PageData } = $props();

  let medias = $derived((data.medias || []) as MediaItem[]);
  let search = $state('');

  let filteredMedias = $derived.by(() => {
    if (!search) return medias;
    const s = search.toLowerCase();
    return medias.filter((media: MediaItem) =>
      media.title?.toLowerCase().includes(s) ||
      media.type?.toLowerCase().includes(s)
    );
  });

  function getIcon(type?: string) {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      default: return FileText;
    }
  }
</script>

<svelte:head>
  <title>Médias - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Médias</h1>
        <p class="text-gray-400 mt-2">Gérez tous les fichiers médias de la plateforme</p>
      </div>
      <Button class="bg-green-600 hover:bg-green-700">
        <Plus class="w-4 h-4 mr-2" />
        Uploader un fichier
      </Button>
    </div>
  </div>

  <!-- Search -->
  <div class="mb-6">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher un média..."
        bind:value={search}
        class="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  </div>

  <!-- Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {#each filteredMedias as media (media.id)}
      {@const IconComponent = getIcon(media.type)}
      <div class="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 overflow-hidden hover:shadow-xl transition-shadow">
        <!-- Preview -->
        <div class="aspect-video bg-gray-800 flex items-center justify-center relative">
          {#if media.type === 'image' && media.url}
            <img src={media.url} alt={media.title} class="w-full h-full object-cover" />
          {:else}
            <IconComponent class="w-12 h-12 text-gray-500" />
          {/if}
          <span class="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            {media.type}
          </span>
        </div>
        
        <!-- Info -->
        <div class="p-4">
          <h3 class="font-medium text-white truncate">{media.title}</h3>
          <p class="text-sm text-gray-400 mt-1">{media.size}</p>
          
          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 mt-4">
            <button class="p-1.5 hover:bg-gray-800 rounded-lg transition-colors" title="Voir">
              <Eye class="w-4 h-4 text-gray-400" />
            </button>
            <button class="p-1.5 hover:bg-gray-800 rounded-lg transition-colors" title="Éditer">
              <Edit2 class="w-4 h-4 text-gray-400" />
            </button>
            <button class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" title="Supprimer">
              <Trash2 class="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if filteredMedias.length === 0}
    <div class="text-center py-12 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
      <Image class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p class="text-gray-400">Aucun média trouvé</p>
      <Button class="mt-4 bg-green-600 hover:bg-green-700">
        <Plus class="w-4 h-4 mr-2" />
        Uploader votre premier fichier
      </Button>
    </div>
  {/if}
</div>
