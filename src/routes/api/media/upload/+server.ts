import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { uploadToCloudflare } from "$lib/cloudflare";

export const POST = async ({ request }: RequestEvent) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'quiz';

    if (!file) {
      return error(400, { message: 'Aucun fichier fourni' });
    }

    const result = await uploadToCloudflare(file, folder);

    return json(result, { status: 201 });
  } catch (e) {
    console.error('Upload error:', e);
    return error(500, { message: 'Erreur lors de l\'upload' });
  }
};
