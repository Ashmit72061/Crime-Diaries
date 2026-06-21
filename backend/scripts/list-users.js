import db from '../src/config/db.js';

try {
  const users = await db.select('id','badge_no','username','name_en','name_hi','role').from('users');
  console.log('Users in DB:', users);
} catch (err) {
  console.error('Failed to query users:', err.message);
} finally {
  await db.destroy();
}
