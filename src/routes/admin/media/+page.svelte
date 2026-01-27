<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Plus, Edit2, Trash2, Eye, Search, Image, Video, Music, FileText } from "lucide-svelte";

  let { data }: { data: PageData } = $props();

  let medias = $derived(data.medias || []);
  let search = $state('');

  let filteredMedias = $derived.by(() => {
    if (!search) return medias;
    const s = search.toLowerCase();
    return medias.filter(media =>
      media.title?.toLowerCase().includes(s) ||
      media.type?.toLowerCase().includes(s)
    );
  });

  function getIcon(type: string) {
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
        <h1 class="text-3xl font-bold text-gray-900">Médias</h1>
        <p class="text-gray-600 mt-1">Gérez tous les fichiers médias de la plateforme</p>
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
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  </div>

  <!-- Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {#each filteredMedias as media (media.id)}
      {@const IconComponent = getIcon(media.type)}
      <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <!-- Preview -->
        <div class="aspect-video bg-gray-100 flex items-center justify-center relative">
          {#if media.type === 'image' && media.url}
            <img src={media.url} alt={media.title} class="w-full h-full object-cover" />
          {:else}
            <IconComponent class="w-12 h-12 text-gray-400" />
          {/if}
          <span class="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
            {media.type}
          </span>
        </div>
        
        <!-- Info -->
        <div class="p-4">
          <h3 class="font-medium text-gray-900 truncate">{media.title}</h3>
          <p class="text-sm text-gray-500 mt-1">{media.size}</p>
          
          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 mt-4">
            <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
              <Eye class="w-4 h-4 text-gray-600" />
            </button>
            <button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Éditer">
              <Edit2 class="w-4 h-4 text-gray-600" />
            </button>
            <button class="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Supprimer">
              <Trash2 class="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if filteredMedias.length === 0}
    <div class="text-center py-12 bg-white rounded-xl border border-gray-200">
      <Image class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500">Aucun média trouvé</p>
      <Button class="mt-4 bg-green-600 hover:bg-green-700">
        <Plus class="w-4 h-4 mr-2" />
        Uploader votre premier fichier
      </Button>
    </div>
  {/if}
</div>
