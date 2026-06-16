const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'controllers', 'analytics.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// The block to insert for explicit districts and subdivisions
const filtersStr = `
  const explicitDistricts = req.query.districts ? req.query.districts.split(',') : null;
  if (explicitDistricts && explicitDistricts.length > 0) {
    whereClause += \` AND m.district_id IN (\${explicitDistricts.map(() => '?').join(',')})\`;
    params.push(...explicitDistricts);
  }

  const explicitSubDivs = req.query.subDivisions ? req.query.subDivisions.split(',') : null;
  if (explicitSubDivs && explicitSubDivs.length > 0) {
    whereClause += \` AND ps.sub_division_id IN (\${explicitSubDivs.map(() => '?').join(',')})\`;
    params.push(...explicitSubDivs);
  }

  const explicitStations = req.query.stations ? req.query.stations.split(',') : null;
  if (explicitStations && explicitStations.length > 0) {
    whereClause += \` AND m.ps_id IN (\${explicitStations.map(() => '?').join(',')})\`;
    params.push(...explicitStations);
  }
`;

// Replace all occurrences of the old explicitStations block with the new filtersStr
content = content.replace(/  const explicitStations = req\.query\.stations \? req\.query\.stations\.split\(\',\'\) : null;\s*if \(explicitStations && explicitStations\.length > 0\) \{\s*whereClause \+= ` AND m\.ps_id IN \(\$\{explicitStations\.map\(\(\) => '\?'\)\.join\(\',\'\)\}\)`;\s*params\.push\(\.\.\.explicitStations\);\s*\}/g, filtersStr.trim());

// For getSummaryCounts, handle beat specifically
content = content.replace(
  /  \/\/ Count Cases\s*const casesQuery = `\s*SELECT COUNT\(\*\) as count FROM cases c \s*JOIN daily_records_meta m ON c\.meta_id = m\.id\s*JOIN police_stations ps ON m\.ps_id = ps\.id\s*\$\{whereClause\}\s*`;\s*const casesResult = await db\.get\(casesQuery, params\);/g,
  `  // Count Cases
  let casesWhere = whereClause;
  let casesParams = [...params];
  const explicitBeats = req.query.beats ? req.query.beats.split(',').map(b => b.trim()) : null;
  if (explicitBeats && explicitBeats.length > 0) {
    casesWhere += \` AND c.beat_no IN (\${explicitBeats.map(() => '?').join(',')})\`;
    casesParams.push(...explicitBeats);
  }
  const casesQuery = \`
    SELECT COUNT(*) as count FROM cases c 
    JOIN daily_records_meta m ON c.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    \${casesWhere}
  \`;
  const casesResult = await db.get(casesQuery, casesParams);`
);

// For the rest, append beat filter if recordType === 'cases'
const beatFilterStr = `
  const explicitBeats = req.query.beats ? req.query.beats.split(',').map(b => b.trim()) : null;
  if (explicitBeats && explicitBeats.length > 0 && recordType === 'cases') {
    whereClause += \` AND c.beat_no IN (\${explicitBeats.map(() => '?').join(',')})\`;
    params.push(...explicitBeats);
  }
`;

// Insert beatFilterStr before `let query = '';` in getTrends, getComparisons, exportAnalytics
content = content.replace(/  let query = '';/g, beatFilterStr + '\n  let query = \'\';');
content = content.replace(/  let headers = \[\];/g, beatFilterStr + '\n  let headers = [];');

// Add 'beat' to compareAxis logic in getComparisons
const beatRollupPre = `  } else if (compareAxis === 'beat' && recordType === 'cases') {
    const uniqueBeats = new Set();
    records.forEach(r => {
      if (r.beat_no) uniqueBeats.add(r.beat_no);
    });
    uniqueBeats.forEach(b => {
      rollups[b] = { key: b, label: \`Beat \${b}\`, total: 0, classifications: {} };
    });
  }`;
content = content.replace(/    \}\)\;\s*\}\s*records\.forEach\(\(rec\) => \{/g, `    });\n${beatRollupPre}\n  }\n\n  records.forEach((rec) => {`);

const beatRollupMap = `    } else if (compareAxis === 'beat' && recordType === 'cases') {
      groupKey = rec.beat_no || 'unknown';
      groupLabel = rec.beat_no ? \`Beat \${rec.beat_no}\` : 'No Beat Assigned';
      if (!rollups[groupKey]) {
          rollups[groupKey] = { key: groupKey, label: groupLabel, total: 0, classifications: {} };
      }`;
content = content.replace(/      groupLabel = rec\.ps_name;\s*\}/g, `      groupLabel = rec.ps_name;\n${beatRollupMap}\n    }`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated analytics.controller.js');
