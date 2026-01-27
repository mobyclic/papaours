<script lang="ts">
  import { Combobox } from "bits-ui";
  import { Check, ChevronDown, X } from "lucide-svelte";
  import { cn } from "$lib/utils";

  type Option = { value: string; label: string };

  let {
    options = [],
    value = $bindable(""),
    placeholder = "Sélectionner...",
    searchPlaceholder = "Rechercher...",
    emptyText = "Aucun résultat",
    class: className = "",
    disabled = false,
    onchange,
  }: {
    options: Option[];
    value?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    class?: string;
    disabled?: boolean;
    onchange?: (value: string) => void;
  } = $props();

  let inputValue = $state("");
  let touchedInput = $state(false);

  const filteredOptions = $derived(
    touchedInput && inputValue
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase())
        )
      : options
  );

  const selectedLabel = $derived(
    options.find((opt) => opt.value === value)?.label ?? ""
  );

  function handleSelect(selectedValue: string | undefined) {
    if (selectedValue) {
      value = value === selectedValue ? "" : selectedValue;
      onchange?.(value);
    }
    touchedInput = false;
    inputValue = "";
  }

  function handleClear() {
    value = "";
    inputValue = "";
    onchange?.("");
  }
</script>

<Combobox.Root
  type="single"
  bind:value
  onValueChange={(v) => {
    if (v) {
      handleSelect(v);
    }
  }}
  onOpenChange={(open) => {
    if (!open) {
      touchedInput = false;
      inputValue = "";
    }
  }}
>
  <div class={cn("relative", className)}>
    <Combobox.Input
      class="w-full h-10 px-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
      placeholder={value ? selectedLabel : placeholder}
      aria-label={placeholder}
      {disabled}
      oninput={(e) => {
        inputValue = e.currentTarget.value;
        touchedInput = true;
      }}
    />
    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
      {#if value}
        <button
          type="button"
          class="p-1 hover:bg-gray-100 rounded"
          onclick={handleClear}
          aria-label="Effacer"
        >
          <X class="w-4 h-4 text-gray-400" />
        </button>
      {/if}
      <Combobox.Trigger class="p-1 hover:bg-gray-100 rounded" {disabled}>
        <ChevronDown class="w-4 h-4 text-gray-400" />
      </Combobox.Trigger>
    </div>
  </div>

  <Combobox.Portal>
    <Combobox.Content
      class="z-50 w-[var(--bits-combobox-trigger-width)] bg-white rounded-lg border border-gray-200 shadow-lg mt-1 max-h-60 overflow-auto"
      sideOffset={4}
    >
      {#if filteredOptions.length === 0}
        <div class="px-3 py-2 text-sm text-gray-500">{emptyText}</div>
      {:else}
        {#each filteredOptions as option (option.value)}
          <Combobox.Item
            value={option.value}
            label={option.label}
            class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[selected]:bg-indigo-50"
          >
            <Check
              class={cn(
                "w-4 h-4",
                value === option.value ? "text-indigo-600" : "text-transparent"
              )}
            />
            <span>{option.label}</span>
          </Combobox.Item>
        {/each}
      {/if}
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
