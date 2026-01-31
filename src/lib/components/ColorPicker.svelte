<script lang="ts">
  import { THEME_COLORS, type ThemeColorId } from '$lib/stores/themeStore.svelte';
  import { Check } from 'lucide-svelte';

  interface Props {
    value: ThemeColorId;
    onchange?: (colorId: ThemeColorId) => void;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { value = $bindable('gray'), onchange, label = 'Choisis ta couleur préférée', size = 'md' }: Props = $props();

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  function selectColor(colorId: ThemeColorId) {
    value = colorId;
    onchange?.(colorId);
  }
</script>

<div class="space-y-2">
  {#if label}
    <p class="text-sm font-medium text-gray-700">{label}</p>
  {/if}
  <div class="flex flex-wrap gap-2">
    {#each THEME_COLORS as color}
      <button
        type="button"
        onclick={() => selectColor(color.id)}
        class="{sizeClasses[size]} rounded-full transition-all flex items-center justify-center {value === color.id ? 'ring-2 ring-offset-2 ' + color.ring : 'hover:scale-110'}"
        style="background-color: {color.preview}"
        title={color.name}
      >
        {#if value === color.id}
          <Check class="w-4 h-4 text-white" />
        {/if}
      </button>
    {/each}
  </div>
  <p class="text-xs text-gray-500">
    {THEME_COLORS.find(c => c.id === value)?.name || 'Neutre'}
  </p>
</div>
