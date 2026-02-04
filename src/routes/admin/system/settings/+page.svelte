<script lang="ts">
  import { BookOpen, GraduationCap, Palette, Globe, Languages, ArrowRight, School, BarChart3, FolderOpen, Star, GitBranch, Layers } from "lucide-svelte";

  const settings = [
    { id: 'subjects', name: 'Matières', description: 'Gérer les matières disponibles', icon: BookOpen, href: '/admin/system/settings/subjects', color: 'blue' },
    { id: 'classes', name: 'Classes', description: 'Gérer les niveaux scolaires (CP, CM1, 6ème...)', icon: School, href: '/admin/system/settings/classes', color: 'cyan' },
    { id: 'levels', name: 'Difficulté', description: 'Gérer les niveaux de difficulté (Facile, Moyen...)', icon: BarChart3, href: '/admin/system/settings/levels', color: 'purple' },
    { id: 'themes', name: 'Thèmes', description: 'Gérer les thèmes par matière', icon: Palette, href: '/admin/system/settings/themes', color: 'green' },
    { id: 'countries', name: 'Pays', description: 'Gérer les pays disponibles', icon: Globe, href: '/admin/system/settings/countries', color: 'orange' },
    { id: 'languages', name: 'Langues', description: 'Gérer les langues disponibles', icon: Languages, href: '/admin/system/settings/languages', color: 'red' },
  ];

  const educationSettings = [
    { id: 'education-systems', name: 'Systèmes éducatifs', description: 'Gérer les systèmes (France, Belgique...)', icon: Globe, href: '/admin/system/settings/education-systems', color: 'blue' },
    { id: 'cycles', name: 'Cycles', description: 'Maternelle, Primaire, Collège, Lycée...', icon: Layers, href: '/admin/system/settings/cycles', color: 'cyan' },
    { id: 'tracks', name: 'Filières', description: 'Voie Générale, Technologique, Professionnelle...', icon: GitBranch, href: '/admin/system/settings/tracks', color: 'purple' },
    { id: 'grades', name: 'Niveaux', description: 'Seconde, Première, Terminale...', icon: GraduationCap, href: '/admin/system/settings/grades', color: 'green' },
    { id: 'specialty-groups', name: 'Pôles', description: 'Pôles de spécialités (Services, Techniques...)', icon: FolderOpen, href: '/admin/system/settings/specialty-groups', color: 'amber' },
    { id: 'specialties', name: 'Spécialités', description: 'Maths, Physique, NSI, Métiers...', icon: Star, href: '/admin/system/settings/specialties', color: 'orange' },
  ];

  function getColorClass(color: string) {
    switch (color) {
      case 'blue': return 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white';
      case 'cyan': return 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white';
      case 'purple': return 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white';
      case 'green': return 'bg-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-white';
      case 'orange': return 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-white';
      case 'amber': return 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white';
      case 'red': return 'bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white';
      default: return 'bg-gray-500/20 text-gray-400 group-hover:bg-gray-500 group-hover:text-white';
    }
  }
</script>

<svelte:head>
  <title>Paramètres - Administration</title>
</svelte:head>

<div class="flex-1 p-8 overflow-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Paramètres</h1>
    <p class="text-gray-400 mt-1">Configurez les options de la plateforme</p>
  </div>

  <!-- General Settings -->
  <h2 class="text-xl font-semibold text-white mb-4">Paramètres généraux</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
    {#each settings as setting (setting.id)}
      {@const IconComponent = setting.icon}
      <a 
        href={setting.href}
        class="group bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 p-6 hover:border-gray-700 transition-all"
      >
        <div class="flex items-start justify-between">
          <div class={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${getColorClass(setting.color)}`}>
            <IconComponent class="w-6 h-6" />
          </div>
          <ArrowRight class="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
        </div>
        <h3 class="text-lg font-semibold text-white mt-4">{setting.name}</h3>
        <p class="text-sm text-gray-400 mt-1">{setting.description}</p>
      </a>
    {/each}
  </div>

  <!-- Education Settings -->
  <h2 class="text-xl font-semibold text-white mb-4">Structure éducative</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each educationSettings as setting (setting.id)}
      {@const IconComponent = setting.icon}
      <a 
        href={setting.href}
        class="group bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800 p-6 hover:border-gray-700 transition-all"
      >
        <div class="flex items-start justify-between">
          <div class={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${getColorClass(setting.color)}`}>
            <IconComponent class="w-6 h-6" />
          </div>
          <ArrowRight class="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
        </div>
        <h3 class="text-lg font-semibold text-white mt-4">{setting.name}</h3>
        <p class="text-sm text-gray-400 mt-1">{setting.description}</p>
      </a>
    {/each}
  </div>
</div>
