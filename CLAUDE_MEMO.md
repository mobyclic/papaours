# Claude Memo - Kweez (PAPAOURS)

Notes et rappels pour éviter les erreurs récurrentes.

---

## SurrealDB

### ORDER BY nécessite le champ dans SELECT

**Erreur fréquente :**
```
Parse error: Missing order idiom `table.field` in statement selection
```

**Cause :** SurrealDB exige que les champs utilisés dans `ORDER BY` soient présents dans le `SELECT`.

**❌ INCORRECT :**
```sql
SELECT * FROM official_program ORDER BY grade.`order` ASC
```

**✅ CORRECT :**
```sql
SELECT *, grade.`order` as grade_order FROM official_program ORDER BY grade_order ASC
```

**Règle :** Toujours inclure le champ de tri dans le SELECT (avec un alias si nécessaire).

---

### `order` est un mot réservé

Le champ `order` doit être échappé avec des backticks :
```sql
SELECT `order` FROM table ORDER BY `order` ASC
UPDATE table SET `order` = $order WHERE id = $id
```

---

### RecordId non sérialisable

Les `RecordId` SurrealDB ne peuvent pas être sérialisés par SvelteKit. Toujours convertir :

```typescript
// ❌ Erreur: Cannot stringify arbitrary non-POJOs
return { domain: record.domain }

// ✅ Correct
return { domain: record.domain?.toString() || null }
```

---

## Bun

- Toujours utiliser `bun` au lieu de `npm/npx`
- Dev server : `bun run dev`
- Install : `bun install`
- Scripts : `bun run script.ts`

---

## Svelte 5

- Utiliser `$state`, `$derived`, `$props()` (pas `export let`)
- Snippets au lieu de slots : `{@render children?.()}`
- `bind:value` fonctionne toujours

---

## shadcn-svelte

- Import depuis barrel : `import { Button } from "$lib/components/ui/button"`
- Namespace pour Dialog, Select : `import * as Dialog from "$lib/components/ui/dialog"`
- Le composant `Textarea` n'existe pas dans ce projet - utiliser `<textarea>` natif avec classes Tailwind
