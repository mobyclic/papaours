import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { connectDB } from "$lib/db";

export const POST = async ({ request, cookies, locals }: RequestEvent) => {
  try {
    // Récupérer l'utilisateur depuis locals (hooks) ou cookie ou header
    let currentUser = (locals as any).user;
    
    if (!currentUser) {
      const userCookie = cookies.get('user');
      if (userCookie) {
        try {
          currentUser = JSON.parse(userCookie);
        } catch (e) {
          // ignore
        }
      }
    }
    
    if (!currentUser) {
      // Essayer depuis le body si fourni
      const body = await request.clone().json().catch(() => ({}));
      if (body.userId) {
        currentUser = { id: body.userId };
      }
    }
    
    if (!currentUser) {
      return error(401, { message: 'Non authentifié' });
    }

    const userId = currentUser.id;
    if (!userId) {
      return error(401, { message: 'Utilisateur non trouvé' });
    }

    const body = await request.json();
    const { nom, prenom, identifiant, date_naissance, identifiant_tuteur } = body;

    const db = await connectDB();

    // Construire les champs à mettre à jour (uniquement ceux fournis)
    const updates: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (nom !== undefined) updates.nom = nom;
    if (prenom !== undefined) updates.prenom = prenom;
    if (identifiant !== undefined) updates.identifiant = identifiant;
    if (date_naissance !== undefined) updates.date_naissance = date_naissance;
    if (identifiant_tuteur !== undefined) updates.identifiant_tuteur = identifiant_tuteur;

    // Construire le name à partir de prenom + nom si fournis
    if (prenom || nom) {
      updates.name = [prenom, nom].filter(Boolean).join(' ');
    }

    // Nettoyer l'ID (enlever le préfixe "user:" si présent)
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;

    // Mise à jour dans la base de données
    const result = await db.query(
      `UPDATE user:${cleanId} SET ${Object.keys(updates).map(k => `${k} = $${k}`).join(', ')} RETURN *`,
      updates
    );

    const updatedUser = Array.isArray(result[0]) ? result[0][0] : result[0];

    if (!updatedUser) {
      return error(404, { message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour le cookie avec les nouvelles données
    const userForCookie = {
      ...currentUser,
      ...updates,
      id: userId
    };
    
    cookies.set('user', JSON.stringify(userForCookie), {
      path: '/',
      httpOnly: false, // Accessible côté client pour le store
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 semaine
    });

    return json({ 
      success: true, 
      user: userForCookie 
    });
  } catch (e) {
    console.error('Update profile error:', e);
    return error(500, { message: 'Erreur lors de la mise à jour du profil' });
  }
};
