import db from '../src/config/db.js';

async function countSQL() {
  try {
    const districtsCount = await db('hierarchy_nodes')
      .where({ node_type: 'DISTRICT' })
      .count('* as count');
      
    const stationsCount = await db('hierarchy_nodes')
      .where({ node_type: 'PS' })
      .count('* as count');
      
    const usersCount = await db('users')
      .count('* as count');

    console.log('--- SQL COUNTS FROM POSTGRESQL ---');
    console.log(`SQL count of districts: ${districtsCount[0].count}`);
    console.log(`SQL count of police stations (PS): ${stationsCount[0].count}`);
    console.log(`SQL count of users: ${usersCount[0].count}`);

    console.log('\nDistricts in DB:');
    const districts = await db('hierarchy_nodes').where({ node_type: 'DISTRICT' }).select('id', 'name_en');
    districts.forEach(d => console.log(`- ${d.id}: ${d.name_en}`));

    console.log('\nUsers in DB:');
    const users = await db('users').select('id', 'username', 'role');
    users.forEach(u => console.log(`- ${u.id} (${u.username}): role = ${u.role}`));

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await db.destroy();
  }
}

countSQL();
