<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  interface Props {
    initialSeconds: number;
    onTimeUp?: () => void;
    paused?: boolean;
  }
  
  let { initialSeconds, onTimeUp, paused = false }: Props = $props();
  
  let remainingSeconds = $state(initialSeconds);
  let intervalId: ReturnType<typeof setInterval> | null = null;
  
  // Format time as MM:SS or HH:MM:SS
  let formattedTime = $derived.by(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
  
  // Color based on time remaining
  let percentage = $derived((remainingSeconds / initialSeconds) * 100);
  let colorClass = $derived(
    percentage <= 10 ? 'text-red-600 animate-pulse' :
    percentage <= 25 ? 'text-orange-500' :
    percentage <= 50 ? 'text-yellow-500' : 'text-green-600'
  );
  
  // Progress percentage for the bar
  let progressPercent = $derived((remainingSeconds / initialSeconds) * 100);
  
  function startTimer() {
    if (intervalId) return;
    
    intervalId = setInterval(() => {
      if (paused) return;
      
      remainingSeconds--;
      
      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        stopTimer();
        onTimeUp?.();
      }
    }, 1000);
  }
  
  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
  
  // Exposer getRemainingSeconds pour le composant parent
  export function getRemainingSeconds(): number {
    return remainingSeconds;
  }
  
  export function setRemainingSeconds(seconds: number) {
    remainingSeconds = seconds;
  }
  
  onMount(() => {
    startTimer();
  });
  
  onDestroy(() => {
    stopTimer();
  });
  
  // React to pause changes
  $effect(() => {
    if (!paused && !intervalId && remainingSeconds > 0) {
      startTimer();
    }
  });
</script>

<div class="flex items-center gap-2">
  <!-- Timer Icon -->
  <span class="text-lg">⏱️</span>
  
  <!-- Time Display -->
  <div class="flex flex-col items-end">
    <span class="text-xl font-mono font-bold {colorClass}">{formattedTime}</span>
    
    <!-- Mini progress bar -->
    <div class="w-24 h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
      <div 
        class="h-full transition-all duration-1000 {
          progressPercent <= 10 ? 'bg-red-500' :
          progressPercent <= 25 ? 'bg-orange-500' :
          progressPercent <= 50 ? 'bg-yellow-500' :
          'bg-green-500'
        }"
        style="width: {progressPercent}%"
      ></div>
    </div>
  </div>
</div>
