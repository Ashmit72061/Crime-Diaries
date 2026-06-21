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
  if (lower.includes('date') || lower.includes('time')) return 'DATE'; // Using DATE for better form calendar binding
  if (lower.includes('gist') || lower.includes('brief') || lower.includes('address') || lower.includes('details') || lower.includes('remarks')) return 'TEXTAREA';
  if (lower.includes('gender') || lower.includes('status') || lower.includes('major/minor') || lower.includes('is identified') || lower.includes('head')) return 'SELECT';
  return 'TEXT';
}

const translations = {
  // Cases Master
  "uid": { en: "UID (Auto-generated)", hi: "यूआईडी (स्व-उत्पन्न)" },
  "local_head": { en: "Local Head", hi: "स्थानीय मद" },
  "fir_no_date": { en: "FIR No & Date", hi: "प्राथमिकी (FIR) संख्या और तिथि" },
  "under_section": { en: "Under Section", hi: "धारा के तहत" },
  "time": { en: "Time", hi: "समय" },
  "beat_no": { en: "Beat No", hi: "बीट संख्या" },
  "district": { en: "District", hi: "ज़िला" },
  "police_station": { en: "Police Station", hi: "थाना" },
  "date_place_of_occurance": { en: "Date & Place of Occurance", hi: "घटना की तिथि और स्थान" },
  "brief_fact_of_the_case": { en: "Brief Fact Of The Case", hi: "मामले का संक्षिप्त तथ्य" },
  "property_stolen_recovered": { en: "Property (Stolen Recovered)", hi: "संपत्ति (चोरी/बरामद)" },
  "name_address_of_complainant": { en: "Name & Address Of Complainant", hi: "शिकायतकर्ता का नाम और पता" },
  "name_address_of_accused": { en: "Name & Address Of Accused", hi: "आरोपी का नाम और पता" },
  "date_of_arrest": { en: "Date Of Arrest", hi: "गिरफ्तारी की तिथि" },
  "name_of_io": { en: "Name Of IO", hi: "जांच अधिकारी (IO) का नाम" },
  "pis_no_of_io": { en: "PIS No of IO", hi: "जांच अधिकारी का पीआईएस संख्या" },
  "mobile_no_of_io": { en: "Mobile No of IO", hi: "जांच अधिकारी का मोबाइल संख्या" },
  "status_remarks": { en: "Status/Remarks", hi: "स्थिति/टिप्पणियां" },
  "case_type": { en: "CASE Type", hi: "मामले का प्रकार" },
  "sid_no": { en: "SID No", hi: "एसिड संख्या (SID No)" },
  "cctns": { en: "CCTNS No.", hi: "सीसीटीएनएस संख्या" },

  // Arrest Person
  "fir_dd_no_with_date_and_time_section_of_law": { en: "FIR / DD No. With Date, Time & Section", hi: "प्राथमिकी / डीडी संख्या तिथि, समय और धारा के साथ" },
  "act_sections": { en: "Act & Sections", hi: "अधिनियम और धाराएं" },
  "name_address_of_persons_arrested_detained": { en: "Name, Address of Persons Arrested/Detained", hi: "गिरफ्तार/हिरासत में लिए गए व्यक्तियों का नाम और पता" },
  "date_and_time_of_arrest": { en: "Date and Time of Arrest", hi: "गिरफ्तारी की तिथि और समय" },
  "place_of_arrest": { en: "Place of Arrest", hi: "गिरफ्तारी का स्थान" },
  "name_address_tel_no_to_whom_information_given": { en: "Name, Address & Tel No. to Whom Information given", hi: "उस व्यक्ति का नाम, पता और फोन नंबर जिसे सूचना दी गई" },
  "whether_nafis_dossier_search_slip_prepared": { en: "Whether NAFIS, Dossier, Search Slip Prepared", hi: "क्या नेफिस (NAFIS), डोजियर, सर्च स्लिप तैयार की गई है" },
  "whether_given_address_is_found_correct_or_not": { en: "Whether Given Address is Found Correct or Not", hi: "क्या दिया गया पता सही पाया गया या नहीं" },
  "name_and_rank_of_address_verifying_officer": { en: "Name and Rank of Address Verifying Officer", hi: "पता सत्यापित करने वाले अधिकारी का नाम और पद" },
  "accused_photo": { en: "Accused Photo", hi: "आरोपी का फोटो" },
  "crime_head": { en: "Crime Head", hi: "अपराध मद" },

  // PCR Call
  "gd_no_date_time": { en: "GD No. Date & Time", hi: "डीडी/जीडी संख्या तिथि और समय" },
  "head": { en: "Head", hi: "शीर्ष (मद)" },
  "pcr_call_gist": { en: "PCR Call Gist", hi: "पीसीआर कॉल का संक्षिप्त विवरण" },
  "name_of_io_eo": { en: "Name of IO/EO", hi: "जांच अधिकारी/पूछताछ अधिकारी का नाम" },
  "action_taken_brief": { en: "Action taken Brief", hi: "की गई कार्रवाई का संक्षिप्त विवरण" },
  "status": { en: "Status", hi: "स्थिति" },
  "arrival_dd_no_date_time": { en: "Arrival DD No. Date & Time", hi: "आगमन डीडी संख्या तिथि और समय" },

  // Missing Person
  "dd_no": { en: "DD No.", hi: "डीडी संख्या" },
  "date_time": { en: "Date & Time", hi: "तिथि और समय" },
  "duty_officer": { en: "Duty Officer", hi: "ड्यूटी अधिकारी" },
  "i_o": { en: "I.O.", hi: "जांच अधिकारी (I.O.)" },
  "informed_by": { en: "Informed by", hi: "सूचना देने वाले का नाम" },
  "missing_place": { en: "Missing Place", hi: "लापता होने का स्थान" },
  "missing_date": { en: "Missing Date", hi: "लापता होने की तिथि" },
  "personal_description_details": { en: "Personal Description Details", hi: "व्यक्तिगत हुलिए का विवरण" },
  "gender": { en: "Gender", hi: "लिंग" },
  "track_the_missing_child_no": { en: "Track The Missing Child No.", hi: "ट्रैक द मिसिंग चाइल्ड संख्या" },
  "track_the_missing_child_date": { en: "Track The Missing Child Date", hi: "ट्रैक द मिसिंग चाइल्ड तिथि" },
  "major_minor": { en: "Major/Minor", hi: "वयस्क / नाबालिग" },
  "age": { en: "Age", hi: "उम्र" },
  "zipnet_no": { en: "ZIPNET No.", hi: "जिपनेट (ZIPNET) संख्या" },
  "if_traced_dd_no": { en: "If Traced DD No.", hi: "यदि मिल गया हो तो डीडी संख्या" },
  "fir_no_year": { en: "Fir No./Year", hi: "प्राथमिकी संख्या/वर्ष" },
  "fir_date": { en: "Fir Date", hi: "प्राथमिकी तिथि" },

  // UIDB
  "informant": { en: "Informant", hi: "सूचना देने वाला" },
  "found_place": { en: "Found Place", hi: "मिलने का स्थान" },
  "uidb_date": { en: "UIDB Date", hi: "यूआईडीबी तिथि (UIDB Date)" },
  "is_identified": { en: "Is Identified", hi: "क्या पहचान हो गई है?" },
  "case_reg_type": { en: "Case Registration Type", hi: "मामला पंजीकरण प्रकार" },
  "complainant_parent_name": { en: "Complainant Parent Name", hi: "शिकायतकर्ता के माता/पिता का नाम" },
  "complainant_age": { en: "Complainant Age", hi: "शिकायतकर्ता की आयु" },
  "accused_parent_name": { en: "Accused Parent Name", hi: "आरोपी के माता/पिता का नाम" },
  "accused_age": { en: "Accused Age", hi: "आरोपी की आयु" },
  "stolen_property": { en: "Stolen Property", hi: "चोरी की गई संपत्ति" },
  "recovered_property": { en: "Recovery Property", hi: "बरामद की गई संपत्ति" },
  "arresting_officer": { en: "Arresting Officer", hi: "गिरफ्तार करने वाले अधिकारी" },
  "arrest_time": { en: "Time of Arrest", hi: "गिरफ्तारी का समय" },
  "arrested_age": { en: "Age", hi: "आयु" },
  "arresting_officer_mobile": { en: "Contact of Arresting Officer", hi: "गिरफ्तार करने वाले अधिकारी का मोबाइल" },
  "io_mobile": { en: "Contact of IO", hi: "जांच अधिकारी का मोबाइल" },
  "is_po": { en: "Is the person PO", hi: "क्या व्यक्ति घोषित अपराधी (PO) है" },
  "missing_type": { en: "Missing / Found Type", hi: "लापता / मिला प्रकार" },
  "pcr_call_flag": { en: "PCR Call (Y/N)", hi: "पीसीआर कॉल (हाँ/नहीं)" },
  "operator_name": { en: "Operator Name to Whom MPS", hi: "ऑपरेटर का नाम जिसे एमपीएस भेजा गया" },
  "beard": { en: "Beard", hi: "दाढ़ी" },
  "upper_dress_color": { en: "Upper Dress Color", hi: "ऊपरी पोशाक का रंग" },
  "lower_dress_color": { en: "Lower Dress Color", hi: "निचली पोशाक का रंग" },
  "dd_date": { en: "DD Date", hi: "डीडी दिनांक" },
  "inquest_sections": { en: "Under Section (If inquest)", hi: "धारा के तहत (यदि जांच हो)" },
  "deceased_name": { en: "Name of Deceased", hi: "मृतक का नाम" },
  "deceased_address": { en: "Address of Deceased", hi: "मृतक का पता" },
  "filed_by_acp_sdm_date": { en: "Date of Filed by ACP/SDM", hi: "एसीपी/एसडीएम द्वारा दायर करने की तिथि" }
};

function getSectionForHeader(recordType, fieldKey) {
  const lower = fieldKey.toLowerCase();
  
  if (recordType === 'CASE') {
    if (lower.includes('uid') || lower.includes('local_head') || lower.includes('fir_no') || lower.includes('time') || lower.includes('beat') || lower.includes('district') || lower.includes('police_station') || lower.includes('case_type') || lower.includes('sid') || lower.includes('cctns')) {
      return 'basic_details';
    }
    if (lower.includes('occurance') || lower.includes('fact') || lower.includes('section') || lower.includes('property')) {
      return 'incident_details';
    }
    return 'investigation_details';
  }
  
  if (recordType === 'ARREST') {
    if (lower.includes('fir_dd_no') || lower.includes('act_sections') || lower.includes('crime_head')) {
      return 'basic_details';
    }
    if (lower.includes('arrest') || lower.includes('place')) {
      return 'incident_details';
    }
    return 'investigation_details';
  }
  
  if (recordType === 'PCR_CALL') {
    if (lower.includes('gd_no') || lower.includes('head') || lower.includes('complainant') || lower.includes('gist')) {
      return 'basic_details';
    }
    return 'investigation_details';
  }
  
  if (recordType === 'MISSING') {
    if (lower.includes('dd_no') || lower.includes('date_time') || lower.includes('officer') || lower.includes('informed') || lower.includes('status')) {
      return 'basic_details';
    }
    if (lower.includes('description') || lower.includes('gender') || lower.includes('age') || lower.includes('major_minor')) {
      return 'person_details';
    }
    return 'investigation_details';
  }
  
  if (recordType === 'UIDB') {
    if (lower.includes('district') || lower.includes('police_station') || lower.includes('dd_no') || lower.includes('officer') || lower.includes('informant') || lower.includes('status')) {
      return 'basic_details';
    }
    if (lower.includes('description') || lower.includes('gender') || lower.includes('identified')) {
      return 'person_details';
    }
    return 'investigation_details';
  }
  
  return 'basic_details';
}

function getOptionsForField(fieldKey) {
  if (fieldKey === 'local_head' || fieldKey === 'crime_head') {
    const heads = [
      "Simple Hurt", "Other IPC", "Other SLL", "Kidnapping", "Pick Pocketing", "Gambling Act", "Cruelty by Husband",
      "Simple Accident", "Narcotics Drugs & Psychotropic Substances Act", "Robbery", "Snatching", "Murder",
      "Delhi Excise Act", "Att. to Murder", "Burglary", "Arms Act", "Other Theft", "House Theft", "Night Burglary",
      "Rape", "Copyright Act", "Cheating", "Fatal Accident", "Child Labour Act 1986",
      "Att. to Culpable Homicide not Amounting to Murder", "Dowry Prohibition Act 1961", "Electricity Theft",
      "Information Technology Act 2000", "Grievous Hurt", "Electricity Act 2003", "Other Act", "Eve Teasing",
      "Trade & Merchandise Marks Act, 1958", "Mobile Phone Theft", "M.O. Women", "Theft In Shop", "POCSO Act 2012",
      "Wild Life (Protection) Act 1972", "Mischief", "Day Burglary", "Encroachment on Govt. Land", "Servant Theft",
      "Ext. For Ransom", "Extortion", "Counterfeiting", "Criminal Breach of Trust", "Criminal Intimidation",
      "Threatening", "Environment (Protection) Act 1986", "Affray", "Arson", "Abetment of Suicide",
      "Juvenile Justice Act 2015", "Adultery",
      "The Delhi Prevention of Touting and Malpractices Against Tourists Ordinance Act 2010",
      "Att. to Commit Suicide", "Acid Attack", "Explosive Act 1884", "Acid Attack Attempt",
      "Immoral Traffic(Prev.) Act, 1956 (SIT Act (Immoral))", "Trespass", "Delhi Police Act 1978",
      "Culpable Homicide not Amounting to Murder", "Fire Incident", "Dowry Death", "Organised Crime",
      "Maharashtra Control of Organised Crime Act 1999", "Misappropriation of property & cruelty by inlaws",
      "Forgery", "Receiver of Stolen Property", "Explosive Substances Act 1908", "Foreigners Act 1946",
      "Juvenile Justice Act 2000", "Miscarriage Etc.", "Prevention of Atrocities SC/ST Act 1989",
      "House/Criminal Trespass", "Abduction", "Protection of Women Domestic Violence Act 2005", "Dacoity",
      "Concealment of birth", "Riot", "Offence against Public Servant", "Stereo Theft",
      "wrongful Confinement/restraint", "Public Nuisance", "National Security Act 1980", "Impersonation",
      "Assault on Public Servant", "Passport Act 1967", "Terrorist Act",
      "Prevention of Damage of Public Property Act 1984", "M.V. Theft", "Drugging/ Poisoning",
      "Escape from Police Custody", "Civil Rights Act", "Election Offences", "Drugs and Cosmetics Act 1940",
      "Offences Relating to religion", "Essential Commodities Act 1955", "Central Motor Vehicles Rules 1989",
      "Motor Vehicle Act,1988", "Delhi Control of vehicular and Other Traffic on Road Act",
      "Prevention of Corruption Act 1988", "Delhi Preservation of Trees Act, 1994", "Juvenile Justice Act 2010",
      "Pre-conception and pre-natal diagnostic [pndt]", "Protection of human rights Act 1993", "Cycle Theft",
      "Sedition or Offences against State", "Poisons Act 1919", "Bombay Prevention of Begging Act 1959",
      "Child Marriage Restraint Act 1929", "Official Secrets Act,1923", "Un-Natural Death / Inquest Report",
      "Cattle Theft", "M.V. Accessories Theft", "Unlawful Activities (Prevention) Act 1967",
      "Personating public servant", "Unnatural Offences(SODOMY)"
    ];
    return heads.map(h => ({ value: h, label_en: h, label_hi: h }));
  }

  if (fieldKey === 'gender') {
    return [
      { value: 'male', label_en: 'Male', label_hi: 'पुरुष' },
      { value: 'female', label_en: 'Female', label_hi: 'महिला' },
      { value: 'other', label_en: 'Other', label_hi: 'अन्य' }
    ];
  }
  if (fieldKey === 'major_minor') {
    return [
      { value: 'major', label_en: 'Major', label_hi: 'वयस्क' },
      { value: 'minor', label_en: 'Minor', label_hi: 'नाबालिग' }
    ];
  }
  if (fieldKey === 'is_identified') {
    return [
      { value: 'yes', label_en: 'Yes', label_hi: 'हाँ' },
      { value: 'no', label_en: 'No', label_hi: 'नहीं' }
    ];
  }
  if (fieldKey === 'status') {
    return [
      { value: 'pending', label_en: 'Pending', label_hi: 'लंबित' },
      { value: 'resolved', label_en: 'Resolved', label_hi: 'सुलझाया हुआ' },
      { value: 'unresolved', label_en: 'Unresolved', label_hi: 'अनसुलझा' }
    ];
  }
  return null;
}

function generateFields(recordType, headers) {
  return headers.map((header, index) => {
    // Skip serial numbers or empty
    if (!header || header.trim() === '' || header.includes('S.No.') || header.includes('S No') || header.includes('S. No.')) return null;
    
    const key = slugify(header);
    const isPhoto = key.includes('photo') || key.includes('image');
    const isRequired = !isPhoto && !key.includes('zipnet') && !key.includes('track') && !key.includes('traced') && !key.includes('fir_no_year') && !key.includes('fir_date'); // Make secondary fields optional

    const section = getSectionForHeader(recordType, key);
    const translation = translations[key] || { en: header.replace(/[\r\n]+/g, ' ').trim(), hi: header.replace(/[\r\n]+/g, ' ').trim() };
    const options = getOptionsForField(key);

    return {
      field_key: key,
      field_type: determineFieldType(header),
      applicable_record_types: [recordType],
      label_en: translation.en,
      label_hi: translation.hi,
      validation_rules: JSON.stringify(isRequired ? { required: true } : {}),
      section: section,
      options: options ? JSON.stringify(options) : null,
      sort_order: (index + 1) * 10,
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']),
      editable_by_levels: JSON.stringify(['PS']),
      is_active: true,
      scope_level: 'global',
    };
  }).filter(Boolean);
}


const arrestHeaders = [
  "UID",
  "FIR NO./DD No.",
  "Crime Head",
  "U/S",
  "ACT/LAW",
  "ARRESTED PERSON (NAME)",
  "ARRESTED PERSON (PARENTS NAME)",
  "ARRESTED PERSON (ADDRESS)",
  "ARRESTED PERSON (AGE)",
  "Date of Arrest",
  "Time of Arrest",
  "Place of Arrest",
  "NAME OF IO",
  "Contact of IO",
  "Status of Arrest",
  "PREV. INVOLVEMENT (NO. OF CASES)",
  "Is the person PO",
  "SEIZURE",
  "WHETHER ACCUSED IS BC OR NOT",
  "NAFIS Prepared",
  "Dossier Prepared",
  "Arresting Officer",
  "Contact of AO",
  "ARRESTED IN (INTEGRATED PI)",
  "ARRESTED IN (GROUP PATROLLING)",
  "ARRESTED IN (CYCLE PATROLLING)",
  "ARRESTED IN (BY ANTI-SNATCHING TEAM)",
  "ARRESTED IN (BY PRAHARI)",
  "ARRESTED IN (BY EYES & EARS SCHEME MEMBERS)"
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
  "P.S.",
  "Case Reg. Type",
  "FIR NO.",
  "Crime Head",
  "U/S",
  "ACT/LAW",
  "DETAILS OF COMPLAINANT (NAME)",
  "DETAILS OF COMPLAINANT (Parents NAME)",
  "DETAILS OF COMPLAINANT (Address)",
  "DATE OF OCCURRENCE",
  "TIME OF OCCURRENCE",
  "PLACE OF OCCURRENCE",
  "GIST",
  "ARRESTED PERSON (NAME)",
  "ARRESTED PERSON (PARENTS NAME)",
  "ARRESTED PERSON (ADDRESS)",
  "ARRESTED PERSON (AGE)",
  "Stolen Property",
  "Recovery Property",
  "Case status",
  "NAME OF IO",
  "CONTACT OF IO",
  "PIS No. OF IO"
];

const uidbHeaders = [
  "S.NO.",
  "DD NO.",
  "DD DATE",
  "U/S (If inquest)",
  "Name of Deceased",
  "Address of Deceased",
  "FOUND PLACE(with Lat. & Long.)",
  "FOUND DATE",
  "PHYSICAL DESCRIPTION (SEX)",
  "PHYSICAL DESCRIPTION (AGE)",
  "PHYSICAL DESCRIPTION (HEIGHT)",
  "PHYSICAL DESCRIPTION (BUILT)",
  "PHYSICAL DESCRIPTION (COMPLEXION)",
  "PHYSICAL DESCRIPTION (FACE)",
  "PHYSICAL DESCRIPTION (HAIR)",
  "PHYSICAL DESCRIPTION (BEARD)",
  "PHYSICAL DESCRIPTION (MUSTACHES)",
  "PHYSICAL DESCRIPTION (UPPER DRESS COLOR)",
  "PHYSICAL DESCRIPTION (LOWER DRESS COLOR)",
  "NAME OF I.O.",
  "Contact OF I.O.",
  "CAUSE OF DEATH",
  "IF filed by ACP/SDM"
];

const missingHeaders = [
  "S.NO.",
  "DD NO.",
  "DD DATE",
  "TYPE",
  "PCR Call",
  "NAME OF OPERATOR TO WHOM MPS",
  "NAME OF MISSING PERSON",
  "ADDRESS OF MISSING PERSON",
  "MISSING DATE",
  "Sex",
  "PHYSICAL DESCRIPTION (AGE)",
  "PHYSICAL DESCRIPTION (HEIGHT)",
  "PHYSICAL DESCRIPTION (BUILT)",
  "PHYSICAL DESCRIPTION (COMPLEXION)",
  "PHYSICAL DESCRIPTION (FACE)",
  "PHYSICAL DESCRIPTION (HAIR)",
  "PHYSICAL DESCRIPTION (BEARD)",
  "PHYSICAL DESCRIPTION (MUSTACHES)",
  "PHYSICAL DESCRIPTION (UPPER DRESS COLOR)",
  "PHYSICAL DESCRIPTION (LOWER DRESS COLOR)",
  "NAME OF I.O.",
  "Status"
];

const seedFields = async () => {
  await connectDB();
  try {
    // ── SKIPPED ──────────────────────────────────────────────────────────────
    // seed.js (run via `npm run db:seed`) is the authoritative source for
    // field_registry. This script previously wiped and replaced the registry
    // with stale headers, overwriting all fields added to seed.js.
    // It is now disabled so seed.js remains the sole source of truth.
    // ─────────────────────────────────────────────────────────────────────────
    logger.info('seed-fields.js: skipped — field_registry is managed by seeds/seed.js');
    return;

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
