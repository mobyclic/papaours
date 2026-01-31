/**
 * Service d'envoi d'emails via Resend
 * Documentation: https://resend.com/docs
 */
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';

// Initialisation du client Resend
const resend = new Resend(RESEND_API_KEY);

// Configuration
// En dev, utiliser l'adresse de test Resend (pas besoin de domaine vérifié)
// En prod, remplacer par ton domaine vérifié
const FROM_EMAIL = dev 
  ? 'Kwizy <onboarding@resend.dev>' 
  : 'Kwizy <noreply@kwizy.fr>';
const APP_NAME = 'Kwizy';
const APP_URL = dev ? 'http://localhost:5173' : 'https://kwizy.fr';

// Types
export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ============================================
// TEMPLATES HTML
// ============================================

function baseTemplate(content: string, preheader: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #6366f1; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #5558e3; }
    .code-box { background: #f3f4f6; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; font-family: monospace; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="container">
    <div class="header">
      <h1>🎓 ${APP_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>${APP_NAME} - Apprendre en s'amusant</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// FONCTIONS D'ENVOI
// ============================================

/**
 * Envoyer un email de réinitialisation de mot de passe (tuteurs)
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  userName: string
): Promise<EmailResult> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  
  const html = baseTemplate(`
    <h2>Réinitialisation de votre mot de passe</h2>
    <p>Bonjour ${userName},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe sur ${APP_NAME}.</p>
    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
    </p>
    <p style="font-size: 14px; color: #6b7280;">
      Ce lien expire dans <strong>1 heure</strong>.<br>
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
      Lien direct : <a href="${resetUrl}">${resetUrl}</a>
    </p>
  `, 'Réinitialisez votre mot de passe Kwizy');

  return sendEmail(to, 'Réinitialisation de votre mot de passe', html);
}

/**
 * Envoyer une invitation à un apprenant (de la part d'un tuteur)
 */
export async function sendStudentInviteEmail(
  to: string,
  studentName: string,
  tutorName: string,
  inviteCode: string
): Promise<EmailResult> {
  const joinUrl = `${APP_URL}/?invite=${inviteCode}`;
  
  const html = baseTemplate(`
    <h2>🎉 Tu es invité(e) sur ${APP_NAME} !</h2>
    <p>Bonjour ${studentName},</p>
    <p><strong>${tutorName}</strong> t'invite à rejoindre ${APP_NAME} pour apprendre en t'amusant avec des quiz interactifs !</p>
    
    <div class="code-box">
      <p style="margin: 0 0 10px 0; color: #6b7280;">Ton code d'invitation :</p>
      <div class="code">${inviteCode}</div>
    </div>
    
    <p style="text-align: center;">
      <a href="${joinUrl}" class="button">Rejoindre ${APP_NAME}</a>
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      Tu pourras créer ton compte avec un pseudo et un code secret à 4 chiffres facile à retenir.
    </p>
  `, `${tutorName} t'invite sur Kwizy !`);

  return sendEmail(to, `${tutorName} t'invite sur ${APP_NAME} !`, html);
}

/**
 * Envoyer un email de bienvenue au tuteur
 */
export async function sendTutorWelcomeEmail(
  to: string,
  tutorName: string
): Promise<EmailResult> {
  const html = baseTemplate(`
    <h2>Bienvenue sur ${APP_NAME} ! 👨‍🏫</h2>
    <p>Bonjour ${tutorName},</p>
    <p>Votre compte tuteur a été créé avec succès. Vous pouvez maintenant :</p>
    <ul>
      <li>📚 <strong>Créer vos propres quiz</strong> personnalisés pour vos élèves</li>
      <li>👥 <strong>Inviter des apprenants</strong> à rejoindre votre groupe</li>
      <li>📊 <strong>Suivre leur progression</strong> et leurs résultats</li>
      <li>🔍 <strong>Explorer la bibliothèque</strong> de quiz publics</li>
    </ul>
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">Accéder à mon espace</a>
    </p>
    <p style="font-size: 14px; color: #6b7280;">
      Besoin d'aide ? Consultez notre <a href="${APP_URL}/faq">FAQ</a> ou contactez-nous.
    </p>
  `, 'Bienvenue sur Kwizy !');

  return sendEmail(to, `Bienvenue sur ${APP_NAME}, ${tutorName} !`, html);
}

/**
 * Notifier un tuteur quand un apprenant rejoint son groupe
 */
export async function sendStudentJoinedEmail(
  to: string,
  tutorName: string,
  studentName: string,
  studentPseudo: string
): Promise<EmailResult> {
  const html = baseTemplate(`
    <h2>Nouvel apprenant dans votre groupe ! 🎉</h2>
    <p>Bonjour ${tutorName},</p>
    <p><strong>${studentName}</strong> (pseudo: <code>${studentPseudo}</code>) vient de rejoindre votre groupe sur ${APP_NAME}.</p>
    <p style="text-align: center;">
      <a href="${APP_URL}/tutor/students" class="button">Voir mes apprenants</a>
    </p>
  `, `${studentName} a rejoint votre groupe !`);

  return sendEmail(to, `${studentName} a rejoint votre groupe sur ${APP_NAME}`, html);
}

/**
 * Email de notification générique
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  message: string,
  ctaText?: string,
  ctaUrl?: string
): Promise<EmailResult> {
  let ctaHtml = '';
  if (ctaText && ctaUrl) {
    ctaHtml = `
      <p style="text-align: center;">
        <a href="${ctaUrl}" class="button">${ctaText}</a>
      </p>
    `;
  }
  
  const html = baseTemplate(`
    <h2>${title}</h2>
    ${message}
    ${ctaHtml}
  `, subject);

  return sendEmail(to, subject, html);
}

// ============================================
// FONCTION D'ENVOI PRINCIPALE
// ============================================

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    // Mode développement : log sans envoyer si pas de clé API
    if (!RESEND_API_KEY || RESEND_API_KEY === 'test' || RESEND_API_KEY.startsWith('re_test')) {
      console.log('📧 [DEV] Email simulé:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   (Email non envoyé - mode développement)`);
      return { success: true, id: 'dev-mode' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    if (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email envoyé à ${to} (ID: ${data?.id})`);
    return { success: true, id: data?.id };
    
  } catch (err) {
    console.error('❌ Exception envoi email:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    };
  }
}

// Export pour tests
export { sendEmail };
