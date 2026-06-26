import axios from 'axios';
import { findNodeById, POLICE_HIERARCHY } from './hierarchyData.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create central axios client
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Helper to parse cookies
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const csrfToken = getCookie('csrfToken');
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
    // Allow credentials to ensure cookies are sent back
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for auto-refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error && error.isMock) {
      return Promise.resolve(error.response);
    }
    const originalRequest = error.config;

    // Check if we are in mock mode (bypass standard network error)
    const debugMode = localStorage.getItem('prism_debug_api_mode') || 'production';
    if (debugMode !== 'production') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
        const newToken = res.data.data.access_token;
        localStorage.setItem('access_token', newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── MOCK & SIMULATOR INTERACTION ENGINE ─────────────────────────────────────────
// This lets the frontend operate fully offline with high fidelity mock data.
// It also allows forcing server errors (400, 401, 403, 500) to test safety boundaries.

// Helper to construct simulated server response objects
const createMockResponse = (data, status = 200) => ({
  data: { status: 'success', data },
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

const createMockError = (message, status) => {
  const err = new Error(message);
  err.response = {
    status,
    data: { status: 'error', message },
  };
  return err;
};

// Seed mock database inside localStorage if not present
const initMockDB = () => {
  if (!localStorage.getItem('prism_mock_records')) {
    // Initial mock records
    const initialRecords = [
      {
        id: 'rec-c001',
        record_type: 'CASE',
        ps_id: 'PS_NDD_PARLIAMENT_STREET',
        district_id: 'DIST_NDD',
        current_status: 'PENDING_SHO',
        current_level: 'PS',
        version: 1,
        created_by: 'usr-hc-ramesh',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        data: {
          case_type: 'cctns(manual FIR)',
          fir_no: '210/2026',
          fir_date: '2026-06-15',
          gd_no: '12A',
          gd_date: '2026-06-15',
          gd_time: '10:30',
          occurrence_date: '2026-06-15',
          occurrence_place: 'Parliament Street Market, near Pillar 4',
          brief_facts: 'A bag containing legal documents and personal cash worth Rs. 15,000 was reported stolen from a parked vehicle. Complainant noticed the broken window glass upon return.',
          local_head: 'Theft',
          act_name: 'Bharatiya Nyaya Sanhita (BNS)',
          sections: '303(2)',
          complainant_name: 'Ashok Kumar',
          complainant_address: 'Flat 104, Block C, Connaught Place, New Delhi',
          accused_name: 'Unknown thief',
          accused_address: 'N/A',
          io_name: 'SI Harish Rawat',
          io_pis: 'PIS-49281034',
          io_mobile: '9876543210',
          stolen_property: 'Black leather shoulder bag containing cash and paper transcripts',
          property_status: 'Stolen',
          status: 'Open',
          remarks: 'CCTV footage of adjacent cameras is being analysed.',
          property_description: 'Black leather shoulder bag containing cash and paper transcripts',
          recovered_property: '',
          recovered_property_status: 'NA',
          recovered_case_status: 'Open',
          recovered_remarks: '',
          cctns_flag: true,
          etheft_flag: false,
          emvt_flag: false,
          ncrp_flag: false,
          zero_fir_flag: false,
          beat_no: 'Beat 4',
          record_date: '2026-06-15',
        },
        revisions: [
          {
            revision_number: 1,
            changed_by: 'HC Ramesh Kumar',
            changed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            level: 'PS',
            change_type: 'CREATE',
            comment: 'Initial entry of theft report',
            field_changes: [],
          }
        ],
        transitions: [
          {
            from_level: 'PS',
            to_level: 'PS',
            from_status: 'DRAFT',
            to_status: 'PENDING_SHO',
            action: 'SUBMIT',
            performed_by: 'HC Ramesh Kumar (PIS-28521904)',
            performed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            comment: 'Record submitted for SHO review',
          }
        ],
      },
      {
        id: 'rec-a001',
        record_type: 'ARREST',
        ps_id: 'PS_NDD_PARLIAMENT_STREET',
        district_id: 'DIST_NDD',
        current_status: 'DRAFT',
        current_level: 'PS',
        version: 1,
        created_by: 'usr-hc-ramesh',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        data: {
          linked_fir_dd_no: '210/2026',
          linked_fir_dd_date: '2026-06-15',
          linked_fir_dd_time: '10:30',
          act_name: 'BNS',
          sections: '303(2)',
          arrested_name: 'Suraj Pal',
          arrested_address: 'Jhuggi No. 54, Yamuna Pushta, Delhi',
          arrest_date: '2026-06-16',
          arrest_time: '08:45',
          arrest_place: 'Palika Bazaar Entry Gate',
          informant_name: 'Sunder Pal (Brother)',
          informant_address: 'Jhuggi No. 54, Yamuna Pushta, Delhi',
          informant_tel: '9988776655',
          nafis_prepared: 'Yes',
          dossier_prepared: 'Pending',
          search_slip_prepared: 'Yes',
          address_verified: 'Pending',
          verifying_officer_name: 'HC Sunil Dutt',
          verifying_officer_rank: 'Head Constable',
          crime_head: 'Theft',
          record_date: '2026-06-16',
          status: 'judicial custody',
          recovered_material: 'Stolen leather bag containing Rs. 5,000 cash',
          special_scheme: 'anti snatching',
        },
        revisions: [
          {
            revision_number: 1,
            changed_by: 'HC Ramesh Kumar',
            changed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            level: 'PS',
            change_type: 'CREATE',
            comment: 'Initial arrest details logged',
            field_changes: [],
          }
        ],
        transitions: [],
      },
      {
        id: 'rec-p001',
        record_type: 'PCR_CALL',
        ps_id: 'PS_NDD_PARLIAMENT_STREET',
        district_id: 'DIST_NDD',
        current_status: 'SENT_BACK_HC',
        current_level: 'PS',
        version: 2,
        created_by: 'usr-hc-ramesh',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        data: {
          gd_no: '45B',
          gd_date: '2026-06-15',
          gd_time: '18:20',
          call_head: 'Quarrel / Public Nuisance',
          complainant_name: 'Dr. Vivek Saxena',
          complainant_address: 'Flat 12, Parliament Street Officers Flats, New Delhi',
          call_gist: 'Loud noise and verbal altercation between two groups of motorists blocking the road.',
          io_name: 'ASI Satish Kumar',
          eo_name: '',
          action_taken: 'Reached spot. Motorists warned. Blockage cleared. Mutual settlement reached on spot.',
          status: 'Closed',
          arrival_dd_no: '47B',
          arrival_date: '2026-06-15',
          arrival_time: '18:35',
          latitude: '28.6289',
          longitude: '77.2134',
          beat_no: 'Beat 2',
          record_date: '2026-06-15',
        },
        revisions: [
          {
            revision_number: 1,
            changed_by: 'HC Ramesh Kumar',
            changed_at: new Date(Date.now() - 3600000 * 8).toISOString(),
            level: 'PS',
            change_type: 'CREATE',
            comment: 'PCR incident entry',
            field_changes: [],
          },
          {
            revision_number: 2,
            changed_by: 'SHO Sanjay Sharma',
            changed_at: new Date(Date.now() - 3600000 * 1).toISOString(),
            level: 'PS',
            change_type: 'STATUS_CHANGE',
            comment: 'Sent back: Please update exact coordinates (latitude and longitude).',
            field_changes: [],
          }
        ],
        transitions: [
          {
            from_level: 'PS',
            to_level: 'PS',
            from_status: 'DRAFT',
            to_status: 'PENDING_SHO',
            action: 'SUBMIT',
            performed_by: 'HC Ramesh Kumar (PIS-28521904)',
            performed_at: new Date(Date.now() - 3600000 * 7).toISOString(),
            comment: 'Submitted for review',
          },
          {
            from_level: 'PS',
            to_level: 'PS',
            from_status: 'PENDING_SHO',
            to_status: 'SENT_BACK_HC',
            action: 'SEND_BACK',
            performed_by: 'SHO Sanjay Sharma (PIS-28523992)',
            performed_at: new Date(Date.now() - 3600000 * 1).toISOString(),
            comment: 'Please update exact coordinates (latitude and longitude).',
            target_fields: ['latitude', 'longitude'],
          }
        ],
      },
      {
        id: 'rec-u001',
        record_type: 'UIDB',
        ps_id: 'PS_NDD_PARLIAMENT_STREET',
        district_id: 'DIST_NDD',
        current_status: 'PENDING_SHO',
        current_level: 'PS',
        version: 1,
        created_by: 'usr-hc-ramesh',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        data: {
          uidbNumber: 'UIDB-992/2026/ND',
          ddNumber: 'DD-12A',
          ddDate: '2026-06-12',
          dutyOfficer: 'ASI Krishan Dutt',
          ioName: 'Inspector Ravindra Singh',
          informantName: 'Satish Chand',
          informantMobile: '9876543210',
          foundPlace: 'Behind electricity transformer, near Palika Bazaar Gate 2',
          uidbDate: '2026-06-12',
          name: 'Unknown Male',
          age: 'Approx 35-40 years',
          gender: 'Male',
          height: "5'7\"",
          complexion: 'Shallow',
          identificationMarks: "Tattoo 'Om' on right hand wrist",
          description: 'Wearing blue shirt and khaki trousers. Body was decomposed.',
          zipnetNumber: 'ZIP-ND-2026-88912',
          identified: false,
          status: 'Autopsy report awaited. Preserved in RML Hospital Mortuary.',
          record_date: '2026-06-15',
        },
        revisions: [
          {
            revision_number: 1,
            changed_by: 'HC Ramesh Kumar',
            changed_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            level: 'PS',
            change_type: 'CREATE',
            comment: 'UIDB entry logged',
            field_changes: [],
          }
        ],
        transitions: [
          {
            from_level: 'PS',
            to_level: 'PS',
            from_status: 'DRAFT',
            to_status: 'PENDING_SHO',
            action: 'SUBMIT',
            performed_by: 'HC Ramesh Kumar (PIS-28521904)',
            performed_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            comment: 'Submitted for station approval',
          }
        ],
      }
    ];
    localStorage.setItem('prism_mock_records', JSON.stringify(initialRecords));
  }
};
initMockDB();

// Dynamic Schema Registry Mock JSON Data
const formSchemas = {
  CASE: [
    {
      section: 'general_info',
      title_en: 'General Case Metadata',
      title_hi: 'सामान्य मामला मेटाडेटा',
      fields: [
        {
          field_key: 'case_type',
          field_type: 'SELECT',
          label_en: 'Case Registration Type',
          label_hi: 'मामला पंजीकरण प्रकार',
          validation_rules: { required: true },
          options: [
            { value: 'cctns(manual FIR)', label_en: 'cctns(manual FIR)', label_hi: 'सीसीटीएनएस (मैनुअल एफआईआर)' },
            { value: 'eTheft', label_en: 'eTheft', label_hi: 'ई-चोरी' },
            { value: 'eMVT', label_en: 'eMVT', label_hi: 'ई-एमवीटी' },
            { value: 'NCRP', label_en: 'NCRP', label_hi: 'एनसीआरपी' },
            { value: 'zero FIR', label_en: 'zero FIR', label_hi: 'जीरो एफआईआर' }
          ]
        },
        { field_key: 'fir_no', field_type: 'TEXT', label_en: 'FIR Number', label_hi: 'प्राथमिकी (FIR) संख्या', validation_rules: { required: true } },
        { field_key: 'fir_date', field_type: 'DATE', label_en: 'FIR Date', label_hi: 'प्राथमिकी की तिथि', validation_rules: { required: true } },
        { field_key: 'gd_no', field_type: 'TEXT', label_en: 'GD Entry Number', label_hi: 'जी.डी. प्रविष्टि संख्या', validation_rules: { required: true } },
        { field_key: 'gd_date', field_type: 'DATE', label_en: 'GD Entry Date', label_hi: 'जी.डी. प्रविष्टि तिथि', validation_rules: { required: true } },
        { field_key: 'gd_time', field_type: 'TIME', label_en: 'GD Entry Time', label_hi: 'जी.डी. प्रविष्टि समय', validation_rules: { required: false } },
        { field_key: 'record_date', field_type: 'DATE', label_en: 'Diary Record Date', label_hi: 'दैनिक डायरी तिथि', validation_rules: { required: true } },
      ]
    },
    {
      section: 'incident_details',
      title_en: 'Incident Details',
      title_hi: 'घटना का विवरण',
      fields: [
        { field_key: 'occurrence_place', field_type: 'TEXT', label_en: 'Place of Occurrence', label_hi: 'घटना का स्थान', validation_rules: { required: true } },
        { field_key: 'brief_facts', field_type: 'TEXTAREA', label_en: 'Brief Facts of the Case', label_hi: 'मामले के संक्षिप्त तथ्य', validation_rules: { required: true } },
        {
          field_key: 'local_head',
          field_type: 'SELECT',
          label_en: 'Local Case Head / Crime Class',
          label_hi: 'स्थानीय मामला श्रेणी / अपराध वर्गीकरण',
          options: [
            { value: 'Theft', label_en: 'Theft', label_hi: 'चोरी' },
            { value: 'Robbery', label_en: 'Robbery', label_hi: 'डकैती' },
            { value: 'Burglary', label_en: 'Burglary', label_hi: 'सेंधमारी' },
            { value: 'Assault', label_en: 'Assault on Public Servant', label_hi: 'लोक सेवक पर हमला' },
            { value: 'Murder', label_en: 'Murder (S.103 BNS)', label_hi: 'हत्या' },
            { value: 'Riot', label_en: 'Rioting', label_hi: 'दंगा' },
            { value: 'Other', label_en: 'Other IPC/BNS Offences', label_hi: 'अन्य आईपीसी/बीएनएस अपराध' }
          ],
          validation_rules: { required: true }
        },
        { field_key: 'act_name', field_type: 'TEXT', label_en: 'Act Name', label_hi: 'अधिनियम का नाम', validation_rules: { required: true } },
        { field_key: 'sections', field_type: 'TEXT', label_en: 'Section(s) Code', label_hi: 'संबद्ध धारा संख्या(एँ)', validation_rules: { required: true } },
        { field_key: 'beat_no', field_type: 'NUMBER', label_en: 'Police Beat Code', label_hi: 'पुलिस बीट संख्या', validation_rules: { required: false } },
      ]
    },
    {
      section: 'investigation_officer',
      title_en: 'Investigating Officer Details',
      title_hi: 'जांच अधिकारी का विवरण',
      fields: [
        { field_key: 'io_name', field_type: 'TEXT', label_en: 'Investigating Officer (IO) Name', label_hi: 'जांच अधिकारी का नाम', validation_rules: { required: true } },
        { field_key: 'io_pis', field_type: 'TEXT', label_en: 'IO PIS / Badge Number', label_hi: 'जांच अधिकारी का PIS संख्या', validation_rules: { required: true } },
        { field_key: 'io_mobile', field_type: 'PHONE', label_en: 'IO Mobile Number', label_hi: 'जांच अधिकारी का मोबाइल नंबर', validation_rules: { required: true } },
      ]
    },
    {
      section: 'property_details',
      title_en: 'Properties Involved',
      title_hi: 'शामिल संपत्ति',
      is_repeater: true,
      entity_type: 'property',
      fields: [
        {
          field_key: 'property_major_category',
          field_type: 'SELECT',
          label_en: 'Property Major Category',
          label_hi: 'संपत्ति मुख्य श्रेणी',
          options: [
            { value: 'Vehicle', label_en: 'Vehicle', label_hi: 'वाहन' },
            { value: 'Mobile Phone', label_en: 'Mobile Phone', label_hi: 'मोबाइल फोन' },
            { value: 'Cash', label_en: 'Cash', label_hi: 'नकद' },
            { value: 'Jewellery', label_en: 'Gold/Jewellery', label_hi: 'सोना/आभूषण' },
            { value: 'Electronics', label_en: 'Electronics/Gadgets', label_hi: 'इलेक्ट्रॉनिक्स' },
            { value: 'Documents', label_en: 'Official/Personal Documents', label_hi: 'दस्तावेज़' },
            { value: 'Drugs', label_en: 'Drugs/Narcotics', label_hi: 'नशीले पदार्थ' },
            { value: 'Arms', label_en: 'Arms/Ammunition', label_hi: 'हथियार' },
            { value: 'Others', label_en: 'Others', label_hi: 'अन्य' }
          ],
          validation_rules: { required: true }
        },
        {
          field_key: 'property_minor_category',
          field_type: 'TEXT',
          label_en: 'Property Minor Category',
          label_hi: 'संपत्ति उप श्रेणी',
          validation_rules: { required: false }
        },
        {
          field_key: 'property_details',
          field_type: 'TEXTAREA',
          label_en: 'Property Details / Description',
          label_hi: 'संपत्ति का विवरण',
          validation_rules: { required: false }
        },
        {
          field_key: 'property_stolen_recovered',
          field_type: 'SELECT',
          label_en: 'Property Stolen / Recovered',
          label_hi: 'संपत्ति चोरी / बरामद स्थिति',
          options: [
            { value: 'Stolen', label_en: 'Stolen', label_hi: 'चोरी हुई' },
            { value: 'Recovered', label_en: 'Recovered', label_hi: 'बरामद' },
            { value: 'Involved', label_en: 'Involved', label_hi: 'शामिल' }
          ],
          validation_rules: { required: true }
        }
      ]
    },
    {
      section: 'intranet_flags',
      title_en: 'Intranet System Reference Flags',
      title_hi: 'इंट्रानेट सिस्टम संदर्भ झंडे',
      fields: [
        { field_key: 'cctns_flag', field_type: 'BOOLEAN', label_en: 'CCTNS Sync Done', label_hi: 'CCTNS सिंक पूर्ण', validation_rules: { required: false } },
        { field_key: 'etheft_flag', field_type: 'BOOLEAN', label_en: 'e-Theft Flagged', label_hi: 'ई-चोरी चिह्नित', validation_rules: { required: false } },
        { field_key: 'emvt_flag', field_type: 'BOOLEAN', label_en: 'e-MVT Auto Record', label_hi: 'ई-एमवीटी ऑटो रिकॉर्ड', validation_rules: { required: false } },
        { field_key: 'ncrp_flag', field_type: 'BOOLEAN', label_en: 'NCRP Portal Cross-reference', label_hi: 'NCRP पोर्टल क्रॉस-संदर्भ', validation_rules: { required: false } },
        { field_key: 'zero_fir_flag', field_type: 'BOOLEAN', label_en: 'Zero FIR Status', label_hi: 'शून्य प्राथमिकी स्थिति', validation_rules: { required: false } },
      ]
    }
  ],
  ARREST: [
    {
      section: 'linkages',
      title_en: 'Case Linkage Context',
      title_hi: 'केस लिंकेज संदर्भ',
      fields: [
        { field_key: 'linked_fir_dd_no', field_type: 'TEXT', label_en: 'Linked Case FIR / DD Number', label_hi: 'संबद्ध प्राथमिकी / डी.डी. संख्या', validation_rules: { required: false } },
        { field_key: 'linked_fir_dd_date', field_type: 'DATE', label_en: 'Linked Case FIR Date', label_hi: 'संबद्ध प्राथमिकी तिथि', validation_rules: { required: false } },
        { field_key: 'linked_fir_dd_time', field_type: 'TIME', label_en: 'Linked Case Occurrence Time', label_hi: 'संबद्ध घटना का समय', validation_rules: { required: false } },
        { field_key: 'record_date', field_type: 'DATE', label_en: 'Diary Record Date', label_hi: 'दैनिक डायरी तिथि', validation_rules: { required: true } },
      ]
    },
    {
      section: 'arrestee_info',
      title_en: 'Arrested Person Particulars',
      title_hi: 'गिरफ्तार व्यक्ति का विवरण',
      fields: [
        { field_key: 'arrested_name', field_type: 'TEXT', label_en: 'Name of Arrested/Detained Person', label_hi: 'गिरफ्तार/हिरासत में लिए गए व्यक्ति का नाम', validation_rules: { required: true } },
        { field_key: 'arrested_address', field_type: 'TEXTAREA', label_en: 'Address of Arrested Person', label_hi: 'गिरफ्तार व्यक्ति का पता', validation_rules: { required: true } },
        { field_key: 'arrest_date', field_type: 'DATE', label_en: 'Date of Arrest', label_hi: 'गिरफ्तारी की तिथि', validation_rules: { required: true } },
        { field_key: 'arrest_time', field_type: 'TIME', label_en: 'Time of Arrest', label_hi: 'गिरफ्तारी का समय', validation_rules: { required: true } },
        { field_key: 'arrest_place', field_type: 'TEXT', label_en: 'Place of Arrest', label_hi: 'गिरफ्तारी का स्थान', validation_rules: { required: true } },
      ]
    },
    {
      section: 'offence_info',
      title_en: 'Offence Classification',
      title_hi: 'अपराध वर्गीकरण',
      fields: [
        { field_key: 'act_name', field_type: 'TEXT', label_en: 'Act Name', label_hi: 'अधिनियम का नाम', validation_rules: { required: true } },
        { field_key: 'sections', field_type: 'TEXT', label_en: 'Sections Code', label_hi: 'धारा संख्या(एँ)', validation_rules: { required: true } },
        {
          field_key: 'crime_head',
          field_type: 'SELECT',
          label_en: 'Crime Classification Head',
          label_hi: 'अपराध वर्गीकरण श्रेणी',
          options: [
            { value: 'Theft', label_en: 'Theft', label_hi: 'चोरी' },
            { value: 'Robbery', label_en: 'Robbery', label_hi: 'डकैती' },
            { value: 'Snatching', label_en: 'Snatching', label_hi: 'झपटमारी' },
            { value: 'Extortion', label_en: 'Extortion', label_hi: 'जबरन वसूली' },
            { value: 'Assault', label_en: 'Assault', label_hi: 'हमला / बल प्रयोग' },
            { value: 'Murder', label_en: 'Murder / Attempt', label_hi: 'हत्या / हत्या का प्रयास' },
            { value: 'Other', label_en: 'Other Offences', label_hi: 'अन्य अपराध' }
          ],
          validation_rules: { required: true }
        },
      ]
    },
    {
      section: 'procedure_slips',
      title_en: 'Procedural Slips & Verification',
      title_hi: 'प्रक्रियात्मक पर्ची और सत्यापन',
      fields: [
        {
          field_key: 'nafis_prepared',
          field_type: 'SELECT',
          label_en: 'NAFIS Fingerprint Card Prepared',
          label_hi: 'NAFIS फिंगरप्रिंट कार्ड तैयार किया गया',
          options: [
            { value: 'Yes', label_en: 'Yes', label_hi: 'हाँ' },
            { value: 'No', label_en: 'No', label_hi: 'नहीं' },
            { value: 'Not Applicable', label_en: 'Not Applicable', label_hi: 'लागू नहीं' }
          ],
          validation_rules: { required: true }
        },
        {
          field_key: 'dossier_prepared',
          field_type: 'SELECT',
          label_en: 'Criminal Dossier Record Filed',
          label_hi: 'अपराधिक डोजियर रिकॉर्ड दर्ज',
          options: [
            { value: 'Yes', label_en: 'Yes', label_hi: 'हाँ' },
            { value: 'No', label_en: 'No', label_hi: 'नहीं' },
            { value: 'Pending', label_en: 'Pending Verification', label_hi: 'सत्यापन लंबित' }
          ],
          validation_rules: { required: true }
        },
        {
          field_key: 'search_slip_prepared',
          field_type: 'SELECT',
          label_en: 'Search Slip Filed in Registry',
          label_hi: 'खोज पर्ची (Search Slip) दर्ज',
          options: [
            { value: 'Yes', label_en: 'Yes', label_hi: 'हाँ' },
            { value: 'No', label_en: 'No', label_hi: 'नहीं' }
          ],
          validation_rules: { required: true }
        },
        {
          field_key: 'address_verified',
          field_type: 'SELECT',
          label_en: 'Physical Address Verified',
          label_hi: 'भौतिक पता सत्यापित',
          options: [
            { value: 'Verified', label_en: 'Verified', label_hi: 'सत्यापित' },
            { value: 'Not Verified', label_en: 'Not Verified', label_hi: 'सत्यापित नहीं' },
            { value: 'Pending', label_en: 'Verification Pending', label_hi: 'सत्यापन लंबित' }
          ],
          validation_rules: { required: true }
        },
        { field_key: 'verifying_officer_name', field_type: 'TEXT', label_en: 'Verifying Officer Name', label_hi: 'सत्यापन अधिकारी का नाम', validation_rules: { required: false } },
        { field_key: 'verifying_officer_rank', field_type: 'TEXT', label_en: 'Verifying Officer Rank', label_hi: 'सत्यापन अधिकारी का पद', validation_rules: { required: false } },
      ]
    },
    {
      section: 'custody_status',
      title_en: 'Custody Status & Recoveries',
      title_hi: 'हिरासत की स्थिति और बरामदगी',
      fields: [
        {
          field_key: 'status',
          field_type: 'SELECT',
          label_en: 'Arrestee Status',
          label_hi: 'बंदी की स्थिति',
          options: [
            { value: 'bail', label_en: 'Released on Bail', label_hi: 'जमानत पर रिहा' },
            { value: 'judicial custody', label_en: 'Sent to Judicial Custody', label_hi: 'न्यायिक हिरासत में' },
            { value: 'police custody', label_en: 'Under Police Custody Remand', label_hi: 'पुलिस रिमांड में' },
            { value: 'others', label_en: 'Others / Discharged', label_hi: 'अन्य / आरोपमुक्त' }
          ],
          validation_rules: { required: true }
        },
        {
          field_key: 'other_status_reason',
          field_type: 'TEXT',
          label_en: 'Reason for Other Status',
          label_hi: 'अन्य स्थिति का कारण',
          validation_rules: { required: false },
          show_when: { field: 'status', value: 'others' }
        },
        { field_key: 'recovered_material', field_type: 'TEXTAREA', label_en: 'Recovered Material Items', label_hi: 'बरामद की गई सामग्री', validation_rules: { required: false } },
        {
          field_key: 'special_scheme',
          field_type: 'SELECT',
          label_en: 'Arrest Scoped in Special Scheme',
          label_hi: 'विशेष योजना के अंतर्गत गिरफ्तारी',
          options: [
            { value: 'integrated patrolling', label_en: 'Integrated Patrolling Beat', label_hi: 'एकीकृत गश्त बीट' },
            { value: 'group patrolling', label_en: 'Group Patrolling', label_hi: 'समूह गश्त' },
            { value: 'cycle patrolling', label_en: 'Cycle Patrolling Beat', label_hi: 'साइकिल गश्त' },
            { value: 'anti snatching', label_en: 'Anti-Snatching Operations squad', label_hi: 'झपटमारी विरोधी अभियान दस्ता' },
            { value: 'PRAHARI', label_en: 'PRAHARI scheme', label_hi: 'प्रहरी योजना' },
            { value: 'Eye and ear scheme', label_en: 'Eye and Ear scheme', label_hi: 'आंख और कान योजना' },
            { value: 'None', label_en: 'Not Under Special Scheme', label_hi: 'किसी विशेष योजना के अंतर्गत नहीं' }
          ],
          validation_rules: { required: false }
        },
      ]
    },
    {
      section: 'informant_contact',
      title_en: 'Arrest Informant/Relative Info',
      title_hi: 'बंदी के संबंधी/सूचना प्राप्तकर्ता का विवरण',
      fields: [
        { field_key: 'informant_name', field_type: 'TEXT', label_en: 'Informant Name', label_hi: 'सूचना प्राप्तकर्ता का नाम', validation_rules: { required: true } },
        { field_key: 'informant_address', field_type: 'TEXTAREA', label_en: 'Informant Address', label_hi: 'सूचना प्राप्तकर्ता का पता', validation_rules: { required: false } },
        { field_key: 'informant_tel', field_type: 'PHONE', label_en: 'Informant Contact Tel.', label_hi: 'सूचना प्राप्तकर्ता का दूरभाष नंबर', validation_rules: { required: true } },
      ]
    }
  ],
  PCR_CALL: [
    {
      section: 'general_info',
      title_en: 'General Diary & Call Logs',
      title_hi: 'सामान्य डायरी और कॉल लॉग',
      fields: [
        { field_key: 'gd_no', field_type: 'TEXT', label_en: 'GD Entry Number', label_hi: 'जी.डी. प्रविष्टि संख्या', validation_rules: { required: true } },
        { field_key: 'gd_date', field_type: 'DATE', label_en: 'GD Entry Date', label_hi: 'जी.डी. प्रविष्टि तिथि', validation_rules: { required: true } },
        { field_key: 'gd_time', field_type: 'TIME', label_en: 'GD Entry Time', label_hi: 'जी.डी. प्रविष्टि समय', validation_rules: { required: true } },
        { field_key: 'record_date', field_type: 'DATE', label_en: 'Diary Record Date', label_hi: 'दैनिक डायरी तिथि', validation_rules: { required: true } },
      ]
    },
    {
      section: 'complaint_details',
      title_en: 'Complaint & PCR Dispatch Gist',
      title_hi: 'शिकायत और पीसीआर प्रेषण विवरण',
      fields: [
        {
          field_key: 'call_head',
          field_type: 'SELECT',
          label_en: 'PCR Call Category Head',
          label_hi: 'पीसीआर कॉल श्रेणी शीर्ष',
          options: [
            { value: 'Quarrel / Public Nuisance', label_en: 'Quarrel / Nuisance', label_hi: 'झगड़ा / सार्वजनिक उपद्रव' },
            { value: 'Road Accident', label_en: 'Road Accident', label_hi: 'सड़क दुर्घटना' },
            { value: 'Theft Report', label_en: 'Theft / Purse Snatching', label_hi: 'चोरी की रिपोर्ट' },
            { value: 'Suspicious Activity', label_en: 'Suspicious Movement / Person', label_hi: 'संदिग्ध गतिविधि' },
            { value: 'Domestic Violence', label_en: 'Domestic Altercation', label_hi: 'घरेलू हिंसा' },
            { value: 'Other Emergency', label_en: 'Other Emergency Calls', label_hi: 'अन्य आपातकालीन कॉल' }
          ],
          validation_rules: { required: true }
        },
        { field_key: 'complainant_name', field_type: 'TEXT', label_en: 'Complainant/Caller Name', label_hi: 'शिकायतकर्ता/कॉलर का नाम', validation_rules: { required: true } },
        { field_key: 'complainant_address', field_type: 'TEXTAREA', label_en: 'Caller Address', label_hi: 'कॉलर का पता', validation_rules: { required: false } },
        { field_key: 'call_gist', field_type: 'TEXTAREA', label_en: 'PCR Dispatch Call Gist', label_hi: 'पीसीआर डिस्पैच कॉल विवरण', validation_rules: { required: true } },
      ]
    },
    {
      section: 'response_io',
      title_en: 'Responding Officers & Resolution',
      title_hi: 'प्रतिक्रिया देने वाले अधिकारी और समाधान',
      fields: [
        { field_key: 'io_name', field_type: 'TEXT', label_en: 'Assigned Responding Officer (IO) Name', label_hi: 'नियुक्त जांच अधिकारी (IO) का नाम', validation_rules: { required: true } },
        { field_key: 'eo_name', field_type: 'TEXT', label_en: 'Enquiry Officer Name (If different)', label_hi: 'पूछताछ अधिकारी का नाम (यदि भिन्न हो)', validation_rules: { required: false } },
        { field_key: 'action_taken', field_type: 'TEXTAREA', label_en: 'Brief Action Taken Report', label_hi: 'संक्षिप्त कार्रवाई रिपोर्ट', validation_rules: { required: true } },
        {
          field_key: 'status',
          field_type: 'SELECT',
          label_en: 'Final Call Status',
          label_hi: 'कॉल की अंतिम स्थिति',
          options: [
            { value: 'Action Taken', label_en: 'Action Taken & Resolved', label_hi: 'कार्रवाई की गई और सुलझाया गया' },
            { value: 'Pending', label_en: 'Pending Active Inquiry', label_hi: 'सक्रिय पूछताछ लंबित' },
            { value: 'Referred', label_en: 'Referred to Special Agency/Unit', label_hi: 'विशेष एजेंसी/इकाई को संदर्भित' },
            { value: 'Closed', label_en: 'No Action Needed / False Alarm', label_hi: 'कार्रवाई की आवश्यकता नहीं / बंद' }
          ],
          validation_rules: { required: true }
        },
      ]
    },
    {
      section: 'arrival_geo',
      title_en: 'Scene Arrival & Geo-Location Data',
      title_hi: 'घटनास्थल पर आगमन और भू-स्थान डेटा',
      fields: [
        { field_key: 'arrival_dd_no', field_type: 'TEXT', label_en: 'Arrival DD Entry Number', label_hi: 'घटनास्थल पर आगमन DD संख्या', validation_rules: { required: true } },
        { field_key: 'arrival_date', field_type: 'DATE', label_en: 'Arrival Date at Scene', label_hi: 'घटनास्थल पर आगमन की तिथि', validation_rules: { required: true } },
        { field_key: 'arrival_time', field_type: 'TIME', label_en: 'Arrival Time at Scene', label_hi: 'घटनास्थल पर आगमन का समय', validation_rules: { required: true } },
        { field_key: 'latitude', field_type: 'TEXT', label_en: 'Incident Location Latitude', label_hi: 'घटना स्थल अक्षांश', validation_rules: { required: false } },
        { field_key: 'longitude', field_type: 'TEXT', label_en: 'Incident Location Longitude', label_hi: 'घटना स्थल रेखांश', validation_rules: { required: false } },
        { field_key: 'beat_no', field_type: 'NUMBER', label_en: 'Police Beat Code', label_hi: 'पुलिस बीट संख्या', validation_rules: { required: false } },
      ]
    }
  ],
  MISSING: [
    {
      section: 'record_type_select',
      title_en: 'Register Type & References',
      title_hi: 'पंजीकरण प्रकार और संदर्भ',
      fields: [
        {
          field_key: 'record_subtype',
          field_type: 'SELECT',
          label_en: 'Missing Register Category Sub-Type',
          label_hi: 'लापता रजिस्टर श्रेणी उप-प्रकार',
          options: [
            { value: 'Missing Person', label_en: 'Missing Person Report', label_hi: 'लापता व्यक्ति रिपोर्ट' },
            { value: 'Unidentified Recovered', label_en: 'Unidentified Body Recovered', label_hi: 'अज्ञात मृत शरीर बरामद' },
            { value: 'Found Person', label_en: 'Found Person Logged', label_hi: 'मिला हुआ व्यक्ति' }
          ],
          validation_rules: { required: true }
        },
        { field_key: 'dd_fir_no', field_type: 'TEXT', label_en: 'DD / FIR Reference Number', label_hi: 'डी.डी. / प्राथमिकी संदर्भ संख्या', validation_rules: { required: true } },
        { field_key: 'dd_fir_date', field_type: 'DATE', label_en: 'Reference Entry Date', label_hi: 'संदर्भ प्रविष्टि तिथि', validation_rules: { required: true } },
        { field_key: 'record_date', field_type: 'DATE', label_en: 'Diary Record Date', label_hi: 'दैनिक डायरी तिथि', validation_rules: { required: true } },
      ]
    },
    {
      section: 'physical_bio',
      title_en: 'Physical Description & Biological Metadata',
      title_hi: 'भौतिक विवरण और जैविक डेटा',
      fields: [
        { field_key: 'age', field_type: 'NUMBER', label_en: 'Age / Approximate Age', label_hi: 'आयु / अनुमानित आयु', validation_rules: { required: true } },
        {
          field_key: 'gender',
          field_type: 'SELECT',
          label_en: 'Biological Gender',
          label_hi: 'जैविक लिंग',
          options: [
            { value: 'Male', label_en: 'Male', label_hi: 'पुरुष' },
            { value: 'Female', label_en: 'Female', label_hi: 'महिला' },
            { value: 'Transgender', label_en: 'Transgender', label_hi: 'ट्रांसजेंडर' },
            { value: 'Unknown', label_en: 'Unknown', label_hi: 'अज्ञात' }
          ],
          validation_rules: { required: true }
        },
        { field_key: 'physical_description', field_type: 'TEXTAREA', label_en: 'Physical Features, Clothing, Marks', label_hi: 'शारीरिक बनावट, पहनावा, निशान', validation_rules: { required: true } }
      ]
    },
    {
      section: 'location_particulars',
      title_en: 'Occurrence Geography Particulars',
      title_hi: 'घटना स्थल की भौगोलिक जानकारी',
      fields: [
        { field_key: 'last_seen_location', field_type: 'TEXT', label_en: 'Last Seen Location Address', label_hi: 'अंतिम बार देखे जाने का पता', validation_rules: { required: false } },
        { field_key: 'found_location', field_type: 'TEXT', label_en: 'Found / Recovery Location Address', label_hi: 'बरामदगी / मिलने का पता', validation_rules: { required: false } },
        { field_key: 'missing_recovered_date', field_type: 'DATE', label_en: 'Date Missing / Recovered', label_hi: 'लापता होने / बरामद होने की तिथि', validation_rules: { required: true } },
        { field_key: 'missing_recovered_time', field_type: 'TIME', label_en: 'Time Missing / Recovered', label_hi: 'लापता होने / बरामद होने का समय', validation_rules: { required: true } },
      ]
    },
    {
      section: 'contacts_assigned',
      title_en: 'Assigned IO & Informant Contacts',
      title_hi: 'नियुक्त जांच अधिकारी और सूचना प्राप्तकर्ता संपर्क',
      fields: [
        { field_key: 'informant_name', field_type: 'TEXT', label_en: 'Complainant / Informant Full Name', label_hi: 'शिकायतकर्ता / सूचना प्रदाता का नाम', validation_rules: { required: true } },
        { field_key: 'informant_contact', field_type: 'TEXT', label_en: 'Informant Contact Telephone/Mobile', label_hi: 'सूचना प्रदाता का संपर्क नंबर', validation_rules: { required: true } },
        { field_key: 'io_name', field_type: 'TEXT', label_en: 'Assigned Investigating Officer (IO)', label_hi: 'नियुक्त जांच अधिकारी (IO)', validation_rules: { required: true } },
        {
          field_key: 'status',
          field_type: 'SELECT',
          label_en: 'Current Log Status',
          label_hi: 'वर्तमान रिकॉर्ड स्थिति',
          options: [
            { value: 'Active', label_en: 'Active Search Ongoing', label_hi: 'सक्रिय खोज जारी' },
            { value: 'Traced', label_en: 'Traced & Reunited', label_hi: 'ढूंढ लिया गया / परिजनों से मिलाया गया' },
            { value: 'Referred', label_en: 'Referred to Missing Persons Bureau', label_hi: 'लापता व्यक्ति ब्यूरो को संदर्भित' },
            { value: 'Closed', label_en: 'Closed Case', label_hi: 'मामला बंद' }
          ],
          validation_rules: { required: true }
        },
        { field_key: 'remarks', field_type: 'TEXTAREA', label_en: 'Remarks', label_hi: 'टिप्पणी', validation_rules: { required: false } }
      ]
    }
  ],
  UIDB: [
    {
      section: 'general_info',
      title_en: 'Basic UIDB Information',
      title_hi: 'बुनियादी यूआईडीबी जानकारी',
      fields: [
        { field_key: 'uidbNumber', field_type: 'TEXT', label_en: 'UIDB Gazette Number', label_hi: 'यूआईडीबी राजपत्र संख्या', validation_rules: { required: true } },
        { field_key: 'ddNumber', field_type: 'TEXT', label_en: 'DD Number', label_hi: 'डी.डी. संख्या', validation_rules: { required: false } },
        { field_key: 'ddDate', field_type: 'DATE', label_en: 'DD Date', label_hi: 'डी.डी. तिथि', validation_rules: { required: false } },
        { field_key: 'record_date', field_type: 'DATE', label_en: 'Diary Record Date', label_hi: 'दैनिक डायरी तिथि', validation_rules: { required: true } },
      ]
    },
    {
      section: 'officer_informant',
      title_en: 'Reporting Officers & Informant',
      title_hi: 'रिपोर्टिंग अधिकारी और मुखबिर',
      fields: [
        { field_key: 'dutyOfficer', field_type: 'TEXT', label_en: 'Duty Officer', label_hi: 'ड्यूटी अधिकारी', validation_rules: { required: false } },
        { field_key: 'ioName', field_type: 'TEXT', label_en: 'IO Name (Investigating Officer)', label_hi: 'जांच अधिकारी का नाम', validation_rules: { required: false } },
        { field_key: 'informantName', field_type: 'TEXT', label_en: 'Informant Name', label_hi: 'सूचना प्रदाता का नाम', validation_rules: { required: false } },
        { field_key: 'informantMobile', field_type: 'PHONE', label_en: 'Informant Mobile', label_hi: 'सूचना प्रदाता का मोबाइल नंबर', validation_rules: { required: false } },
      ]
    },
    {
      section: 'discovery_details',
      title_en: 'Body Discovery Details',
      title_hi: 'शव बरामदगी का विवरण',
      fields: [
        { field_key: 'foundPlace', field_type: 'TEXT', label_en: 'Place Body Found', label_hi: 'शव मिलने का स्थान', validation_rules: { required: true } },
        { field_key: 'uidbDate', field_type: 'DATE', label_en: 'Discovery Date', label_hi: 'शव मिलने की तिथि', validation_rules: { required: false } },
      ]
    },
    {
      section: 'corpse_desc',
      title_en: 'Corpse Physical Description',
      title_hi: 'शारीरिक विवरण',
      fields: [
        { field_key: 'name', field_type: 'TEXT', label_en: 'Assumed Name / Unknown Tag', label_hi: 'मान लिया गया नाम / अज्ञात टैग', validation_rules: { required: false } },
        { field_key: 'age', field_type: 'TEXT', label_en: 'Estimated Age', label_hi: 'अनुमानित आयु', validation_rules: { required: false } },
        {
          field_key: 'gender',
          field_type: 'SELECT',
          label_en: 'Gender',
          label_hi: 'लिंग',
          options: [
            { value: 'Male', label_en: 'Male', label_hi: 'पुरुष' },
            { value: 'Female', label_en: 'Female', label_hi: 'महिला' },
            { value: 'Other', label_en: 'Other', label_hi: 'अन्य' },
            { value: 'Unknown', label_en: 'Unknown', label_hi: 'अज्ञात' }
          ],
          validation_rules: { required: true }
        },
        { field_key: 'height', field_type: 'TEXT', label_en: 'Height', label_hi: 'ऊंचाई', validation_rules: { required: false } },
        { field_key: 'complexion', field_type: 'TEXT', label_en: 'Complexion', label_hi: 'रंग', validation_rules: { required: false } },
        { field_key: 'identificationMarks', field_type: 'TEXT', label_en: 'Identification Marks', label_hi: 'पहचान चिन्ह', validation_rules: { required: false } },
        { field_key: 'description', field_type: 'TEXTAREA', label_en: 'Detailed Description of Apparel & Condition', label_hi: 'परिधान और स्थिति का विस्तृत विवरण', validation_rules: { required: false } },
      ]
    },
    {
      section: 'inquest_details',
      title_en: 'Inquest Details',
      title_hi: 'इन्क्वेस्ट विवरण',
      fields: [
        {
          field_key: 'cause_of_death',
          field_type: 'SELECT',
          label_en: 'Cause of Death',
          label_hi: 'मृत्यु का कारण',
          options: [
            { value: 'Accidental', label_en: 'Accidental', label_hi: 'दुर्घटना' },
            { value: 'Natural', label_en: 'Natural', label_hi: 'प्राकृतिक' },
            { value: 'Suicide', label_en: 'Suicide', label_hi: 'आत्महत्या' },
            { value: 'Murder', label_en: 'Murder', label_hi: 'हत्या' },
            { value: 'Unknown', label_en: 'Unknown', label_hi: 'अज्ञात' }
          ],
          validation_rules: { required: false }
        },
        {
          field_key: 'deceased_father_husband_name',
          field_type: 'TEXT',
          label_en: "Deceased's Father / Husband Name",
          label_hi: 'मृतक के पिता / पति का नाम',
          validation_rules: { required: false }
        }
      ]
    },
    {
      section: 'zipnet_status',
      title_en: 'ZIPNET Database & Status',
      title_hi: 'ज़िपनेट डेटाबेस और स्थिति',
      fields: [
        { field_key: 'zipnetNumber', field_type: 'TEXT', label_en: 'ZIPNET Number', label_hi: 'ज़िपनेट नंबर', validation_rules: { required: false } },
        { field_key: 'identified', field_type: 'BOOLEAN', label_en: 'Corpse Identified', label_hi: 'शव की पहचान हुई', validation_rules: { required: false } },
        { field_key: 'status', field_type: 'TEXT', label_en: 'Current Status / Mortuary Remarks', label_hi: 'वर्तमान स्थिति / शवगृह टिप्पणी', validation_rules: { required: false } },
      ]
    }
  ]
};

// Interceptor helper to inject simulated API responses/errors
api.interceptors.request.use(
  async (config) => {
    const debugMode = localStorage.getItem('prism_debug_api_mode') || 'production';
    if (debugMode === 'production') {
      return config;
    }

    // Bypass mock interception for binary downloads/exports
    if (config.responseType === 'blob' || config.responseType === 'arraybuffer') {
      return config;
    }

    // Return custom mock responses
    const method = config.method.toUpperCase();
    const url = config.url;

    // Simulate error triggers if debug switcher requests it
    if (debugMode.startsWith('error_')) {
      const code = parseInt(debugMode.split('_')[1], 10);
      throw createMockError(`Simulated server error for code ${code}`, code);
    }

    // Handle Mock Authentication Login
    if (url.includes('/auth/login') && method === 'POST') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      const badgeNo = payload.badgeNo || payload.email || payload.badge_no || 'HC001';
      const password = payload.password;
      const selectedNodeId = payload.selectedNodeId;
      if (!badgeNo || !password) {
        throw createMockError('Missing badge number or security key', 400);
      }

      const node = findNodeById(selectedNodeId || 'PS_NDD_PARLIAMENT_STREET') || POLICE_HIERARCHY.children[0].children[1].children[0].children[0];

      let mockRole = node.type;
      const lowerB = badgeNo.toLowerCase();
      if (lowerB.includes('sho')) {
        mockRole = 'SHO';
      } else if (lowerB.includes('hc') || lowerB.includes('ramesh')) {
        mockRole = 'HC';
      } else if (lowerB.includes('dcp') || lowerB.includes('do') || lowerB.includes('priya') || lowerB.includes('vardhan')) {
        mockRole = 'DISTRICT_OFFICER';
      } else if (lowerB.includes('hq') || lowerB.includes('analyst') || lowerB.includes('anita') || lowerB.includes('vikram.singh')) {
        mockRole = 'HQ_ANALYST';
      } else if (lowerB.includes('admin') || lowerB.includes('suresh')) {
        mockRole = 'HQ_ADMIN';
      } else if (lowerB.includes('sa') || lowerB.includes('system')) {
        mockRole = 'SYSTEM_ADMIN';
      }

      const stationName = node.stationName || '';
      const psCode = node.code || stationName.split(' ').filter(w => w.length > 0).map(w => w[0].toUpperCase()).join('').substring(0, 6) || 'PS';
      const mockUser = {
        userId: 'mock-usr-' + badgeNo.toLowerCase(),
        badgeNo,
        name: node.officerName || 'Ramesh Kumar',
        role: mockRole,
        level: node.type,
        psId: node.type === 'PS' ? node.id : '',
        districtId: node.type === 'DISTRICT' ? node.id : 'DIST_NDD',
        stationName,
        districtKey: node.districtKey || '',
        psCode,
        username: node.officerName || 'Officer Ramesh',
        rank: node.rank || 'Head Constable',
        pis: node.pis || 'PIS-28521904',
      };

      const tokens = {
        access_token: 'mock-jwt-access-token',
        refresh_token: 'mock-jwt-refresh-token',
        user: mockUser
      };

      return Promise.reject({
        isMock: true,
        response: createMockResponse(tokens)
      });
    }

    if (url.includes('/auth/logout') && method === 'POST') {
      return Promise.reject({
        isMock: true,
        response: createMockResponse({ message: 'Session logged out' })
      });
    }

    if (url.includes('/auth/me') && method === 'GET') {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw createMockError('Unauthorized access', 401);
      }
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      // Extract active node user profile or default to HC
      const userJSON = localStorage.getItem('crime-diaries-auth');
      let defaultUser = {
        userId: 'mock-usr-hc001',
        badgeNo: 'HC001',
        name: 'HC Ramesh Kumar',
        role: 'PS',
        level: 'PS',
        psId: 'PS_NDD_PARLIAMENT_STREET',
        districtId: 'DIST_NDD',
        stationName: 'Parliament Street',
        districtKey: 'New Delhi District (NDD)',
        username: 'Ramesh Kumar',
        rank: 'Station Operator',
        pis: 'PIS-28521904',
      };
      if (userJSON) {
        try {
          const parsed = JSON.parse(userJSON);
          if (parsed.state?.user) defaultUser = parsed.state.user;
        } catch (e) { }
      }
      return Promise.reject({
        isMock: true,
        response: createMockResponse({ user: defaultUser })
      });
    }

    // Fields Form Schema definitions
    if (url.match(/\/fields\/form\/([A-Z_]+)/)) {
      const recordType = url.match(/\/fields\/form\/([A-Z_]+)/)[1];
      const schema = formSchemas[recordType] || [];
      return Promise.reject({
        isMock: true,
        response: createMockResponse(schema)
      });
    }

    // Fields Register definitions
    if (url.match(/\/fields$/)) {
      const allFields = [];
      Object.keys(formSchemas).forEach(rt => {
        formSchemas[rt].forEach(section => {
          section.fields.forEach(f => {
            allFields.push({
              id: 'fld-' + f.field_key,
              field_key: f.field_key,
              field_type: f.field_type,
              applicable_record_types: [rt],
              label_en: f.label_en,
              label_hi: f.label_hi,
              options: f.options || null,
              validation_rules: f.validation_rules || {},
              section: section.section,
              is_active: true
            });
          });
        });
      });
      return Promise.reject({
        isMock: true,
        response: createMockResponse(allFields)
      });
    }

    // List Records
    if (url.match(/\/records$/) && method === 'GET') {
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      return Promise.reject({
        isMock: true,
        response: createMockResponse(allRecords)
      });
    }

    // Single Record
    if (url.match(/\/records\/([A-Za-z0-9-]+)$/) && method === 'GET') {
      const recId = url.match(/\/records\/([A-Za-z0-9-]+)$/)[1];
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const record = allRecords.find(r => r.id === recId);
      if (!record) {
        throw createMockError('Record not found', 404);
      }
      return Promise.reject({
        isMock: true,
        response: createMockResponse(record)
      });
    }

    if (url.match(/\/records$/) && method === 'POST') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      const { record_type, data } = payload;
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');

      const userJSON = localStorage.getItem('crime-diaries-auth');
      let currentUser = { psId: 'PS_NDD_PARLIAMENT_STREET', districtId: 'DIST_NDD', username: 'HC Ramesh Kumar' };
      if (userJSON) {
        try {
          const parsed = JSON.parse(userJSON);
          if (parsed.state?.user) currentUser = parsed.state.user;
        } catch (e) { }
      }

      const _typeCodes = { CASE: 'CSE', ARREST: 'ARR', PCR_CALL: 'PCR', MISSING: 'MSP', UIDB: 'UDB' };
      const _year = new Date().getFullYear();
      const _psCode = currentUser.psCode || (currentUser.stationName?.split(' ').filter(w => w.length > 0).map(w => w[0].toUpperCase()).join('').substring(0, 6)) || 'PS';
      const _existingCount = allRecords.filter(r => r.record_type === record_type && r.ps_id === (currentUser.psId || 'PS_NDD_PARLIAMENT_STREET')).length;
      const _typeCode = _typeCodes[record_type] || record_type.substring(0, 3).toUpperCase();
      const mockUid = `${_typeCode}/${_year}/${_psCode}/${String(_existingCount + 1).padStart(6, '0')}`;

      const newRecord = {
        id: 'rec-' + Math.random().toString(36).substring(2, 9),
        record_type,
        ps_id: currentUser.psId || 'PS_NDD_PARLIAMENT_STREET',
        district_id: currentUser.districtId || 'DIST_NDD',
        current_status: 'DRAFT',
        current_level: 'PS',
        version: 1,
        uid: mockUid,
        created_by: currentUser.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data: { ...(data || {}), uid: mockUid },
        revisions: [
          {
            revision_number: 1,
            changed_by: currentUser.username,
            changed_at: new Date().toISOString(),
            level: 'PS',
            change_type: 'CREATE',
            comment: 'Draft entry initialized',
            field_changes: []
          }
        ],
        transitions: []
      };

      allRecords.push(newRecord);
      localStorage.setItem('prism_mock_records', JSON.stringify(allRecords));
      return Promise.reject({
        isMock: true,
        response: createMockResponse(newRecord)
      });
    }

    if (url.match(/\/records\/([A-Za-z0-9-]+)$/) && method === 'PUT') {
      const recId = url.match(/\/records\/([A-Za-z0-9-]+)$/)[1];
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      const { data } = payload;
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const idx = allRecords.findIndex(r => r.id === recId);
      if (idx === -1) {
        throw createMockError('Record not found', 404);
      }

      const record = allRecords[idx];
      if (record.current_status !== 'DRAFT' && record.current_status !== 'SENT_BACK_HC') {
        throw createMockError('Lock violation: Record can only be modified in DRAFT or SENT_BACK state', 400);
      }

      const userJSON = localStorage.getItem('crime-diaries-auth');
      let currentUsername = 'HC Ramesh Kumar';
      if (userJSON) {
        try {
          const parsed = JSON.parse(userJSON);
          if (parsed.state?.user?.username) currentUsername = parsed.state.user.username;
        } catch (e) { }
      }

      // Compute changes
      const changes = [];
      Object.keys(data).forEach(k => {
        if (data[k] !== record.data[k]) {
          changes.push({
            field_key: k,
            old_value: record.data[k] || '',
            new_value: data[k] || ''
          });
        }
      });

      record.data = { ...record.data, ...data };
      record.version += 1;
      record.updated_at = new Date().toISOString();
      record.revisions.unshift({
        revision_number: record.version,
        changed_by: currentUsername,
        changed_at: new Date().toISOString(),
        level: record.current_level,
        change_type: 'UPDATE',
        comment: 'Record edited',
        field_changes: changes
      });

      allRecords[idx] = record;
      localStorage.setItem('prism_mock_records', JSON.stringify(allRecords));
      return Promise.reject({
        isMock: true,
        response: createMockResponse(record)
      });
    }

    // Delete Record (DRAFT only)
    if (url.match(/\/records\/([A-Za-z0-9-]+)$/) && method === 'DELETE') {
      const recId = url.match(/\/records\/([A-Za-z0-9-]+)$/)[1];
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const record = allRecords.find(r => r.id === recId);
      if (!record) {
        throw createMockError('Record not found', 404);
      }
      if (record.current_status !== 'DRAFT') {
        throw createMockError('Cannot delete non-draft record', 400);
      }
      const filtered = allRecords.filter(r => r.id !== recId);
      localStorage.setItem('prism_mock_records', JSON.stringify(filtered));
      return Promise.reject({
        isMock: true,
        response: createMockResponse({ message: 'Draft deleted successfully' })
      });
    }

    // Submit Record
    if (url.match(/\/records\/([A-Za-z0-9-]+)\/submit$/) && method === 'POST') {
      const recId = url.match(/\/records\/([A-Za-z0-9-]+)\/submit$/)[1];
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const idx = allRecords.findIndex(r => r.id === recId);
      if (idx === -1) {
        throw createMockError('Record not found', 404);
      }

      const record = allRecords[idx];
      record.current_status = 'PENDING_SHO';
      record.updated_at = new Date().toISOString();
      record.transitions.unshift({
        from_level: 'PS',
        to_level: 'PS',
        from_status: 'DRAFT',
        to_status: 'PENDING_SHO',
        action: 'SUBMIT',
        performed_by: 'HC Ramesh Kumar',
        performed_at: new Date().toISOString(),
        comment: 'Submitted for station approval'
      });

      allRecords[idx] = record;
      localStorage.setItem('prism_mock_records', JSON.stringify(allRecords));
      return Promise.reject({
        isMock: true,
        response: createMockResponse(record)
      });
    }

    // Approve Record
    if (url.match(/\/records\/([A-Za-z0-9-]+)\/approve$/) && method === 'POST') {
      const recId = url.match(/\/records\/([A-Za-z0-9-]+)\/approve$/)[1];
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const idx = allRecords.findIndex(r => r.id === recId);
      if (idx === -1) {
        throw createMockError('Record not found', 404);
      }

      const userJSON = localStorage.getItem('crime-diaries-auth');
      let currentUser = { role: 'SHO', username: 'SHO Sanjay Sharma' };
      if (userJSON) {
        try {
          const parsed = JSON.parse(userJSON);
          if (parsed.state?.user) currentUser = parsed.state.user;
        } catch (e) { }
      }

      const record = allRecords[idx];
      const oldStatus = record.current_status;

      if (record.current_status === 'PENDING_SHO') {
        record.current_status = 'DISTRICT_REVIEW';
        record.current_level = 'DISTRICT';
      } else if (record.current_status === 'DISTRICT_REVIEW') {
        record.current_status = 'COMPILED';
        record.current_level = 'HQ';
      }

      record.updated_at = new Date().toISOString();
      record.transitions.unshift({
        from_level: oldStatus === 'PENDING_SHO' ? 'PS' : 'DISTRICT',
        to_level: record.current_level,
        from_status: oldStatus,
        to_status: record.current_status,
        action: 'APPROVE',
        performed_by: currentUser.username,
        performed_at: new Date().toISOString(),
        comment: 'Approved in operational hierarchy'
      });

      allRecords[idx] = record;
      localStorage.setItem('prism_mock_records', JSON.stringify(allRecords));
      return Promise.reject({
        isMock: true,
        response: createMockResponse(record)
      });
    }

    // Send Back Record
    if (url.match(/\/records\/([A-Za-z0-9-]+)\/send-back$/) && method === 'POST') {
      const recId = url.match(/\/records\/([A-Za-z0-9-]+)\/send-back$/)[1];
      const { comment, target_fields } = JSON.parse(config.data);
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const idx = allRecords.findIndex(r => r.id === recId);
      if (idx === -1) {
        throw createMockError('Record not found', 404);
      }

      const userJSON = localStorage.getItem('crime-diaries-auth');
      let currentUser = { role: 'SHO', username: 'SHO Sanjay Sharma' };
      if (userJSON) {
        try {
          const parsed = JSON.parse(userJSON);
          if (parsed.state?.user) currentUser = parsed.state.user;
        } catch (e) { }
      }

      const record = allRecords[idx];
      const oldStatus = record.current_status;
      record.current_status = 'SENT_BACK_HC';
      record.current_level = 'PS';
      record.updated_at = new Date().toISOString();

      record.transitions.unshift({
        from_level: oldStatus === 'PENDING_SHO' ? 'PS' : 'DISTRICT',
        to_level: 'PS',
        from_status: oldStatus,
        to_status: 'SENT_BACK_HC',
        action: 'SEND_BACK',
        performed_by: currentUser.username,
        performed_at: new Date().toISOString(),
        comment: comment || 'Correction requested',
        target_fields: target_fields || []
      });

      allRecords[idx] = record;
      localStorage.setItem('prism_mock_records', JSON.stringify(allRecords));
      return Promise.reject({
        isMock: true,
        response: createMockResponse(record)
      });
    }

    // Workflow Queue for Approver
    if (url.includes('/workflow/queue') && method === 'GET') {
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const userJSON = localStorage.getItem('crime-diaries-auth');
      let currentUser = { role: 'SHO', psId: 'PS_NDD_PARLIAMENT_STREET', districtId: 'DIST_NDD' };
      if (userJSON) {
        try {
          const parsed = JSON.parse(userJSON);
          if (parsed.state?.user) currentUser = parsed.state.user;
        } catch (e) { }
      }

      let filteredQueue = [];
      if (currentUser.role === 'SHO') {
        filteredQueue = allRecords.filter(r => r.current_status === 'PENDING_SHO' && r.ps_id === currentUser.psId);
      } else if (currentUser.role === 'DISTRICT' || currentUser.role === 'DISTRICT_OFFICER') {
        filteredQueue = allRecords.filter(r => r.current_status === 'DISTRICT_REVIEW' && r.district_id === currentUser.districtId);
      } else {
        filteredQueue = allRecords.filter(r => r.current_status !== 'DRAFT');
      }

      return Promise.reject({
        isMock: true,
        response: createMockResponse(filteredQueue)
      });
    }

    // Workflow Queue Count
    if (url.includes('/workflow/queue/count') && method === 'GET') {
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const userJSON = localStorage.getItem('crime-diaries-auth');
      let currentUser = { role: 'SHO', psId: 'PS_NDD_PARLIAMENT_STREET', districtId: 'DIST_NDD' };
      if (userJSON) {
        try {
          const parsed = JSON.parse(userJSON);
          if (parsed.state?.user) currentUser = parsed.state.user;
        } catch (e) { }
      }

      let count = 0;
      if (currentUser.role === 'SHO') {
        count = allRecords.filter(r => r.current_status === 'PENDING_SHO' && r.ps_id === currentUser.psId).length;
      } else if (currentUser.role === 'DISTRICT' || currentUser.role === 'DISTRICT_OFFICER') {
        count = allRecords.filter(r => r.current_status === 'DISTRICT_REVIEW' && r.district_id === currentUser.districtId).length;
      }

      return Promise.reject({
        isMock: true,
        response: createMockResponse({ count })
      });
    }

    // List Compilations
    if (url.match(/\/compilations$/) && method === 'GET') {
      const comps = [
        {
          id: 'comp-001',
          source_level: 'DISTRICT',
          target_level: 'HQ',
          route: 'OPS_CHAIN',
          period: '2026-06-15',
          source_entity_id: 'DIST_NDD',
          status: 'DRAFT',
          record_ids: ['rec-c001', 'rec-p001'],
          compiled_summary: { firs: 1, arrests: 0, pcrCalls: 1, missing: 0, uidb: 0 },
          submitted_by: 'Sh. Ashok Singh, IPS',
          submitted_at: null
        }
      ];
      return Promise.reject({
        isMock: true,
        response: createMockResponse(comps)
      });
    }

    // Create Compilation
    if (url.match(/\/compilations$/) && method === 'POST') {
      const { period, district_id } = JSON.parse(config.data);
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');

      // Filter records in district for the date
      const matched = allRecords.filter(r => r.record_date === period && r.current_status === 'COMPILED');
      const firs = matched.filter(r => r.record_type === 'CASE').length;
      const arrests = matched.filter(r => r.record_type === 'ARREST').length;
      const pcrCalls = matched.filter(r => r.record_type === 'PCR_CALL').length;
      const missing = matched.filter(r => r.record_type === 'MISSING').length;
      const uidb = matched.filter(r => r.record_type === 'UIDB').length;

      const newComp = {
        id: 'comp-' + Math.random().toString(36).substring(2, 9),
        source_level: 'DISTRICT',
        target_level: 'HQ',
        route: 'DIRECT_HQ',
        period: period || new Date().toISOString().split('T')[0],
        source_entity_id: district_id || 'DIST_NDD',
        status: 'DRAFT',
        record_ids: matched.map(r => r.id),
        compiled_summary: { firs, arrests, pcrCalls, missing, uidb },
        submitted_by: 'DCP Ashok Kumar, IPS',
        submitted_at: null
      };

      return Promise.reject({
        isMock: true,
        response: createMockResponse(newComp)
      });
    }

    // Submit Compilation
    if (url.match(/\/compilations\/([A-Za-z0-9-]+)\/submit$/) && method === 'POST') {
      const compId = url.match(/\/compilations\/([A-Za-z0-9-]+)\/submit$/)[1];
      return Promise.reject({
        isMock: true,
        response: createMockResponse({ id: compId, status: 'SUBMITTED', submitted_at: new Date().toISOString() })
      });
    }

    // Analytics Overview
    if (url.includes('/analytics/overview') && method === 'GET') {
      const allRecords = JSON.parse(localStorage.getItem('prism_mock_records') || '[]');
      const firs = allRecords.filter(r => r.record_type === 'CASE').length;
      const arrests = allRecords.filter(r => r.record_type === 'ARREST').length;
      const pcrCalls = allRecords.filter(r => r.record_type === 'PCR_CALL').length;
      const missing = allRecords.filter(r => r.record_type === 'MISSING').length;
      const uidb = allRecords.filter(r => r.record_type === 'UIDB').length;

      return Promise.reject({
        isMock: true,
        response: createMockResponse({
          arrests_today: arrests,
          pcr_today: pcrCalls,
          cases_today: firs,
          uidb_today: uidb,
          pending_approvals: allRecords.filter(r => r.current_status.startsWith('PENDING') || r.current_status.includes('REVIEW')).length
        })
      });
    }

    // Analytics by Crime Head
    if (url.includes('/analytics/by-crime-head') && method === 'GET') {
      const data = [
        { crimeHead: 'Theft', count: 12 },
        { crimeHead: 'Robbery', count: 4 },
        { crimeHead: 'Snatching', count: 8 },
        { crimeHead: 'Burglary', count: 3 },
        { crimeHead: 'Murder', count: 1 },
        { crimeHead: 'Other', count: 15 }
      ];
      return Promise.reject({
        isMock: true,
        response: createMockResponse(data)
      });
    }

    // Analytics by PS
    if (url.includes('/analytics/by-ps') && method === 'GET') {
      const data = [
        { station: 'Parliament Street', cases: 8, arrests: 4, pcr: 15 },
        { station: 'Connaught Place', cases: 14, arrests: 7, pcr: 22 },
        { station: 'Chanakyapuri', cases: 3, arrests: 1, pcr: 9 },
        { station: 'Mandir Marg', cases: 5, arrests: 2, pcr: 11 },
        { station: 'Tughlak Road', cases: 2, arrests: 0, pcr: 6 }
      ];
      return Promise.reject({
        isMock: true,
        response: createMockResponse(data)
      });
    }

    // Analytics Trends
    if (url.includes('/analytics/trends') && method === 'GET') {
      const data = [
        { name: 'Monday', cases: 4, arrests: 2, pcr: 12 },
        { name: 'Tuesday', cases: 5, arrests: 3, pcr: 8 },
        { name: 'Wednesday', cases: 8, arrests: 4, pcr: 18 },
        { name: 'Thursday', cases: 3, arrests: 1, pcr: 10 },
        { name: 'Friday', cases: 9, arrests: 6, pcr: 14 },
        { name: 'Saturday', cases: 11, arrests: 8, pcr: 25 },
        { name: 'Sunday', cases: 7, arrests: 5, pcr: 19 }
      ];
      return Promise.reject({
        isMock: true,
        response: createMockResponse(data)
      });
    }

    // Report generate
    if (url.includes('/reports/generate') && method === 'POST') {
      const reqId = 'rep-' + Math.random().toString(36).substring(2, 9);
      return Promise.reject({
        isMock: true,
        response: createMockResponse({ reportId: reqId, status: 'GENERATING' })
      });
    }

    // Report status check
    if (url.match(/\/reports\/status\/([A-Za-z0-9-]+)$/)) {
      const repId = url.match(/\/reports\/status\/([A-Za-z0-9-]+)$/)[1];
      return Promise.reject({
        isMock: true,
        response: createMockResponse({
          reportId: repId,
          status: 'READY',
          downloadUrl: `http://localhost:5173/mock-report-${repId}.xlsx`
        })
      });
    }

    // Hierarchy nodes list
    if (url.includes('/admin/hierarchy') && method === 'GET') {
      return Promise.reject({
        isMock: true,
        response: createMockResponse(POLICE_HIERARCHY)
      });
    }

    if (url.includes('/hierarchy/nodes') && method === 'GET') {
      const list = [];
      const traverse = (node, parentId = null) => {
        list.push({
          id: node.id,
          node_type: node.type,
          name_en: node.name,
          name_hi: node.name,
          code: node.id,
          parent_id: parentId,
          is_active: true
        });
        if (node.children) {
          node.children.forEach(child => traverse(child, node.id));
        }
      };
      traverse(POLICE_HIERARCHY);
      return Promise.reject({
        isMock: true,
        response: createMockResponse(list)
      });
    }

    // Users list (support both /users and /admin/users paths)
    if ((url.includes('/admin/users') || url.match(/\/users$/)) && method === 'GET') {
      const storedUsers = JSON.parse(localStorage.getItem('prism_mock_users') || 'null');
      const mockUsers = storedUsers || [
        { id: 'usr-1', username: 'HC Ramesh Kumar', badge_no: 'HC001', badgeNo: 'HC001', name_en: 'HC Ramesh Kumar', role: 'HC', station_id: 'PS_NDD_PARLIAMENT_STREET', psId: 'PS_NDD_PARLIAMENT_STREET', district_id: 'DIST_NDD', districtId: 'DIST_NDD', is_active: true },
        { id: 'usr-2', username: 'SHO Sanjay Sharma', badge_no: 'SHO102', badgeNo: 'SHO102', name_en: 'SHO Sanjay Sharma', role: 'SHO', station_id: 'PS_NDD_PARLIAMENT_STREET', psId: 'PS_NDD_PARLIAMENT_STREET', district_id: 'DIST_NDD', districtId: 'DIST_NDD', is_active: true },
        { id: 'usr-3', username: 'DCP Ashok Kumar', badge_no: 'DCP491', badgeNo: 'DCP491', name_en: 'DCP Ashok Kumar', role: 'DISTRICT_OFFICER', station_id: null, psId: null, district_id: 'DIST_NDD', districtId: 'DIST_NDD', is_active: true },
        { id: 'usr-4', username: 'Director Vikram Singh', badge_no: 'HQ001', badgeNo: 'HQ001', name_en: 'Director Vikram Singh', role: 'HQ_ADMIN', station_id: null, psId: null, district_id: null, districtId: null, is_active: true },
      ];
      if (!storedUsers) localStorage.setItem('prism_mock_users', JSON.stringify(mockUsers));
      return Promise.reject({ isMock: true, response: createMockResponse(mockUsers) });
    }

    // Create User (POST /users or /admin/users)
    if ((url.includes('/admin/users') || url.match(/\/users$/)) && method === 'POST') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      const users = JSON.parse(localStorage.getItem('prism_mock_users') || '[]');
      const newUser = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        username: payload.name_en || payload.username || payload.badgeNo,
        name_en: payload.name_en || payload.username || payload.badgeNo,
        badge_no: payload.badgeNo || payload.badge_no,
        badgeNo: payload.badgeNo || payload.badge_no,
        role: payload.role || 'HC',
        station_id: payload.psId || payload.station_id || null,
        psId: payload.psId || null,
        district_id: payload.districtId || payload.district_id || null,
        districtId: payload.districtId || null,
        is_active: true
      };
      users.push(newUser);
      localStorage.setItem('prism_mock_users', JSON.stringify(users));
      return Promise.reject({ isMock: true, response: createMockResponse(newUser) });
    }

    // Update User (PUT /users/:id or /admin/users/:id)
    if ((url.match(/\/admin\/users\/([A-Za-z0-9-]+)$/) || url.match(/\/users\/([A-Za-z0-9-]+)$/)) && method === 'PUT') {
      const userId = (url.match(/\/users\/([A-Za-z0-9-]+)$/) || [])[1];
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      const users = JSON.parse(localStorage.getItem('prism_mock_users') || '[]');
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...payload };
        localStorage.setItem('prism_mock_users', JSON.stringify(users));
      }
      return Promise.reject({ isMock: true, response: createMockResponse(idx !== -1 ? users[idx] : { message: 'Updated' }) });
    }

    // Delete User (DELETE /users/:id)
    if ((url.match(/\/admin\/users\/([A-Za-z0-9-]+)$/) || url.match(/\/users\/([A-Za-z0-9-]+)$/)) && method === 'DELETE') {
      const userId = (url.match(/\/users\/([A-Za-z0-9-]+)$/) || [])[1];
      const users = JSON.parse(localStorage.getItem('prism_mock_users') || '[]');
      const updated = users.map(u => u.id === userId ? { ...u, is_active: false } : u);
      localStorage.setItem('prism_mock_users', JSON.stringify(updated));
      return Promise.reject({ isMock: true, response: createMockResponse({ message: 'User deactivated' }) });
    }

    // Audit Logs (GET /audit)
    if (url.match(/\/audit$/) && method === 'GET') {
      const mockLogs = [
        { id: 'al-1', action: 'LOGIN', table_name: 'sessions', changed_by_role: 'HC', changed_at: new Date(Date.now() - 3600000).toISOString(), ip_address: '10.0.0.1', field_name: null, reason: null },
        { id: 'al-2', action: 'CREATE', table_name: 'records', changed_by_role: 'HC', changed_at: new Date(Date.now() - 7200000).toISOString(), ip_address: '10.0.0.1', field_name: 'fir_no', reason: 'Initial FIR entry' },
        { id: 'al-3', action: 'SUBMIT', table_name: 'records', changed_by_role: 'HC', changed_at: new Date(Date.now() - 5400000).toISOString(), ip_address: '10.0.0.1', field_name: null, reason: 'Submitted for SHO review' },
        { id: 'al-4', action: 'UPDATE', table_name: 'records', changed_by_role: 'SHO', changed_at: new Date(Date.now() - 1800000).toISOString(), ip_address: '10.0.0.5', field_name: 'current_status', reason: 'Sent back to HC for correction' },
        { id: 'al-5', action: 'OVERRIDE', table_name: 'records', changed_by_role: 'DISTRICT_OFFICER', changed_at: new Date(Date.now() - 900000).toISOString(), ip_address: '10.0.0.10', field_name: 'fir_no', reason: 'DCP override - FIR number corrected' },
      ];
      return Promise.reject({ isMock: true, response: createMockResponse({ logs: mockLogs }) });
    }

    // Custom Fields listing (GET /admin/custom-fields)
    if (url.includes('/admin/custom-fields') && method === 'GET') {
      return Promise.reject({ isMock: true, response: createMockResponse({ customFields: [] }) });
    }

    // Create Custom Field (POST /admin/custom-fields)
    if (url.includes('/admin/custom-fields') && method === 'POST') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      return Promise.reject({ isMock: true, response: createMockResponse({ id: 'cf-' + Date.now(), ...payload }) });
    }

    // If no specific mock matched, return empty success response
    return Promise.reject({
      isMock: true,
      response: createMockResponse({ message: 'Success (Mock Fallthrough)' })
    });
  },
  (error) => {
    // If it's our rejected mock promise, return the response data
    if (error && error.isMock) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

export default api;
export { formSchemas };
