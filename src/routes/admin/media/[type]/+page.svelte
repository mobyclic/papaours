<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { 
    ArrowLeft, Upload, Trash2, Download, Copy, Eye, Grid, List,
    Image, Video, Music, Sparkles, AlertCircle, CheckCircle, X,
    FileIcon, Calendar, HardDrive
  } from "lucide-svelte";
  import type { CloudflareFile } from "$lib/cloudflare";

  let { data } = $props();

  let files = $derived(data.files || []);
  let typeLabel = $derived(data.typeLabel || 'Médias');
  let error = $derived(data.error);
  let TypeIcon = $derived(getTypeIcon(data.fileType));

  let viewMode = $state<'grid' | 'list'>('grid');
  let selectedFiles = $state<Set<string>>(new Set());
  let previewFile = $state<CloudflareFile | null>(null);
  let isUploading = $state(false);
  let uploadProgress = $state(0);

  function getTypeIcon(type: string) {
    switch (type) {
      case 'photo': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'animation': return Sparkles;
      default: return FileIcon;
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function toggleSelect(key: string) {
    if (selectedFiles.has(key)) {
      selectedFiles.delete(key);
    } else {
      selectedFiles.add(key);
    }
    selectedFiles = new Set(selectedFiles);
  }

  function selectAll() {
    if (selectedFiles.size === files.length) {
      selectedFiles = new Set();
    } else {
      selectedFiles = new Set(files.map((f: CloudflareFile) => f.key));
    }
  }

  async function handleUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const uploadedFiles = input.files;
    if (!uploadedFiles?.length) return;

    isUploading = true;
    uploadProgress = 0;

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'quiz');

        await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });

        uploadProgress = Math.round(((i + 1) / uploadedFiles.length) * 100);
      }

      // Reload page to show new files
      window.location.reload();
    } catch (e) {
      console.error('Upload error:', e);
      alert('Erreur lors de l\'upload');
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }

  async function handleDelete(keys: string[]) {
    if (!confirm(`Supprimer ${keys.length} fichier(s) ?`)) return;

    try {
      for (const key of keys) {
        await fetch('/api/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        });
      }
      window.location.reload();
    } catch (e) {
      console.error('Delete error:', e);
      alert('Erreur lors de la suppression');
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  }
</script>

<svelte:head>
  <title>{typeLabel} - Médias - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <a href="/admin/media" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
      <ArrowLeft class="w-4 h-4" />
      Tous les médias
    </a>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <TypeIcon class="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{typeLabel}</h1>
          <p class="text-gray-600">{files.length} fichier{files.length > 1 ? 's' : ''} dans Cloudflare R2</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <label class="cursor-pointer">
          <input
            type="file"
            multiple
            accept={data.fileType === 'photo' ? 'image/*' : data.fileType === 'video' ? 'video/*' : data.fileType === 'audio' ? 'audio/*' : '*'}
            class="hidden"
            onchange={handleUpload}
            disabled={isUploading}
          />
          <Button class="bg-purple-600 hover:bg-purple-700" disabled={isUploading}>
            <Upload class="w-4 h-4 mr-2" />
            {isUploading ? `Upload ${uploadProgress}%` : 'Uploader'}
          </Button>
        </label>
      </div>
    </div>
  </div>

  <!-- Error message -->
  {#if error}
    <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
      <AlertCircle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p class="text-amber-800 font-medium">Mode démonstration</p>
        <p class="text-amber-700 text-sm">{error}</p>
      </div>
    </div>
  {/if}

  <!-- Toolbar -->
  <div class="mb-6 flex items-center justify-between">
    <div class="flex items-center gap-4">
      {#if selectedFiles.size > 0}
        <span class="text-sm text-gray-600">{selectedFiles.size} sélectionné(s)</span>
        <Button 
          variant="outline" 
          size="sm"
          class="text-red-600 hover:bg-red-50"
          onclick={() => handleDelete([...selectedFiles])}
        >
          <Trash2 class="w-4 h-4 mr-1" />
          Supprimer
        </Button>
      {/if}
      <button
        onclick={selectAll}
        class="text-sm text-gray-600 hover:text-gray-900"
      >
        {selectedFiles.size === files.length ? 'Tout désélectionner' : 'Tout sélectionner'}
      </button>
    </div>

    <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onclick={() => viewMode = 'grid'}
        class="p-2 rounded-md transition-colors"
        class:bg-white={viewMode === 'grid'}
        class:shadow-sm={viewMode === 'grid'}
      >
        <Grid class="w-4 h-4" />
      </button>
      <button
        onclick={() => viewMode = 'list'}
        class="p-2 rounded-md transition-colors"
        class:bg-white={viewMode === 'list'}
        class:shadow-sm={viewMode === 'list'}
      >
        <List class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Files Grid/List -->
  {#if files.length === 0}
    <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <TypeIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500 text-lg mb-2">Aucun fichier de type {typeLabel.toLowerCase()}</p>
      <p class="text-gray-400 text-sm mb-6">Uploadez vos premiers fichiers pour les voir ici</p>
      <label class="cursor-pointer inline-block">
        <input
          type="file"
          multiple
          accept={data.fileType === 'photo' ? 'image/*' : data.fileType === 'video' ? 'video/*' : data.fileType === 'audio' ? 'audio/*' : '*'}
          class="hidden"
          onchange={handleUpload}
        />
        <Button class="bg-purple-600 hover:bg-purple-700">
          <Upload class="w-4 h-4 mr-2" />
          Uploader des fichiers
        </Button>
      </label>
    </div>
  {:else if viewMode === 'grid'}
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {#each files as file (file.key)}
        <div 
          class="bg-white rounded-xl border border-gray-200 overflow-hidden group relative"
          class:ring-2={selectedFiles.has(file.key)}
          class:ring-purple-500={selectedFiles.has(file.key)}
        >
          <!-- Selection checkbox -->
          <button
            onclick={() => toggleSelect(file.key)}
            class="absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
            class:bg-purple-600={selectedFiles.has(file.key)}
            class:border-purple-600={selectedFiles.has(file.key)}
            class:bg-white={!selectedFiles.has(file.key)}
            class:border-gray-300={!selectedFiles.has(file.key)}
            class:opacity-0={!selectedFiles.has(file.key)}
            class:group-hover:opacity-100={!selectedFiles.has(file.key)}
          >
            {#if selectedFiles.has(file.key)}
              <CheckCircle class="w-4 h-4 text-white" />
            {/if}
          </button>

          <!-- Preview -->
          <button
            onclick={() => previewFile = file}
            class="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden"
          >
            {#if file.type === 'photo'}
              <img src={file.url} alt={file.filename} class="w-full h-full object-cover" />
            {:else if file.type === 'video'}
              <!-- svelte-ignore a11y_media_has_caption -->
              <video src={file.url} class="w-full h-full object-cover"></video>
            {:else if file.type === 'audio'}
              <Music class="w-12 h-12 text-gray-400" />
            {:else}
              <Sparkles class="w-12 h-12 text-gray-400" />
            {/if}
          </button>

          <!-- Info -->
          <div class="p-3">
            <p class="text-sm font-medium text-gray-900 truncate" title={file.filename}>
              {file.filename}
            </p>
            <p class="text-xs text-gray-500 mt-1">{formatSize(file.size)}</p>
          </div>

          <!-- Hover actions -->
          <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
            <button
              onclick={() => previewFile = file}
              class="p-1.5 bg-white/90 rounded-lg hover:bg-white"
              title="Aperçu"
            >
              <Eye class="w-4 h-4 text-gray-700" />
            </button>
            <button
              onclick={() => copyUrl(file.url)}
              class="p-1.5 bg-white/90 rounded-lg hover:bg-white"
              title="Copier l'URL"
            >
              <Copy class="w-4 h-4 text-gray-700" />
            </button>
            <a
              href={file.url}
              download={file.filename}
              class="p-1.5 bg-white/90 rounded-lg hover:bg-white"
              title="Télécharger"
            >
              <Download class="w-4 h-4 text-gray-700" />
            </a>
            <button
              onclick={() => handleDelete([file.key])}
              class="p-1.5 bg-white/90 rounded-lg hover:bg-red-100"
              title="Supprimer"
            >
              <Trash2 class="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- List view -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="w-12 px-4 py-3"></th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fichier</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Taille</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each files as file (file.key)}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3">
                <button
                  onclick={() => toggleSelect(file.key)}
                  class="w-5 h-5 rounded border-2 flex items-center justify-center"
                  class:bg-purple-600={selectedFiles.has(file.key)}
                  class:border-purple-600={selectedFiles.has(file.key)}
                  class:border-gray-300={!selectedFiles.has(file.key)}
                >
                  {#if selectedFiles.has(file.key)}
                    <CheckCircle class="w-3 h-3 text-white" />
                  {/if}
                </button>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {#if file.type === 'photo'}
                      <img src={file.url} alt="" class="w-full h-full object-cover" />
                    {:else}
                      {@const FileTypeIcon = getTypeIcon(file.type)}
                      <FileTypeIcon class="w-5 h-5 text-gray-400" />
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                    <p class="text-xs text-gray-500 truncate">{file.key}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600">{formatSize(file.size)}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600">{formatDate(file.lastModified)}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button onclick={() => previewFile = file} class="p-1.5 hover:bg-gray-100 rounded-lg" title="Aperçu">
                    <Eye class="w-4 h-4 text-gray-600" />
                  </button>
                  <button onclick={() => copyUrl(file.url)} class="p-1.5 hover:bg-gray-100 rounded-lg" title="Copier URL">
                    <Copy class="w-4 h-4 text-gray-600" />
                  </button>
                  <a href={file.url} download={file.filename} class="p-1.5 hover:bg-gray-100 rounded-lg" title="Télécharger">
                    <Download class="w-4 h-4 text-gray-600" />
                  </a>
                  <button onclick={() => handleDelete([file.key])} class="p-1.5 hover:bg-red-100 rounded-lg" title="Supprimer">
                    <Trash2 class="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Preview Modal -->
{#if previewFile}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
    onclick={() => previewFile = null}
    onkeydown={(e) => e.key === 'Escape' && (previewFile = null)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <button
      onclick={() => previewFile = null}
      class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
    >
      <X class="w-6 h-6" />
    </button>
    
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
      class="max-w-4xl max-h-full overflow-auto bg-white rounded-xl"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
    >
      {#if previewFile.type === 'photo'}
        <img src={previewFile.url} alt={previewFile.filename} class="max-w-full max-h-[70vh] object-contain" />
      {:else if previewFile.type === 'video'}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video src={previewFile.url} controls class="max-w-full max-h-[70vh]"></video>
      {:else if previewFile.type === 'audio'}
        <div class="p-8">
          <audio src={previewFile.url} controls class="w-full"></audio>
        </div>
      {:else}
        <div class="p-8 text-center">
          <Sparkles class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-600">Aperçu non disponible</p>
        </div>
      {/if}
      
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900">{previewFile.filename}</p>
            <p class="text-sm text-gray-500 flex items-center gap-4 mt-1">
              <span class="flex items-center gap-1">
                <HardDrive class="w-4 h-4" />
                {formatSize(previewFile.size)}
              </span>
              <span class="flex items-center gap-1">
                <Calendar class="w-4 h-4" />
                {formatDate(previewFile.lastModified)}
              </span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" onclick={() => copyUrl(previewFile!.url)}>
              <Copy class="w-4 h-4 mr-1" />
              Copier URL
            </Button>
            <a href={previewFile.url} download={previewFile.filename}>
              <Button variant="outline" size="sm">
                <Download class="w-4 h-4 mr-1" />
                Télécharger
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
