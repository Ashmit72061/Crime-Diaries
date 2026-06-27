import db from '../src/config/db.js';

async function run() {
  try {
    const districts = await db('hierarchy_nodes').where('node_type', 'DISTRICT');
    const subdivisions = await db('hierarchy_nodes').where('node_type', 'SUB_DIVISION');
    const stations = await db('hierarchy_nodes').where('node_type', 'PS');

    console.log(`=== DB hierarchy_nodes Audit ===`);
    console.log(`Districts: ${districts.length}`);
    districts.forEach(d => console.log(`  - ${d.id} (${d.name_en})`));

    console.log(`Sub-divisions: ${subdivisions.length}`);
    console.log(`Police Stations: ${stations.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error running audit:', err);
    process.exit(1);
  }
}

run();