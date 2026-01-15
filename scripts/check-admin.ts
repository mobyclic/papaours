import { connectDB } from '../src/lib/db';

async function checkAdmin() {
  try {
    const db = await connectDB();
    console.log('\n🔍 Vérification de l\'admin dans la base de données...\n');
    
    // Récupérer tous les admins
    const allAdmins = await db.query('SELECT * FROM admin');
    console.log('📋 Tous les admins:', JSON.stringify(allAdmins, null, 2));
    
    // Tester la recherche exacte comme dans l'API
    const email = 'alistair.marca@gmail.com';
    const password = 'n1n@S1mone';
    
    const loginTest = await db.query(
      'SELECT * FROM admin WHERE email = $email AND password = $password',
      { email, password }
    );
    console.log('\n🔐 Test de connexion:', JSON.stringify(loginTest, null, 2));
    
    if (loginTest[0]?.result?.length > 0) {
      console.log('\n✅ Connexion réussie !');
    } else {
      console.log('\n❌ Connexion échouée - identifiants incorrects');
      
      // Test avec juste l'email
      const emailOnly = await db.query(
        'SELECT * FROM admin WHERE email = $email',
        { email }
      );
      console.log('\n📧 Test email seul:', JSON.stringify(emailOnly, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkAdmin();
