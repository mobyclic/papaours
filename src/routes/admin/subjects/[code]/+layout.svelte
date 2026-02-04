<script lang="ts">
  import type { LayoutData } from './$types';
  import { page } from '$app/stores';
  
  let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="flex flex-col h-full">
  <!-- Content -->
  <main class="flex-1 overflow-auto p-6">
    {@render children?.()}
  </main>
</div>
