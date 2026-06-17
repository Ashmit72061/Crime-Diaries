const fs = require('fs');

const md = fs.readFileSync('../docs/Zone_Wise_List_of_Police_Stations.md', 'utf8');
const lines = md.split('\n').map(l => l.trim()).filter(l => l);

const nodes = [];
let currentZone = null;
let currentRange = null;
let currentDistrict = null;
let currentSubdiv = null;
let psCountInDistrict = 0;

nodes.push({ id: 'HQ', node_type: 'HQ', name_en: 'Delhi Police HQ', name_hi: 'दिल्ली पुलिस मुख्यालय', parent_id: null });

function generateCode(name, type) {
    return `${type}_${name.replace(/[^A-Z0-9]/ig, '').substring(0, 8).toUpperCase()}`;
}

for (const line of lines) {
    if (line.startsWith('## ')) {
        const name = line.replace('## ', '');
        currentZone = {
            id: `ZONE_${name.replace(/[^A-Z]/g, '')}`,
            node_type: 'SCP',
            name_en: name,
            name_hi: name, // simplify
            parent_id: 'HQ'
        };
        nodes.push(currentZone);
    } else if (line.startsWith('### ')) {
        const name = line.replace('### ', '').replace(/^\d+\.\s*/, '');
        currentRange = {
            id: `RANGE_${name.replace(/[^A-Z]/g, '')}`,
            node_type: 'JCP',
            name_en: name,
            name_hi: name,
            parent_id: currentZone.id
        };
        nodes.push(currentRange);
    } else if (line.startsWith('#### ')) {
        const nameMatch = line.match(/#### (.*?) \((.*?)\)/);
        let name = line.replace('#### ', '');
        let shortName = name.replace(/[^A-Z]/g, '');
        if (nameMatch) {
            name = nameMatch[1];
            shortName = nameMatch[2];
        }
        currentDistrict = {
            id: `DIST_${shortName}`,
            node_type: 'DISTRICT',
            name_en: name,
            name_hi: name,
            parent_id: currentRange.id
        };
        nodes.push(currentDistrict);
        psCountInDistrict = 0;
    } else if (line.startsWith('* ')) {
        let name = line.replace('* ', '');
        
        // Every 5 PS, create a new Sub-Division
        if (psCountInDistrict % 5 === 0) {
            let subdivName = `${name} Sub-Division`;
            if (name === 'PS Cyber Crime') subdivName = `Cyber Sub-Division (${currentDistrict.name_en})`;
            
            currentSubdiv = {
                id: `SUBDIV_${currentDistrict.id}_${Math.floor(psCountInDistrict/5)}`,
                node_type: 'SUB_DIVISION',
                name_en: subdivName,
                name_hi: subdivName,
                parent_id: currentDistrict.id
            };
            nodes.push(currentSubdiv);
        }
        
        let nodeName = name.startsWith('PS ') ? name : `PS ${name}`;
        nodes.push({
            id: `PS_${currentDistrict.id.replace('DIST_', '')}_${name.replace(/[^A-Z0-9]/ig, '').toUpperCase()}`,
            node_type: 'PS',
            name_en: nodeName,
            name_hi: nodeName,
            parent_id: currentSubdiv.id
        });
        psCountInDistrict++;
    }
}

const migrationCode = `export async function up(knex) {
  const nodes = ${JSON.stringify(nodes, null, 2)};
  
  // Insert in chunks and ignore conflicts
  await knex('hierarchy_nodes').insert(nodes.map(n => ({
      ...n,
      code: n.id,
      is_active: true
  }))).onConflict('id').ignore();
}

export async function down(knex) {
    // Only delete nodes that were added by this migration
    // To be safe, we won't delete here to avoid cascading deletes of records.
}
`;

fs.writeFileSync('../backend/migrations/20260620000000_full_delhi_hierarchy.js', migrationCode);
console.log('Migration generated.');
