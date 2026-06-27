import { isPreventiveArrest } from '../classifiers.js';

export default {
  tableName: 'excel_6arrested_all_heads',
  label:     'Arrested - All Heads',
  type:      'summary',
  num:       6,
  columns:   ['bnsipc', 'total_no_dd_126170_bnss', 'total_no_dd_126169_bnss', 'total_no_dd_109_bnss', '109_g', 'total_l_no_dd_110_bnss', '110_g', '929397_dp_act', 'total_no_dd_40_ex', '40_ex', '351d', 'aact', 'gact', '33_ex', 'ndps', 'others_act', 'others_bnss', 'po'],
  columnLabels: {
    bnsipc:                  'BNS/IPC',
    total_no_dd_126170_bnss: 'Total No. DD – 126/170 BNSS',
    total_no_dd_126169_bnss: 'Total No. DD – 126/169 BNSS',
    total_no_dd_109_bnss:    'Total No. DD – 109 BNSS',
    '109_g':                 '109 G',
    total_l_no_dd_110_bnss:  'Total No. DD – 110 BNSS',
    '110_g':                 '110 G',
    '929397_dp_act':         '92/93/97 DP Act',
    total_no_dd_40_ex:       'Total No. DD – 40 Ex.',
    '40_ex':                 '40 Ex.',
    '351d':                  '35.1D',
    aact:                    'A.Act',
    gact:                    'G.Act',
    '33_ex':                 '33 Ex.',
    ndps:                    'NDPS',
    others_act:              'Others Act',
    others_bnss:             'Others BNSS',
    po:                      'PO',
  },
  summarize: ({ arrests }) => {
    let bnsipc = 0, dp_act = 0, po = 0, aact = 0, gact = 0, ndps = 0;
    let ex_40 = 0, ex_33 = 0, bns_351d = 0;
    let dd_126170 = 0, dd_126169 = 0, dd_109 = 0, g_109 = 0, dd_110 = 0, g_110 = 0;
    let others_act = 0, others_bnss = 0;

    arrests.forEach(r => {
      const d    = r.data;
      const s    = (d.sections || '').toLowerCase();
      const a    = (d.act_name || '').toLowerCase();
      const ch   = (d.crime_head || '').toUpperCase();

      if (ch === 'PO' || d.proclaimed_offender === true) { po++; return; }

      if (a.includes('excise')) {
        if (s.includes('40')) ex_40++;
        else if (s.includes('33')) ex_33++;
        else others_act++;
      } else if (a.includes('arms'))    { aact++; }
        else if (a.includes('gambling')) { gact++; }
        else if (a.includes('ndps'))     { ndps++; }
        else if (isPreventiveArrest(d)) {
          if (s.includes('126') && s.includes('170'))                      dd_126170++;
          else if (s.includes('126') && s.includes('169'))                 dd_126169++;
          else if (s.includes('109') && (s.includes('g')))                 g_109++;
          else if (s.includes('109'))                                       dd_109++;
          else if (s.includes('110') && (s.includes('g')))                 g_110++;
          else if (s.includes('110'))                                       dd_110++;
          else if (s.includes('92') || s.includes('93') || s.includes('97')) dp_act++;
          else others_bnss++;
        } else {
          bnsipc++;
          if (s.includes('351')) bns_351d++;
        }
    });

    return [{
      bnsipc,
      total_no_dd_126170_bnss: dd_126170,
      total_no_dd_126169_bnss: dd_126169,
      total_no_dd_109_bnss:    dd_109,
      '109_g':                 g_109,
      total_l_no_dd_110_bnss:  dd_110,
      '110_g':                 g_110,
      '929397_dp_act':         dp_act,
      total_no_dd_40_ex:       ex_40,
      '40_ex':                 ex_40,
      '351d':                  bns_351d,
      aact, gact, '33_ex': ex_33, ndps, others_act, others_bnss, po,
    }];
  },
};
