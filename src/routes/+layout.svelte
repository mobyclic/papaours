<script lang="ts">
  import "../app.css";
  import { onMount } from 'svelte';
  import { initI18n, locale } from '$lib/i18n';
  import { browser } from '$app/environment';

  let { children } = $props();
  let i18nReady = $state(false);

  onMount(async () => {
    await initI18n();
    i18nReady = true;
  });

  // Mettre à jour le lang et dir du document quand la locale change
  $effect(() => {
    if (browser && $locale) {
      document.documentElement.lang = $locale;
    }
  });
</script>

{#if i18nReady || !browser}
  {@render children()}
{:else}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="animate-pulse text-4xl font-bold text-gray-400">K</div>
  </div>
{/if}
