import Surreal from 'surrealdb';

const db = new Surreal();

export async function initDB() {
  try {
    // Connexion à SurrealDB
    await db.connect('http://localhost:8000/rpc', {
      namespace: 'papaours',
      database: 'dbpapaours',
      auth: {
        username: 'root',
        password: 'root'
      }
    });
    
    console.log('✅ Connected to SurrealDB');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to SurrealDB:', error);
    throw error;
  }
}

export { db };
