import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Cette page ne nécessite pas d'authentification
  return {};
};
