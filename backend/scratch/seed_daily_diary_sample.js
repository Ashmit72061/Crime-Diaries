import { db, connectDB } from '../src/config/db.js';

async function main() {
  await connectDB();
  
  const targetDate = process.argv[2] || '2026-06-19';
  console.log(`Starting daily diary mock seeding for date: ${targetDate}...`);

  try {
    // 1. Fetch a valid user to avoid constraint errors
    const user = await db('users').where({ role: 'HC' }).first() || await db('users').first();
    if (!user) {
      console.error('No users found in database! Please seed users first.');
      process.exit(1);
    }
    const userId = user.id;
    const psId = user.station_id || 'PS_NDD_PARLIAMENTSTREET';
    const districtId = user.district_id || 'DIST_NDD';
    const subDivId = user.sub_div_id || 'SUBDIV_DIST_NDD_1';

    console.log(`Using User: ${user.username} (${userId}), PS: ${psId}, Dist: ${districtId}`);

    // 2. Clean existing seed records for this date / prefix
    console.log('Cleaning old test records...');
    await db('record_revisions').where('record_id', 'like', 'R_DD_TEST_%').del();
    await db('workflow_transitions').where('record_id', 'like', 'R_DD_TEST_%').del();
    await db('records').where('id', 'like', 'R_DD_TEST_%').del();

    const recordsToInsert = [];
    
    // --- CASES ---
    // Burglary e-FIR Case
    recordsToInsert.push({
      id: 'R_DD_TEST_C01',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'DISTRICT_REVIEW',
      current_level: 'DISTRICT',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'E-FIR/BURGLARY/2026/0001',
        sections: 'BNS 305',
        complainant_name: 'Amit Kumar',
        complainant_father_husband_name: 'Ram Kumar',
        complainant_parent_name: 'Ram Kumar',
        complainant_address: 'Flat 402, Sector 9, Delhi',
        occurrence_time: '02:30:00',
        occurrence_place: 'Flat 402, Sector 9, Delhi',
        local_head: 'Burglary',
        property_description: 'Gold jewelry, Laptop, Cash Rs. 50,000',
        io_name: 'SI Vijay Singh',
        io_mobile: '9988776655',
        beat_no: 'Beat 3',
        status: 'Open'
      })
    });

    // House Theft e-FIR Case
    recordsToInsert.push({
      id: 'R_DD_TEST_C02',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'E-FIR/HOUSETHEFT/2026/0002',
        sections: 'BNS 306',
        complainant_name: 'Priya Sharma',
        complainant_father_husband_name: 'R. K. Sharma',
        complainant_parent_name: 'R. K. Sharma',
        complainant_address: 'H.No. 12, Gali 2, Shashi Garden, Delhi',
        occurrence_place: 'H.No. 12, Gali 2, Shashi Garden, Delhi',
        occurrence_time: '14:00:00',
        local_head: 'House Theft',
        property_description: 'Bicycle, Copper wires',
        io_name: 'SI Naveen Malik',
        io_mobile: '9988776654',
        beat_no: 'Beat 1',
        status: 'Open'
      })
    });

    // Other Theft e-FIR Case
    recordsToInsert.push({
      id: 'R_DD_TEST_C03',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'DISTRICT_REVIEW',
      current_level: 'DISTRICT',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'E-FIR/THEFT/2026/0003',
        sections: 'BNS 303',
        complainant_name: 'Suresh Gupta',
        complainant_father_husband_name: 'M. L. Gupta',
        complainant_parent_name: 'M. L. Gupta',
        complainant_address: 'Shop 4, Market Area, Delhi',
        occurrence_time: '23:45:00',
        local_head: 'Other Theft',
        property_description: 'Iron rod, Cash box',
        occurrence_place: 'Shop 4, Market Area, Delhi',
        io_name: 'ASI Jagdish',
        io_mobile: '9988776653',
        beat_no: 'Beat 4',
        status: 'Open'
      })
    });

    // MVT Case
    recordsToInsert.push({
      id: 'R_DD_TEST_C04',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'FIR/MVT/2026/0004',
        sections: 'BNS 303(2)',
        occurrence_date: targetDate,
        occurrence_time: '23:45:00',
        occurrence_place: 'Parking Lot Metro Station, Delhi',
        complainant_name: 'Rajesh Tyagi',
        complainant_father_husband_name: 'S. K. Tyagi',
        complainant_parent_name: 'S. K. Tyagi',
        complainant_address: 'Pandav Nagar, Delhi',
        vehicle_no: 'DL 3S CA 1234',
        vehicle_type: 'Motorcycle Splendor',
        local_head: 'MVT',
        io_name: 'SI Sonu Kumar',
        io_mobile: '9988776652',
        beat_no: 'Beat 2',
        cd_uploaded_24h: 'Yes',
        footage_collected: 'Yes',
        status: 'Open'
      })
    });

    // Manual FIR: Murder (Important Case)
    recordsToInsert.push({
      id: 'R_DD_TEST_C05',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'FIR/2026/0125',
        sections: 'BNS 103 (Murder)',
        complainant_name: 'Sunil Dutt',
        complainant_father_husband_name: 'Late Sh. K. C. Dutt',
        complainant_parent_name: 'Late Sh. K. C. Dutt',
        complainant_address: 'A-21, Gazipur, Delhi',
        occurrence_time: '21:00:00',
        occurrence_place: 'Main Road near Gazipur Flyover, Delhi',
        local_head: 'Murder',
        brief_facts: 'Information received regarding a fight. Police reached the spot and found one person dead. FIR registered.',
        accused_name: 'John Doe',
        accused_father_name: 'Richard Doe',
        property_description: 'One Knife, Blood-stained soil',
        status: 'Open'
      })
    });

    // Manual FIR: Robbery (Important Case)
    recordsToInsert.push({
      id: 'R_DD_TEST_C06',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'FIR/2026/0126',
        sections: 'BNS 309(4) (Robbery)',
        complainant_name: 'Manish Rawat',
        complainant_father_husband_name: 'Pratap Rawat',
        complainant_parent_name: 'Pratap Rawat',
        complainant_address: 'B-45, Mayur Vihar, Delhi',
        occurrence_time: '22:30:00',
        occurrence_place: 'Pocket-1 Park, Mayur Vihar, Delhi',
        local_head: 'Robbery',
        brief_facts: 'Complainant was robbed of his mobile phone and wallet at knife point.',
        accused_name: 'Sohan Lal',
        accused_father_name: 'Mohan Lal',
        property_description: 'Wallet containing Rs. 2,000, iPhone 14',
        status: 'Open'
      })
    });

    // Inquest registered case
    recordsToInsert.push({
      id: 'R_DD_TEST_C07',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        gd_no: 'GD/24A',
        fir_date: targetDate,
        sections: 'BNSS 194',
        deceased_name: 'Ramesh Chander',
        deceased_father_husband_name: 'Shankar Lal',
        deceased_parent_name: 'Shankar Lal',
        deceased_address: 'Sanjay Park, Delhi',
        gender: 'Male',
        arrested_age: '45',
        cause_of_death: 'Heart Attack',
        occurrence_place: 'Sanjay Park Bench, Delhi',
        local_head: 'Inquest',
        io_name: 'ASI Satish',
        status: 'Closed',
        disposal_date: targetDate
      })
    });

    // NDPS Case
    recordsToInsert.push({
      id: 'R_DD_TEST_C08',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'FIR/NDPS/2026/0008',
        act_name: 'NDPS Act',
        sections: 'Sec. 20 NDPS',
        local_head: 'NDPS Act',
        property_description: '500g Ganja',
        stolen_items: '500g Ganja',
        io_name: 'SI Harish',
        status: 'Open'
      })
    });

    // Mobile Recovery Case
    recordsToInsert.push({
      id: 'R_DD_TEST_C09',
      record_type: 'CASE',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        fir_no: 'FIR/MOB/2026/0009',
        fir_date: targetDate,
        local_head: 'Mobile Phone Theft',
        mobile_model: 'Samsung Galaxy S23',
        property_status: 'Recovered',
        recovery_date: targetDate,
        property_handed_over: 'Handed Over',
        io_name: 'HC Dinesh'
      })
    });


    // --- ARRESTS ---
    // Normal IPC arrest
    recordsToInsert.push({
      id: 'R_DD_TEST_A01',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/2026/0125',
        sections: 'BNS 103',
        arrested_name: 'John Doe',
        arrested_father_husband_name: 'Richard Doe',
        arrested_parent_name: 'Richard Doe',
        arrested_address: 'Noida Sec 62, UP',
        arrested_age: '28',
        io_name: 'SI Vijay Singh',
        status: 'Judicial Custody',
        prev_involvement: '1',
        recovery: 'Yes',
        bad_character: 'No'
      })
    });

    // Preventive Arrest 109
    recordsToInsert.push({
      id: 'R_DD_TEST_A02',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'DD/45B',
        sections: 'BNSS 109',
        arrested_name: 'Madan Lal',
        arrested_father_husband_name: 'Sohan Lal',
        arrested_address: 'Kalyanpuri, Delhi',
        arrested_age: '32',
        io_name: 'ASI Dharam Singh',
        status: 'Bail',
        crime_head: 'PREVENTIVE',
        arrest_place: 'Bus Stop Gazipur, Delhi'
      })
    });

    // Proclaimed Offender PO
    recordsToInsert.push({
      id: 'R_DD_TEST_A03',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/2024/0410',
        sections: 'BNS 303/PO',
        arrested_name: 'Karan @ Kalu',
        arrested_father_husband_name: 'Charan Singh',
        arrested_address: 'Trilokpuri, Delhi',
        arrested_age: '35',
        io_name: 'SI Rajesh',
        status: 'Judicial Custody',
        crime_head: 'PO',
        proclaimed_offender: true,
        case_declared_po: 'FIR/2024/0410',
        court_declared_po: 'Karkardooma Court, Delhi'
      })
    });

    // Listed Criminal
    recordsToInsert.push({
      id: 'R_DD_TEST_A04',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/2026/0126',
        sections: 'BNS 309',
        arrested_name: 'Sohan Lal',
        arrested_father_husband_name: 'Mohan Lal',
        arrested_address: 'Shashi Garden, Delhi',
        arrested_age: '29',
        io_name: 'SI Harish',
        status: 'Police Custody',
        crime_head: 'listed',
        listed_criminal: true,
        category: 'A-Category Bad Character',
        normal_arrest: 'Yes',
        remarks: 'Apprehended after chase'
      })
    });

    // Juvenile Arrest
    recordsToInsert.push({
      id: 'R_DD_TEST_A05',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/2026/0127',
        sections: 'BNS 303 (Theft)',
        arrested_name: 'Rinku (Name Changed)',
        arrested_father_husband_name: 'Baldev Singh',
        arrested_address: 'Kalyanpuri J.J. Cluster, Delhi',
        arrested_age: '16',
        io_name: 'SI Naveen Malik',
        status: 'Bail by JJB',
        juvenile_category: 'First offender',
        intervention_by: 'Special Juvenile Police Unit',
        cwc_jjb_order: 'Released to parents'
      })
    });

    // Cyber Financial Fraud Arrest
    recordsToInsert.push({
      id: 'R_DD_TEST_A06',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/CYBER/2026/0010',
        sections: 'BNS 318(4) / IT Act 66D',
        arrested_name: 'Vikram Adityan',
        arrested_father_husband_name: 'Adityan Pillai',
        arrested_address: 'Dwarka Sector 10, Delhi',
        arrested_age: '26',
        io_name: 'SI Cyber Cell',
        status: 'JC',
        crime_head: 'Fraud',
        zone: 'Zone 2',
        range: 'Eastern Range',
        cheated_amount: 'Rs. 2,50,000',
        modus_operandi: 'WhatsApp OTP Scam',
        accused_count: '1',
        role_of_accused: 'Caller & Money Mule'
      })
    });

    // Preventive Arrest 126/170
    recordsToInsert.push({
      id: 'R_DD_TEST_A07',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'DD/90A',
        sections: 'BNSS 126/170',
        arrested_name: 'Rakesh Yadav',
        arrested_father_husband_name: 'Lalji Yadav',
        arrested_address: 'Kondli, Delhi',
        arrested_age: '24',
        io_name: 'SI Sandeep',
        status: 'Bail',
        crime_head: 'PREVENTIVE',
        arrest_place: 'Kondli Chowk, Delhi'
      })
    });

    // Preventive Arrest 126/169
    recordsToInsert.push({
      id: 'R_DD_TEST_A08',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'DD/91A',
        sections: 'BNSS 126/169',
        arrested_name: 'Devender Singh',
        arrested_father_husband_name: 'Prakash Singh',
        arrested_address: 'Gazipur Dairy Farm, Delhi',
        arrested_age: '27',
        io_name: 'ASI Satish',
        status: 'Bail',
        crime_head: 'PREVENTIVE',
        arrest_place: 'Gazipur Chowk, Delhi'
      })
    });

    // Preventive Arrest 109G
    recordsToInsert.push({
      id: 'R_DD_TEST_A09',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'DD/92A',
        sections: 'BNSS 109G',
        arrested_name: 'Gaurav Kumar',
        arrested_father_husband_name: 'Jai Kumar',
        arrested_address: 'Kalyanpuri, Delhi',
        arrested_age: '22',
        io_name: 'SI Harish',
        status: 'Bail',
        crime_head: 'PREVENTIVE',
        arrest_place: 'Kalyanpuri Park, Delhi'
      })
    });

    // Preventive Arrest 110G
    recordsToInsert.push({
      id: 'R_DD_TEST_A10',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'DD/93A',
        sections: 'BNSS 110G',
        arrested_name: 'Vinay @ Vicky',
        arrested_father_husband_name: 'Vijay Kumar',
        arrested_address: 'Mayur Vihar, Delhi',
        arrested_age: '29',
        io_name: 'SI Vijay Singh',
        status: 'JC',
        crime_head: 'PREVENTIVE',
        arrest_place: 'Mayur Vihar Ph-1, Delhi'
      })
    });

    // Preventive Arrest 92/93/97 DP Act
    recordsToInsert.push({
      id: 'R_DD_TEST_A11',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'DD/94A',
        sections: 'DP Act 92/97',
        arrested_name: 'Jeetu Kumar',
        arrested_father_husband_name: 'Satbir Singh',
        arrested_address: 'Gazipur, Delhi',
        arrested_age: '30',
        io_name: 'ASI Satish',
        status: 'Bail',
        crime_head: 'PREVENTIVE',
        arrest_place: 'Wine Shop, Gazipur, Delhi'
      })
    });

    // Preventive Arrest 40 Excise Act
    recordsToInsert.push({
      id: 'R_DD_TEST_A12',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/EX/2026/0011',
        act_name: 'Delhi Excise Act',
        sections: 'Sec 40 Excise Act',
        arrested_name: 'Sanjay Verma',
        arrested_father_husband_name: 'Ram Verma',
        arrested_address: 'Mandawali, Delhi',
        arrested_age: '28',
        io_name: 'HC Dinesh',
        status: 'Bail'
      })
    });

    // Preventive Arrest 33 Excise Act
    recordsToInsert.push({
      id: 'R_DD_TEST_A13',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/EX/2026/0012',
        act_name: 'Delhi Excise Act',
        sections: 'Sec 33 Excise Act',
        arrested_name: 'Kalu Ram',
        arrested_father_husband_name: 'Shankar Lal',
        arrested_address: 'Kalyanpuri, Delhi',
        arrested_age: '31',
        io_name: 'HC Dinesh',
        status: 'Bail'
      })
    });

    // Arms Act Arrest
    recordsToInsert.push({
      id: 'R_DD_TEST_A14',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/ARMS/2026/0013',
        act_name: 'Arms Act',
        sections: 'Sec 25/54 Arms Act',
        arrested_name: 'Pappu @ Shooter',
        arrested_father_husband_name: 'Bhagat Singh',
        arrested_address: 'Khoda Colony, UP',
        arrested_age: '23',
        io_name: 'SI Harish',
        status: 'JC'
      })
    });

    // Gambling Act Arrest
    recordsToInsert.push({
      id: 'R_DD_TEST_A15',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/GAM/2026/0014',
        act_name: 'Gambling Act',
        sections: 'Sec 12 Gambling Act',
        arrested_name: 'Bobby Singh',
        arrested_father_husband_name: 'Gurnam Singh',
        arrested_address: 'Mayur Vihar, Delhi',
        arrested_age: '40',
        io_name: 'ASI Satish',
        status: 'Bail'
      })
    });

    // NDPS Arrest
    recordsToInsert.push({
      id: 'R_DD_TEST_A16',
      record_type: 'ARREST',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        linked_fir_dd_no: 'FIR/NDPS/2026/0008',
        act_name: 'NDPS Act',
        sections: 'Sec 20 NDPS Act',
        arrested_name: 'Vicky Dev',
        arrested_father_husband_name: 'Laxman Dev',
        arrested_address: 'Paharganj, Delhi',
        arrested_age: '33',
        io_name: 'SI Harish',
        status: 'JC'
      })
    });


    // --- MISSING ---
    // Missing Female (Women Missing counts)
    recordsToInsert.push({
      id: 'R_DD_TEST_M01',
      record_type: 'MISSING',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        dd_no: 'DD/42',
        dd_date: targetDate,
        operator_name: 'HC Ramesh',
        missing_name: 'Seema Kumari',
        missing_address: 'H.No 105, Gazipur, Delhi',
        gender: 'Female',
        arrested_age: '24',
        source: 'DD_ENTRY',
        missing_date: targetDate,
        missing_place: 'Gazipur Market, Delhi',
        status: 'Missing'
      })
    });

    // Traced Female (Women Missing counts)
    recordsToInsert.push({
      id: 'R_DD_TEST_M02',
      record_type: 'MISSING',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        dd_no: 'DD/43',
        dd_date: targetDate,
        operator_name: 'HC Ramesh',
        missing_name: 'Suman Lata',
        missing_address: 'H.No 108, Gazipur, Delhi',
        gender: 'Female',
        arrested_age: '26',
        source: 'PCR',
        missing_date: targetDate,
        missing_place: 'Anand Vihar ISBT, Delhi',
        status: 'Traced',
        io_name: 'ASI Dharam Singh'
      })
    });

    // Missing Male Child (Children Missing counts)
    recordsToInsert.push({
      id: 'R_DD_TEST_M03',
      record_type: 'MISSING',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        dd_no: 'DD/44',
        dd_date: targetDate,
        operator_name: 'HC Ramesh',
        missing_name: 'Rahul Kumar',
        missing_address: 'H.No 109, Shashi Garden, Delhi',
        gender: 'Male',
        arrested_age: '12',
        source: 'PCR',
        missing_date: targetDate,
        missing_place: 'Near school park, Shashi Garden, Delhi',
        status: 'Missing',
        io_name: 'ASI Satish'
      })
    });

    // Traced Female Child (Children Missing counts)
    recordsToInsert.push({
      id: 'R_DD_TEST_M04',
      record_type: 'MISSING',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        dd_no: 'DD/45',
        dd_date: targetDate,
        operator_name: 'HC Ramesh',
        missing_name: 'Babita Kumari',
        missing_address: 'H.No 110, Shashi Garden, Delhi',
        gender: 'Female',
        arrested_age: '10',
        source: 'DD_ENTRY',
        missing_date: targetDate,
        missing_place: 'Near school, Shashi Garden, Delhi',
        status: 'Traced',
        io_name: 'SI Naveen Malik'
      })
    });

    // Abandoned Person (Missing status abandoned)
    recordsToInsert.push({
      id: 'R_DD_TEST_M05',
      record_type: 'MISSING',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        dd_no: 'DD/46',
        dd_date: targetDate,
        operator_name: 'HC Ramesh',
        missing_name: 'Unknown Male Child',
        gender: 'Male',
        arrested_age: '6',
        source: 'DD_ENTRY',
        missing_place: 'Metro Station platform, Delhi',
        found_place: 'Metro Station platform, Delhi',
        found_date: targetDate,
        status: 'abandoned',
        abandoned: true,
        io_name: 'SI Vijay Singh'
      })
    });


    // --- UIDB ---
    recordsToInsert.push({
      id: 'R_DD_TEST_U01',
      record_type: 'UIDB',
      ps_id: psId,
      district_id: districtId,
      sub_div_id: subDivId,
      current_status: 'HQ_RECEIVED',
      current_level: 'HQ',
      record_date: targetDate,
      created_by: userId,
      data: JSON.stringify({
        dd_no: 'DD/20B',
        dd_date: targetDate,
        found_place: 'Railway line near Gazipur crossing, Delhi',
        found_date: targetDate,
        gender: 'Male',
        approx_age: '35-40 yrs',
        description: 'Height 5.7, fair complexion, wearing blue shirt and black pants',
        io_name: 'SI Harish'
      })
    });

    // 3. Batch insert records
    console.log(`Inserting ${recordsToInsert.length} records...`);
    await db('records').insert(recordsToInsert);

    // 4. Create workflow transitions and revisions to make it realistic
    const transitions = [];
    const revisions = [];
    
    for (const r of recordsToInsert) {
      transitions.push({
        id: `WT_TEST_${r.id}`,
        record_id: r.id,
        from_status: 'DRAFT',
        to_status: r.current_status,
        from_level: 'PS',
        to_level: r.current_level,
        action: 'APPROVE',
        performed_by: userId,
        performed_at: new Date().toISOString()
      });

      revisions.push({
        id: `RV_TEST_${r.id}`,
        record_id: r.id,
        revision_number: 1,
        changed_by: userId,
        changed_at: new Date().toISOString(),
        level: r.current_level,
        change_type: 'CREATE',
        field_changes: '[]',
        ip_address: '127.0.0.1'
      });
    }

    console.log(`Inserting transitions and revisions...`);
    await db('workflow_transitions').insert(transitions);
    await db('record_revisions').insert(revisions);

    console.log('âœ… Daily Diary Mock Seeding completed successfully!');
  } catch (error) {
    console.error('âŒ Seeding failed:', error.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

main().catch(console.error);

