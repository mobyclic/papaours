<script lang="ts">
  import type { HTMLLabelAttributes } from "svelte/elements";
  import { cn } from "$lib/utils.js";

  interface Props extends HTMLLabelAttributes {
    class?: string;
  }

  let { class: className, ...restProps }: Props = $props();
</script>

<label
  class={cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...restProps}
>
  <slot />
</label>
