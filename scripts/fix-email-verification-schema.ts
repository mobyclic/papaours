/**
 * Fix email_verification schema
 * Remove verification_token (link-based flow)
 * Use verification_code only (OTP flow)
 */
import Surreal from 'surrealdb';

async function migrate() {
  console.log('🚀 Fix email_verification schema\n');
  
  const db = new Surreal();
  await db.connect('wss://gentle-island-06di2pv2c9po3a8euttd1alkek.aws-euw1.surreal.cloud/rpc', {
    namespace: 'papaours',
    database: 'dbpapaours',
  });
  await db.signin({ username: 'rootuser', password: 'n1n@S1mone' });
  
  try {
    console.log('📦 Updating email_verification fields...');
    
    // Remove verification_token field and index
    await db.query(`REMOVE FIELD IF EXISTS verification_token ON email_verification;`);
    await db.query(`REMOVE INDEX IF EXISTS idx_verification_token ON email_verification;`);
    console.log('✅ verification_token removed');
    
    // Make verification_code required
    await db.query(`DEFINE FIELD OVERWRITE verification_code ON email_verification TYPE string;`);
    await db.query(`DEFINE INDEX IF NOT EXISTS idx_verification_code ON email_verification FIELDS verification_code;`);
    console.log('✅ verification_code is now required');

    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await db.close();
  }
}

migrate();
