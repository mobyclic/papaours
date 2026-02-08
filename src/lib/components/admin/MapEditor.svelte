<script lang="ts">
  /**
   * Éditeur de carte interactive avec drag & drop des zones
   * Permet de repositionner visuellement les zones REP_X sur le SVG
   */
  import { onMount, tick } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-svelte';
  
  interface MapZone {
    id: string; // REP_0, REP_1, etc.
    index: number;
    cx: number;
    cy: number;
    label?: string;
  }
  
  interface Props {
    /** Contenu SVG brut */
    svgContent: string;
    /** Callback quand le SVG est modifié */
    onSvgChange: (newSvg: string) => void;
    /** Labels des zones pour affichage */
    zoneLabels?: Record<string, string>;
  }
  
  let { svgContent, onSvgChange, zoneLabels = {} }: Props = $props();
  
  // État
  let containerRef = $state<HTMLDivElement | null>(null);
  let zones = $state<MapZone[]>([]);
  let selectedZone = $state<string | null>(null);
  let isDragging = $state(false);
  let dragOffset = $state({ x: 0, y: 0 });
  let scale = $state(1);
  let viewBox = $state({ x: 0, y: 0, width: 900, height: 500 });
  
  // Parse les zones du SVG
  function parseZones(svg: string): MapZone[] {
    const parsed: MapZone[] = [];
    // Matcher les cercles avec id REP_X
    const circleRegex = /<circle[^>]*id=["'](REP_\d+)["'][^>]*cx=["']([^"']+)["'][^>]*cy=["']([^"']+)["'][^>]*>/gi;
    // Aussi matcher si cx/cy sont avant id
    const circleRegex2 = /<circle[^>]*cx=["']([^"']+)["'][^>]*cy=["']([^"']+)["'][^>]*id=["'](REP_\d+)["'][^>]*>/gi;
    
    let match;
    while ((match = circleRegex.exec(svg)) !== null) {
      const id = match[1].toUpperCase();
      const index = parseInt(id.replace('REP_', ''));
      parsed.push({
        id,
        index,
        cx: parseFloat(match[2]),
        cy: parseFloat(match[3])
      });
    }
    
    // Reset regex et essayer l'autre pattern
    circleRegex2.lastIndex = 0;
    while ((match = circleRegex2.exec(svg)) !== null) {
      const id = match[3].toUpperCase();
      // Éviter les doublons
      if (!parsed.find(z => z.id === id)) {
        const index = parseInt(id.replace('REP_', ''));
        parsed.push({
          id,
          index,
          cx: parseFloat(match[1]),
          cy: parseFloat(match[2])
        });
      }
    }
    
    // Trier par index
    return parsed.sort((a, b) => a.index - b.index);
  }
  
  // Met à jour le SVG avec les nouvelles positions
  function updateSvgPositions(): string {
    let newSvg = svgContent;
    
    for (const zone of zones) {
      // Pattern pour trouver et remplacer la position du cercle
      const patterns = [
        // id avant cx/cy
        new RegExp(`(<circle[^>]*id=["']${zone.id}["'][^>]*cx=["'])[^"']+(["'][^>]*cy=["'])[^"']+`, 'gi'),
        // cx/cy avant id
        new RegExp(`(<circle[^>]*cx=["'])[^"]+(["'][^>]*cy=["'])[^"]+(["'][^>]*id=["']${zone.id}["'])`, 'gi')
      ];
      
      // Essayer le premier pattern
      if (patterns[0].test(newSvg)) {
        newSvg = newSvg.replace(patterns[0], `$1${zone.cx}$2${zone.cy}`);
      } else {
        // Essayer le second pattern
        newSvg = newSvg.replace(patterns[1], `$1${zone.cx}$2${zone.cy}$3`);
      }
    }
    
    return newSvg;
  }
  
  // Parse le viewBox du SVG
  function parseViewBox(svg: string): { x: number; y: number; width: number; height: number } {
    const match = svg.match(/viewBox=["']([^"']+)["']/i);
    if (match) {
      const parts = match[1].split(/\s+/).map(Number);
      if (parts.length === 4) {
        return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
      }
    }
    // Essayer width/height
    const widthMatch = svg.match(/width=["'](\d+)/i);
    const heightMatch = svg.match(/height=["'](\d+)/i);
    return {
      x: 0,
      y: 0,
      width: widthMatch ? parseInt(widthMatch[1]) : 900,
      height: heightMatch ? parseInt(heightMatch[1]) : 500
    };
  }
  
  // Convertit les coordonnées écran en coordonnées SVG
  function screenToSvg(clientX: number, clientY: number): { x: number; y: number } {
    if (!containerRef) return { x: 0, y: 0 };
    
    const rect = containerRef.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * viewBox.width / scale + viewBox.x;
    const y = ((clientY - rect.top) / rect.height) * viewBox.height / scale + viewBox.y;
    
    return { x, y };
  }
  
  // Handlers de drag
  function handleMouseDown(e: MouseEvent, zoneId: string) {
    e.preventDefault();
    e.stopPropagation();
    
    selectedZone = zoneId;
    isDragging = true;
    
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      const svgCoords = screenToSvg(e.clientX, e.clientY);
      dragOffset = {
        x: zone.cx - svgCoords.x,
        y: zone.cy - svgCoords.y
      };
    }
  }
  
  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !selectedZone) return;
    
    const svgCoords = screenToSvg(e.clientX, e.clientY);
    const zoneIndex = zones.findIndex(z => z.id === selectedZone);
    
    if (zoneIndex !== -1) {
      zones[zoneIndex].cx = Math.round(svgCoords.x + dragOffset.x);
      zones[zoneIndex].cy = Math.round(svgCoords.y + dragOffset.y);
    }
  }
  
  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      // Sauvegarder les changements
      const newSvg = updateSvgPositions();
      onSvgChange(newSvg);
    }
  }
  
  // Zoom
  function zoomIn() {
    scale = Math.min(scale * 1.2, 3);
  }
  
  function zoomOut() {
    scale = Math.max(scale / 1.2, 0.5);
  }
  
  function resetView() {
    scale = 1;
  }
  
  // Initialisation
  $effect(() => {
    if (svgContent) {
      zones = parseZones(svgContent);
      viewBox = parseViewBox(svgContent);
    }
  });
  
  // Récupérer le SVG sans les cercles REP_X (pour le fond)
  const backgroundSvg = $derived(() => {
    let bg = svgContent;
    // Retirer les cercles REP_X du SVG de fond (on les dessine nous-mêmes)
    bg = bg.replace(/<circle[^>]*id=["']REP_\d+["'][^>]*>(<\/circle>|<title>[^<]*<\/title><\/circle>)?/gi, '');
    // Retirer la balise svg englobante
    bg = bg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return bg;
  });
</script>

<div class="map-editor">
  <!-- Toolbar -->
  <div class="flex items-center justify-between mb-3 p-2 bg-gray-800 rounded-lg">
    <div class="flex items-center gap-2">
      <Move class="w-4 h-4 text-gray-400" />
      <span class="text-sm text-gray-300">
        {zones.length} zones • Glisse les cercles pour les repositionner
      </span>
    </div>
    <div class="flex items-center gap-1">
      <Button variant="ghost" size="sm" onclick={zoomOut}>
        <ZoomOut class="w-4 h-4" />
      </Button>
      <span class="text-xs text-gray-400 w-12 text-center">{Math.round(scale * 100)}%</span>
      <Button variant="ghost" size="sm" onclick={zoomIn}>
        <ZoomIn class="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onclick={resetView}>
        <RotateCcw class="w-4 h-4" />
      </Button>
    </div>
  </div>
  
  <!-- SVG Editor -->
  <div 
    bind:this={containerRef}
    class="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 cursor-crosshair"
    style="height: 400px;"
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseUp}
    role="application"
    aria-label="Éditeur de carte"
  >
    <svg
      viewBox="{viewBox.x} {viewBox.y} {viewBox.width / scale} {viewBox.height / scale}"
      class="w-full h-full"
      style="background: #1f2937;"
    >
      <!-- Fond de carte (SVG original sans les zones) -->
      <g class="map-background">
        {@html backgroundSvg()}
      </g>
      
      <!-- Zones éditables -->
      {#each zones as zone}
        {@const isSelected = selectedZone === zone.id}
        <g class="zone-marker" transform="translate({zone.cx}, {zone.cy})">
          <!-- Cercle de zone -->
          <circle
            r={isSelected ? 24 : 20}
            fill={isSelected ? 'rgba(251, 191, 36, 0.4)' : 'rgba(239, 68, 68, 0.3)'}
            stroke={isSelected ? '#f59e0b' : '#e74c3c'}
            stroke-width={isSelected ? 3 : 2}
            stroke-dasharray={isSelected ? '' : '4,4'}
            style="cursor: grab; {isDragging && isSelected ? 'cursor: grabbing;' : ''}"
            onmousedown={(e) => handleMouseDown(e, zone.id)}
            role="button"
            tabindex="0"
            aria-label="Zone {zone.index + 1}"
          />
          
          <!-- Label de zone -->
          <text
            y="1"
            text-anchor="middle"
            dominant-baseline="middle"
            class="text-xs font-bold pointer-events-none select-none"
            fill={isSelected ? '#f59e0b' : '#fff'}
          >
            {zone.index + 1}
          </text>
          
          <!-- Tooltip avec le nom -->
          {#if zoneLabels[zone.id]}
            <title>{zoneLabels[zone.id]}</title>
          {/if}
        </g>
      {/each}
    </svg>
    
    <!-- Instructions si dragging -->
    {#if isDragging}
      <div class="absolute bottom-2 left-2 right-2 bg-amber-900/90 text-amber-200 text-sm px-3 py-2 rounded-lg text-center">
        Relâche pour positionner la zone #{zones.find(z => z.id === selectedZone)?.index ?? 0 + 1}
      </div>
    {/if}
  </div>
  
  <!-- Liste des zones -->
  <div class="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    {#each zones as zone}
      <button
        onclick={() => selectedZone = zone.id}
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
          {selectedZone === zone.id 
            ? 'bg-amber-900/50 border-amber-500 text-amber-200' 
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'} border"
      >
        <span class="w-6 h-6 rounded-full bg-red-500/30 border border-red-500 flex items-center justify-center text-xs font-bold">
          {zone.index + 1}
        </span>
        <span class="truncate">
          {zoneLabels[zone.id] || `Zone ${zone.index + 1}`}
        </span>
        <span class="text-xs text-gray-500 ml-auto">
          ({zone.cx}, {zone.cy})
        </span>
      </button>
    {/each}
  </div>
</div>

<style>
  .map-editor :global(svg) {
    max-width: 100%;
  }
  
  .zone-marker circle:hover {
    filter: brightness(1.2);
  }
  
  .zone-marker circle:focus {
    outline: none;
    filter: brightness(1.3);
  }
</style>
