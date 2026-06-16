import { db, connectDB } from '../src/config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../src/utils/logger.js';

function slugify(text) {
  if (!text) return 'field';
  return text.toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

function determineFieldType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('photo') || lower.includes('image')) return 'FILE';
  if (lower.includes('date') || lower.includes('time')) return 'DATETIME';
  if (lower.includes('gist') || lower.includes('brief') || lower.includes('address') || lower.includes('details') || lower.includes('remarks')) return 'TEXTAREA';
  if (lower.includes('gender') || lower.includes('status')) return 'SELECT';
  return 'TEXT';
}

function generateFields(recordType, headers, sectionMap = 'basic_details') {
  return headers.map((header, index) => {
    // Skip serial numbers or empty
    if (!header || header.trim() === '' || header.includes('S.No.') || header.includes('S No') || header.includes('S. No.')) return null;
    
    const isPhoto = header.toLowerCase().includes('photo');
    const isRequired = !isPhoto; // Make photo optional per user request, others required by default

    return {
      field_key: slugify(header),
      field_type: determineFieldType(header),
      applicable_record_types: [recordType],
      label_en: header.replace(/[\r\n]+/g, ' ').trim(),
      label_hi: header.replace(/[\r\n]+/g, ' ').trim(), // Just using English as fallback for prototype
      validation_rules: JSON.stringify(isRequired ? { required: true } : {}),
      section: sectionMap,
      sort_order: (index + 1) * 10
    };
  }).filter(Boolean);
}

const arrestHeaders = [
  "FIR / DD No. With Date and Time, Section of Law",
  "Act & Sections",
  "Name, Address of Persons Arrested/Detained",
  "Date and Time of Arrest ",
  "Place of Arrest ",
  "Name, Address & Tel  No. to Whom Information given",
  "Whether NAFIS, Dossier, Search Slip Prepared ",
  "Whether Given Address is Found Correct or Not",
  " Name and Rank of Address Verifying Officer",
  "Accused Photo",
  "Crime Head "
];

const pcrHeaders = [
  "GD No. Date & Time",
  "Head",
  "Name & Address of Complainant",
  "PCR Call Gist",
  "Name of IO/EO",
  "Action taken Brief",
  "Status",
  "Arrival DD No. Date & Time"
];

const caseHeaders = [
  "UID",
  "Local Head",
  "FIR No & Date",
  "Under Section",
  "Time",
  "Beat No",
  "District",
  "Police Station",
  "Date & Place of Occurance",
  "Brief Fact Of The Case",
  "Property (Stolen Recovered)",
  "Name & Address Of Complainant",
  "Name & Address Of Accused",
  "Date Of Arrest",
  "Name Of IO",
  "PIS No of IO",
  "Mobile No of IO",
  "Status/Remarks",
  "CASE Type",
  "SID No",
  "CCTNS"
];

const uidbHeaders = [
  "District",
  "Police Station",
  "DD No., Date & Time",
  "Duty Officer",
  "I.O.",
  "Informant",
  "Found Place",
  "UIDB Date",
  "Personal Description Details",
  "Gender",
  "Status",
  "ZIPNET No.",
  "Is Identified"
];

const missingHeaders = [
  "DD No.",
  " Date & Time",
  "Duty Officer",
  "I.O.",
  "Informed by",
  "Missing Place",
  "Missing Date",
  "Personal Description Details",
  "Gender",
  "Track The Missing Child No.",
  "Track The Missing Child Date",
  "Major/Minor",
  "Age",
  "Status",
  "ZIPNET No.",
  "If Traced DD No.",
  "Fir No./Year",
  "Fir Date"
];

const seedFields = async () => {
  await connectDB();
  try {
    logger.info('Clearing existing field registry...');
    await db('field_registry').del();

    logger.info('Preparing Master Fields...');
    
    const allFields = [
      ...generateFields('ARREST', arrestHeaders),
      ...generateFields('PCR_CALL', pcrHeaders),
      ...generateFields('CASE', caseHeaders),
      ...generateFields('UIDB', uidbHeaders),
      ...generateFields('MISSING', missingHeaders)
    ];

    const uniqueFieldsMap = new Map();
    for (const field of allFields) {
      if (uniqueFieldsMap.has(field.field_key)) {
        const existing = uniqueFieldsMap.get(field.field_key);
        // Merge applicable record types
        existing.applicable_record_types = [...new Set([...existing.applicable_record_types, ...field.applicable_record_types])];
      } else {
        uniqueFieldsMap.set(field.field_key, field);
      }
    }

    const fieldsToInsert = Array.from(uniqueFieldsMap.values()).map(field => ({
      id: uuidv4(),
      ...field,
      applicable_record_types: field.applicable_record_types
    }));

    await db('field_registry').insert(fieldsToInsert);
    logger.info(`Successfully seeded ${fieldsToInsert.length} fields from Master Sheet.`);
    
  } catch (error) {
    logger.error(`Field seed failed: ${error.message}`);
  } finally {
    await db.destroy();
    process.exit(0);
  }
};

seedFields();
