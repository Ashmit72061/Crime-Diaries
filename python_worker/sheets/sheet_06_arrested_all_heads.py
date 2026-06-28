from classifiers import is_preventive_arrest

NUM = 6
TABLE_NAME = 'excel_6arrested_all_heads'
LABEL = 'Arrested - All Heads'
COLUMNS = ['bnsipc', 'total_no_dd_126170_bnss', 'total_no_dd_126169_bnss', 'total_no_dd_109_bnss', '109_g', 'total_l_no_dd_110_bnss', '110_g', '929397_dp_act', 'total_no_dd_40_ex', '40_ex', '351d', 'aact', 'gact', '33_ex', 'ndps', 'others_act', 'others_bnss', 'po']
COLUMN_LABELS = {
    'bnsipc': 'BNS/IPC',
    'total_no_dd_126170_bnss': 'Total No. DD – 126/170 BNSS',
    'total_no_dd_126169_bnss': 'Total No. DD – 126/169 BNSS',
    'total_no_dd_109_bnss': 'Total No. DD – 109 BNSS',
    '109_g': '109 G',
    'total_l_no_dd_110_bnss': 'Total No. DD – 110 BNSS',
    '110_g': '110 G',
    '929397_dp_act': '92/93/97 DP Act',
    'total_no_dd_40_ex': 'Total No. DD – 40 Ex.',
    '40_ex': '40 Ex.',
    '351d': '35.1D',
    'aact': 'A.Act',
    'gact': 'G.Act',
    '33_ex': '33 Ex.',
    'ndps': 'NDPS',
    'others_act': 'Others Act',
    'others_bnss': 'Others BNSS',
    'po': 'PO',
}


def summarize(classified):
    arrests = classified['arrests']
    bnsipc = dp_act = po = aact = gact = ndps = 0
    ex_40 = ex_33 = bns_351d = 0
    dd_126170 = dd_126169 = dd_109 = g_109 = dd_110 = g_110 = 0
    others_act = others_bnss = 0

    for r in arrests:
        d = r['data']
        s = (d.get('sections') or '').lower()
        a = (d.get('act_name') or '').lower()
        ch = (d.get('crime_head') or '').upper()

        if ch == 'PO' or d.get('proclaimed_offender') is True:
            po += 1
            continue

        if 'excise' in a:
            if '40' in s:
                ex_40 += 1
            elif '33' in s:
                ex_33 += 1
            else:
                others_act += 1
        elif 'arms' in a:
            aact += 1
        elif 'gambling' in a:
            gact += 1
        elif 'ndps' in a:
            ndps += 1
        elif is_preventive_arrest(d):
            if '126' in s and '170' in s:
                dd_126170 += 1
            elif '126' in s and '169' in s:
                dd_126169 += 1
            elif '109' in s and 'g' in s:
                g_109 += 1
            elif '109' in s:
                dd_109 += 1
            elif '110' in s and 'g' in s:
                g_110 += 1
            elif '110' in s:
                dd_110 += 1
            elif '92' in s or '93' in s or '97' in s:
                dp_act += 1
            else:
                others_bnss += 1
        else:
            bnsipc += 1
            if '351' in s:
                bns_351d += 1

    return [{
        'bnsipc': bnsipc,
        'total_no_dd_126170_bnss': dd_126170,
        'total_no_dd_126169_bnss': dd_126169,
        'total_no_dd_109_bnss': dd_109,
        '109_g': g_109,
        'total_l_no_dd_110_bnss': dd_110,
        '110_g': g_110,
        '929397_dp_act': dp_act,
        'total_no_dd_40_ex': ex_40,
        '40_ex': ex_40,
        '351d': bns_351d,
        'aact': aact,
        'gact': gact,
        '33_ex': ex_33,
        'ndps': ndps,
        'others_act': others_act,
        'others_bnss': others_bnss,
        'po': po,
    }]
