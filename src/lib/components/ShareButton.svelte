<script lang="ts">
  import { Share2, Twitter, Facebook, Link, Check, X } from 'lucide-svelte';

  let { 
    title,
    text,
    url,
    score,
    totalQuestions,
    quizName,
    onClose
  }: { 
    title?: string;
    text?: string;
    url?: string;
    score?: number;
    totalQuestions?: number;
    quizName?: string;
    onClose?: () => void;
  } = $props();

  let copied = $state(false);
  let showModal = $state(false);

  // Construire le message de partage
  const shareMessage = $derived(() => {
    if (score !== undefined && totalQuestions !== undefined) {
      const percent = Math.round((score / totalQuestions) * 100);
      const emoji = percent === 100 ? '🏆' : percent >= 80 ? '⭐' : percent >= 50 ? '👍' : '💪';
      return `${emoji} J'ai obtenu ${score}/${totalQuestions} (${percent}%) au quiz "${quizName || 'Kwizy'}" ! Tente ta chance !`;
    }
    return text || `Découvre ce quiz sur Kwizy !`;
  });

  const shareUrl = $derived(url || (typeof window !== 'undefined' ? window.location.href : ''));
  const shareTitle = $derived(title || 'Kwizy - Quiz éducatif');

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    onClose?.();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareMessage()}\n${shareUrl}`);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (e) {
      console.error('Erreur copie:', e);
    }
  }

  function shareTwitter() {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage())}&url=${encodeURIComponent(shareUrl)}`;
    window.open(tweetUrl, '_blank', 'width=600,height=400');
  }

  function shareFacebook() {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage())}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  }

  function shareWhatsApp() {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareMessage()}\n${shareUrl}`)}`;
    window.open(waUrl, '_blank');
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage(),
          url: shareUrl
        });
      } catch (e) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      openModal();
    }
  }
</script>

<!-- Share Button -->
<button
  onclick={shareNative}
  class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all"
>
  <Share2 class="w-5 h-5" />
  <span>Partager</span>
</button>

<!-- Share Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" tabindex="-1" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-gray-800">Partager</h3>
        <button onclick={closeModal} class="p-1 hover:bg-gray-100 rounded-full">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- Preview -->
      <div class="bg-gray-50 rounded-xl p-4 mb-4">
        <p class="text-sm text-gray-700">{shareMessage()}</p>
        <p class="text-xs text-blue-600 mt-2 truncate">{shareUrl}</p>
      </div>

      <!-- Share buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button
          onclick={shareTwitter}
          class="flex items-center justify-center gap-2 py-3 bg-[#1DA1F2] text-white rounded-xl font-medium hover:bg-[#1a8cd8] transition-colors"
        >
          <Twitter class="w-5 h-5" />
          Twitter
        </button>
        
        <button
          onclick={shareFacebook}
          class="flex items-center justify-center gap-2 py-3 bg-[#4267B2] text-white rounded-xl font-medium hover:bg-[#365899] transition-colors"
        >
          <Facebook class="w-5 h-5" />
          Facebook
        </button>
        
        <button
          onclick={shareWhatsApp}
          class="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-medium hover:bg-[#20bd5a] transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </button>
        
        <button
          onclick={copyLink}
          class="flex items-center justify-center gap-2 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
        >
          {#if copied}
            <Check class="w-5 h-5" />
            Copié !
          {:else}
            <Link class="w-5 h-5" />
            Copier
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
