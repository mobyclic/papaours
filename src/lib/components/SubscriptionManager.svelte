<script lang="ts">
  import { 
    SUBSCRIPTION_PLANS, 
    PUBLIC_PLANS, 
    isPaidPlan, 
    isVipPlan,
    getYearlySavings,
    type SubscriptionPlan,
    type BillingCycle
  } from '$lib/types/subscription';
  import { Check, Crown, Star, Users, Building2, Sparkles, AlertCircle, Loader2, Calendar, Percent } from 'lucide-svelte';

  let { 
    currentPlan = 'free',
    currentBillingCycle = 'monthly',
    expiresAt = null,
    onPlanChange
  }: { 
    currentPlan: SubscriptionPlan;
    currentBillingCycle?: BillingCycle;
    expiresAt?: string | null;
    onPlanChange?: (plan: SubscriptionPlan, billingCycle: BillingCycle) => void;
  } = $props();

  let loading = $state(false);
  let error = $state('');
  let success = $state('');
  let selectedPlan = $state<SubscriptionPlan | null>(null);
  let selectedBillingCycle = $state<BillingCycle>('monthly');
  let showConfirmModal = $state(false);

  const planIcons: Record<SubscriptionPlan, typeof Crown> = {
    free: Users,
    tutor: Users,
    tutor_vip: Star,
    establishment: Building2,
    establishment_vip: Sparkles
  };

  const planColors: Record<SubscriptionPlan, { bg: string; border: string; text: string; gradient: string }> = {
    free: { 
      bg: 'bg-gray-800', 
      border: 'border-gray-600', 
      text: 'text-gray-300',
      gradient: 'from-gray-700 to-gray-800'
    },
    tutor: { 
      bg: 'bg-blue-900/50', 
      border: 'border-blue-500', 
      text: 'text-blue-400',
      gradient: 'from-blue-600 to-blue-800'
    },
    tutor_vip: { 
      bg: 'bg-purple-900/50', 
      border: 'border-purple-500', 
      text: 'text-purple-400',
      gradient: 'from-purple-600 to-purple-800'
    },
    establishment: { 
      bg: 'bg-amber-900/50', 
      border: 'border-amber-500', 
      text: 'text-amber-400',
      gradient: 'from-amber-600 to-amber-800'
    },
    establishment_vip: { 
      bg: 'bg-rose-900/50', 
      border: 'border-rose-500', 
      text: 'text-rose-400',
      gradient: 'from-rose-600 to-rose-800'
    }
  };

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  async function handleSelectPlan(plan: SubscriptionPlan, billingCycle: BillingCycle = 'monthly') {
    if (plan === currentPlan && billingCycle === currentBillingCycle) return;
    if (isVipPlan(plan)) return; // Les plans VIP ne peuvent pas être sélectionnés
    
    selectedPlan = plan;
    selectedBillingCycle = billingCycle;
    showConfirmModal = true;
  }

  async function confirmPlanChange() {
    if (!selectedPlan) return;
    
    loading = true;
    error = '';
    success = '';

    try {
      const res = await fetch('/api/user/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, billing_cycle: selectedBillingCycle })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du changement d\'abonnement');
      }

      success = data.message;
      currentPlan = selectedPlan;
      currentBillingCycle = selectedBillingCycle;
      onPlanChange?.(selectedPlan, selectedBillingCycle);
      
      showConfirmModal = false;
      selectedPlan = null;

      // Recharger la page après 2 secondes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (e: any) {
      error = e.message || 'Erreur inconnue';
    } finally {
      loading = false;
    }
  }

  async function cancelSubscription() {
    if (currentPlan === 'free') return;
    if (isVipPlan(currentPlan)) {
      error = 'Un plan VIP ne peut être modifié que par un administrateur';
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      const res = await fetch('/api/user/subscription', {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      success = data.message;
      currentPlan = 'free';
      currentBillingCycle = 'monthly';
      onPlanChange?.('free', 'monthly');

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (e: any) {
      error = e.message || 'Erreur inconnue';
    } finally {
      loading = false;
    }
  }

  // Filtrer les plans à afficher (publics uniquement, sauf si l'utilisateur a un plan VIP)
  const displayPlans = $derived(() => {
    if (isVipPlan(currentPlan)) {
      // Si l'utilisateur a un plan VIP, montrer son plan + les plans publics
      return [...PUBLIC_PLANS, currentPlan].filter((v, i, a) => a.indexOf(v) === i);
    }
    return PUBLIC_PLANS;
  });
</script>

<div class="space-y-6">
  <!-- Messages -->
  {#if error}
    <div class="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
      <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0" />
      <p class="text-red-300">{error}</p>
    </div>
  {/if}

  {#if success}
    <div class="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
      <Check class="w-5 h-5 text-green-400 flex-shrink-0" />
      <p class="text-green-300">{success}</p>
    </div>
  {/if}

  <!-- Current Plan Banner -->
  {#if isVipPlan(currentPlan)}
    <div class="bg-gradient-to-r {planColors[currentPlan].gradient} rounded-xl p-4 border {planColors[currentPlan].border}">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Crown class="w-5 h-5 text-white" />
        </div>
        <div>
          <p class="font-semibold text-white">Vous avez un abonnement VIP</p>
          <p class="text-sm text-white/70">Attribué par l'équipe Kweez - Gratuit à vie</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Billing Cycle Toggle -->
  <div class="flex justify-center">
    <div class="bg-gray-800 rounded-xl p-1.5 flex gap-1">
      <button
        type="button"
        onclick={() => selectedBillingCycle = 'monthly'}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all {selectedBillingCycle === 'monthly' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}"
      >
        <Calendar class="w-4 h-4 inline mr-1" />
        Mensuel
      </button>
      <button
        type="button"
        onclick={() => selectedBillingCycle = 'yearly'}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {selectedBillingCycle === 'yearly' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}"
      >
        <Calendar class="w-4 h-4" />
        Annuel
        <span class="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">-17%</span>
      </button>
    </div>
  </div>

  <!-- Plans Grid -->
  <div class="grid md:grid-cols-3 gap-4">
    {#each displayPlans() as planCode}
      {@const plan = SUBSCRIPTION_PLANS[planCode]}
      {@const colors = planColors[planCode]}
      {@const PlanIcon = planIcons[planCode]}
      {@const isCurrentPlan = currentPlan === planCode && (currentBillingCycle === selectedBillingCycle || !isPaidPlan(planCode))}
      {@const isVip = isVipPlan(planCode)}
      {@const isPaid = isPaidPlan(planCode)}
      {@const savings = getYearlySavings(planCode)}

      <div 
        class="relative rounded-2xl border-2 transition-all duration-200 {colors.bg} {isCurrentPlan ? colors.border : 'border-gray-700'} {!isVip && !isCurrentPlan ? 'hover:border-gray-500 cursor-pointer' : ''}"
        class:ring-2={isCurrentPlan}
        class:ring-offset-2={isCurrentPlan}
        class:ring-offset-gray-900={isCurrentPlan}
        class:ring-amber-500={isCurrentPlan}
        onclick={() => !isVip && handleSelectPlan(planCode, selectedBillingCycle)}
        onkeydown={(e) => e.key === 'Enter' && !isVip && handleSelectPlan(planCode, selectedBillingCycle)}
        role={!isVip ? 'button' : undefined}
        tabindex={!isVip && !isCurrentPlan ? 0 : -1}
      >
        <!-- Current Badge -->
        {#if isCurrentPlan}
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-gray-900 text-xs font-bold rounded-full">
            Actuel
          </div>
        {/if}

        <!-- VIP Badge -->
        {#if isVip}
          <div class="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Star class="w-3 h-3" />
            VIP
          </div>
        {/if}

        <div class="p-6">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br {colors.gradient} flex items-center justify-center">
              <PlanIcon class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="font-bold {colors.text}">{plan.name}</h3>
              <p class="text-sm text-gray-400">{plan.description}</p>
            </div>
          </div>

          <!-- Price -->
          <div class="mb-6">
            {#if isPaid}
              {#if selectedBillingCycle === 'yearly'}
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-bold text-white">{plan.price_yearly}€</span>
                  <span class="text-gray-400">/an</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-gray-500 line-through">{plan.price_monthly * 12}€</span>
                  <span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Percent class="w-3 h-3" />
                    2 mois gratuits
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Soit {(plan.price_yearly / 12).toFixed(2)}€/mois</p>
              {:else}
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-bold text-white">{plan.price_monthly}€</span>
                  <span class="text-gray-400">/mois</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Facturé chaque mois</p>
              {/if}
            {:else}
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-bold text-white">Gratuit</span>
              </div>
              {#if isVip}
                <p class="text-xs text-gray-500 mt-1">À vie</p>
              {/if}
            {/if}
          </div>

          <!-- Features -->
          <ul class="space-y-2 mb-6">
            {#each plan.features as feature}
              <li class="flex items-start gap-2 text-sm">
                <Check class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span class="text-gray-300">{feature}</span>
              </li>
            {/each}
            {#if plan.max_students}
              <li class="flex items-start gap-2 text-sm">
                <Users class="w-4 h-4 {colors.text} flex-shrink-0 mt-0.5" />
                <span class="text-gray-300">Jusqu'à {plan.max_students} apprenants</span>
              </li>
            {:else if planCode !== 'free'}
              <li class="flex items-start gap-2 text-sm">
                <Users class="w-4 h-4 {colors.text} flex-shrink-0 mt-0.5" />
                <span class="text-gray-300">Apprenants illimités</span>
              </li>
            {/if}
          </ul>

          <!-- Button -->
          {#if !isVip && !isCurrentPlan}
            <button
              type="button"
              class="w-full py-3 rounded-xl font-semibold transition-colors bg-gradient-to-r {colors.gradient} text-white hover:opacity-90"
              disabled={loading}
            >
              {isPaid ? 'Choisir ce plan' : 'Passer à ce plan'}
            </button>
          {:else if isCurrentPlan && isPaid && !isVip}
            <button
              type="button"
              onclick={cancelSubscription}
              class="w-full py-3 rounded-xl font-semibold transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
              disabled={loading}
            >
              Annuler l'abonnement
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Expiration Info -->
  {#if expiresAt && isPaidPlan(currentPlan) && !isVipPlan(currentPlan)}
    <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <p class="text-amber-300 text-sm">
        <strong>Prochain paiement :</strong> {formatDate(expiresAt)}
      </p>
    </div>
  {/if}
</div>

<!-- Confirmation Modal -->
{#if showConfirmModal && selectedPlan}
  {@const plan = SUBSCRIPTION_PLANS[selectedPlan]}
  {@const colors = planColors[selectedPlan]}
  {@const isPaid = isPaidPlan(selectedPlan)}
  {@const isYearly = selectedBillingCycle === 'yearly'}
  {@const price = isYearly ? plan.price_yearly : plan.price_monthly}
  {@const cycleLabel = isYearly ? 'an' : 'mois'}

  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full p-6">
      <h3 class="text-xl font-bold text-white mb-4">Confirmer le changement</h3>
      
      <div class="bg-gray-800 rounded-xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br {colors.gradient} flex items-center justify-center">
            <span class="text-2xl">{plan.icon}</span>
          </div>
          <div>
            <h4 class="font-bold {colors.text}">{plan.name}</h4>
            {#if isPaid}
              <p class="text-white font-semibold">{price}€/{cycleLabel}</p>
              {#if isYearly}
                <p class="text-xs text-green-400">2 mois gratuits inclus</p>
              {/if}
            {:else}
              <p class="text-white font-semibold">Gratuit</p>
            {/if}
          </div>
        </div>
      </div>

      {#if isPaid}
        <p class="text-gray-400 text-sm mb-6">
          {#if isYearly}
            Vous serez facturé <strong class="text-white">{price}€</strong> chaque année à la date de souscription.
            Soit <strong class="text-white">{(price / 12).toFixed(2)}€/mois</strong> (2 mois gratuits).
          {:else}
            Vous serez facturé <strong class="text-white">{price}€</strong> chaque mois à la date de souscription.
          {/if}
          Vous pouvez annuler à tout moment.
        </p>
      {:else}
        <p class="text-gray-400 text-sm mb-6">
          Vous allez passer au plan gratuit. Certaines fonctionnalités ne seront plus disponibles.
        </p>
      {/if}

      <div class="flex gap-3">
        <button
          type="button"
          onclick={() => { showConfirmModal = false; selectedPlan = null; }}
          class="flex-1 py-3 rounded-xl font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="button"
          onclick={confirmPlanChange}
          class="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r {colors.gradient} text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          disabled={loading}
        >
          {#if loading}
            <Loader2 class="w-5 h-5 animate-spin" />
          {:else}
            Confirmer
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
