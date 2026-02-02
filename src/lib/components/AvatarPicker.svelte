<script lang="ts">
  import { Camera, Upload, X, Check, Loader2 } from 'lucide-svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { currentUser } from '$lib/stores/userStore.svelte';
  
  interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (avatarUrl: string) => void;
    currentAvatar?: string | null;
  }
  
  let { open = $bindable(), onClose, onSelect, currentAvatar }: Props = $props();
  
  let activeTab = $state<'preset' | 'upload'>('preset');
  let uploading = $state(false);
  let dragOver = $state(false);
  let selectedPreset = $state<string | null>(null);
  let previewUrl = $state<string | null>(null);
  let fileInput: HTMLInputElement;
  
  // Obtenir l'ID utilisateur pour l'authentification
  function getUserId(): string | undefined {
    const user = $currentUser;
    return user?.id;
  }
  
  // Avatars prédéfinis (emojis et couleurs)
  const presetAvatars = [
    // Animaux mignons
    '🐻', '🐼', '🦊', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
    '🐰', '🐱', '🐶', '🦄', '🐢', '🦋', '🐙', '🦉', '🐧', '🐬',
    // Personnages
    '👧', '👦', '🧒', '👩', '👨', '🧑', '👩‍🎓', '👨‍🎓', '🧙‍♂️', '🧙‍♀️',
    '🦸‍♂️', '🦸‍♀️', '🧚‍♀️', '🧜‍♀️', '👸', '🤴', '🥷', '🧛', '🤖', '👽'
  ];
  
  // Couleurs de fond pour les presets
  const presetColors = [
    'bg-gradient-to-br from-amber-400 to-orange-500',
    'bg-gradient-to-br from-blue-400 to-indigo-500',
    'bg-gradient-to-br from-green-400 to-emerald-500',
    'bg-gradient-to-br from-purple-400 to-pink-500',
    'bg-gradient-to-br from-rose-400 to-red-500',
    'bg-gradient-to-br from-cyan-400 to-teal-500',
  ];
  
  function getColorForPreset(index: number): string {
    return presetColors[index % presetColors.length];
  }
  
  function selectPreset(emoji: string, index: number) {
    selectedPreset = `emoji:${emoji}:${index % presetColors.length}`;
    previewUrl = null;
  }
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      processFile(file);
    }
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave() {
    dragOver = false;
  }
  
  function processFile(file: File) {
    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.');
      return;
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux. Maximum 5MB.');
      return;
    }
    
    // Créer une preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl = e.target?.result as string;
      selectedPreset = null;
    };
    reader.readAsDataURL(file);
  }
  
  async function confirmSelection() {
    uploading = true;
    
    const userId = getUserId();
    const headers: Record<string, string> = {};
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    
    try {
      if (selectedPreset) {
        // Avatar prédéfini
        const formData = new FormData();
        formData.append('avatarPreset', selectedPreset);
        
        const res = await fetch('/api/user/avatar', {
          method: 'POST',
          headers,
          body: formData
        });
        
        if (!res.ok) {
          throw new Error('Erreur lors de la sauvegarde');
        }
        
        const data = await res.json();
        onSelect(data.avatar_url);
      } else if (previewUrl && fileInput?.files?.[0]) {
        // Upload de fichier
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        const res = await fetch('/api/user/avatar', {
          method: 'POST',
          headers,
          body: formData
        });
        
        if (!res.ok) {
          throw new Error('Erreur lors de l\'upload');
        }
        
        const data = await res.json();
        onSelect(data.avatar_url);
      }
      
      close();
    } catch (e) {
      console.error('Avatar selection error:', e);
      alert('Erreur lors de la sauvegarde de l\'avatar');
    } finally {
      uploading = false;
    }
  }
  
  function close() {
    selectedPreset = null;
    previewUrl = null;
    activeTab = 'preset';
    onClose();
  }
  
  function clearSelection() {
    selectedPreset = null;
    previewUrl = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && close()}>
  <Dialog.Content class="bg-gray-900 border-gray-800 max-w-md">
    <Dialog.Header>
      <Dialog.Title class="text-white">Choisir un avatar</Dialog.Title>
      <Dialog.Description class="text-gray-400">
        Sélectionnez un avatar prédéfini ou téléchargez votre propre photo
      </Dialog.Description>
    </Dialog.Header>
    
    <!-- Tabs -->
    <div class="flex gap-2 mb-4">
      <button
        onclick={() => activeTab = 'preset'}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors {activeTab === 'preset' ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}"
      >
        😊 Avatars
      </button>
      <button
        onclick={() => activeTab = 'upload'}
        class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors {activeTab === 'upload' ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}"
      >
        <Upload class="w-4 h-4 inline mr-1" />
        Ma photo
      </button>
    </div>
    
    <!-- Content -->
    <div class="min-h-[280px]">
      {#if activeTab === 'preset'}
        <!-- Preset avatars grid -->
        <div class="grid grid-cols-5 gap-3 max-h-[280px] overflow-y-auto pr-2">
          {#each presetAvatars as emoji, index}
            {@const presetKey = `emoji:${emoji}:${index % presetColors.length}`}
            <button
              onclick={() => selectPreset(emoji, index)}
              class="aspect-square rounded-xl {getColorForPreset(index)} flex items-center justify-center text-2xl hover:scale-110 transition-transform relative ring-offset-gray-900 {selectedPreset === presetKey ? 'ring-2 ring-amber-400 ring-offset-2' : ''}"
            >
              {emoji}
              {#if selectedPreset === presetKey}
                <div class="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check class="w-3 h-3 text-gray-900" />
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {:else}
        <!-- Upload zone -->
        <div
          role="button"
          tabindex="0"
          ondrop={handleDrop}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          onclick={() => fileInput?.click()}
          onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
          class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors {dragOver ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 hover:border-gray-600'}"
        >
          {#if previewUrl}
            <div class="relative inline-block">
              <img 
                src={previewUrl} 
                alt="Preview" 
                class="w-32 h-32 rounded-xl object-cover mx-auto"
              />
              <button
                onclick={(e) => { e.stopPropagation(); clearSelection(); }}
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <p class="text-sm text-gray-400 mt-3">Cliquez pour changer</p>
          {:else}
            <Camera class="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p class="text-gray-400 mb-1">Glissez une image ici</p>
            <p class="text-sm text-gray-500">ou cliquez pour parcourir</p>
            <p class="text-xs text-gray-600 mt-2">JPG, PNG, WebP, GIF • Max 5MB</p>
          {/if}
        </div>
        
        <input
          bind:this={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onchange={handleFileSelect}
          class="hidden"
        />
      {/if}
    </div>
    
    <!-- Footer -->
    <Dialog.Footer class="mt-4">
      <div class="flex gap-3 w-full">
        <button
          onclick={close}
          class="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors text-white"
        >
          Annuler
        </button>
        <button
          onclick={confirmSelection}
          disabled={uploading || (!selectedPreset && !previewUrl)}
          class="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium transition-colors text-gray-900 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {#if uploading}
            <Loader2 class="w-4 h-4 animate-spin" />
            Sauvegarde...
          {:else}
            Confirmer
          {/if}
        </button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
