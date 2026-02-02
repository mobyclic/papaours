<script lang="ts">
  import { locale, availableLocales, setLocale, type Locale } from '$lib/i18n';
  import { ChevronDown, Globe } from 'lucide-svelte';
  
  let open = $state(false);
  
  function selectLocale(code: Locale) {
    setLocale(code);
    open = false;
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.locale-selector')) {
      open = false;
    }
  }
  
  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
  
  const currentLocale = $derived(availableLocales.find(l => l.code === $locale));
</script>

<div class="locale-selector relative">
  <button
    onclick={() => open = !open}
    class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
  >
    <Globe class="w-4 h-4" />
    <span class="hidden sm:inline">{currentLocale?.flag} {currentLocale?.nativeName}</span>
    <span class="sm:hidden">{currentLocale?.flag}</span>
    <ChevronDown class="w-3 h-3 transition-transform {open ? 'rotate-180' : ''}" />
  </button>
  
  {#if open}
    <div class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
      {#each availableLocales as loc}
        <button
          onclick={() => selectLocale(loc.code)}
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 {$locale === loc.code ? 'bg-gray-50 font-medium' : ''}"
        >
          <span>{loc.flag}</span>
          <span>{loc.nativeName}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
