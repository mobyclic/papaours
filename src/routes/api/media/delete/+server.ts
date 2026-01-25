import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { deleteFromCloudflare } from "$lib/cloudflare";

export const POST = async ({ request }: RequestEvent) => {
  try {
    const { key } = await request.json();

    if (!key) {
      return error(400, { message: 'Clé du fichier requise' });
    }

    await deleteFromCloudflare(key);

    return json({ success: true, message: 'Fichier supprimé' });
  } catch (e) {
    console.error('Delete error:', e);
    return error(500, { message: 'Erreur lors de la suppression' });
  }
};
