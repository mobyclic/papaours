<script lang="ts">
  import AdminSidebar from "$lib/components/admin-sidebar.svelte";

  let { children, data } = $props<{ children: any; data: any }>();
</script>

<div class="flex h-screen bg-gray-50">
  <AdminSidebar {data} />
  <main class="flex-1 flex flex-col overflow-hidden">
    <div class="flex-1 overflow-y-auto">
      {@render children()}
    </div>
  </main>
</div>
