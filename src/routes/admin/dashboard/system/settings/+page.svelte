<script lang="ts">
  import { BookOpen, GraduationCap, Palette, Globe, Languages, ArrowRight } from "lucide-svelte";

  const settings = [
    { id: 'subjects', name: 'Matières', description: 'Gérer les matières disponibles', icon: BookOpen, href: '/admin/dashboard/system/settings/subjects', color: 'blue' },
    { id: 'levels', name: 'Niveaux', description: 'Gérer les niveaux de difficulté', icon: GraduationCap, href: '/admin/dashboard/system/settings/levels', color: 'purple' },
    { id: 'themes', name: 'Thèmes', description: 'Gérer les thèmes de quiz', icon: Palette, href: '/admin/dashboard/system/settings/themes', color: 'green' },
    { id: 'countries', name: 'Pays', description: 'Gérer les pays disponibles', icon: Globe, href: '/admin/dashboard/system/settings/countries', color: 'orange' },
    { id: 'languages', name: 'Langues', description: 'Gérer les langues disponibles', icon: Languages, href: '/admin/dashboard/system/settings/languages', color: 'red' },
  ];

  function getColorClass(color: string) {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white';
      case 'purple': return 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white';
      case 'green': return 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white';
      case 'orange': return 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white';
      case 'red': return 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white';
      default: return 'bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white';
    }
  }
</script>

<svelte:head>
  <title>Paramètres - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Paramètres</h1>
    <p class="text-gray-600 mt-1">Configurez les options de la plateforme</p>
  </div>

  <!-- Settings Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each settings as setting (setting.id)}
      {@const IconComponent = setting.icon}
      <a 
        href={setting.href}
        class="group bg-white rounded-xl shadow border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-gray-300"
      >
        <div class="flex items-start justify-between">
          <div class={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${getColorClass(setting.color)}`}>
            <IconComponent class="w-6 h-6" />
          </div>
          <ArrowRight class="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mt-4">{setting.name}</h3>
        <p class="text-sm text-gray-500 mt-1">{setting.description}</p>
      </a>
    {/each}
  </div>
</div>
