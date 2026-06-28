def _head(d):
    return (d.get('local_head') or d.get('case_head') or d.get('crime_head') or '').lower()

def _sec(d):
    return (d.get('sections') or '').lower()

def _act(d):
    return (d.get('act_name') or '').lower()


def is_burglary(d):
    return 'burglary' in _head(d)

def is_house_theft(d):
    return 'house theft' in _head(d)

def is_mvt(d):
    h = _head(d)
    return 'mvt' in h or 'mvct' in h or 'vehicle' in h

def is_other_theft(d):
    h = _head(d)
    return 'theft' in h and not is_house_theft(d) and not is_mvt(d) and 'mobile' not in h

def is_electronic_case(d):
    return is_burglary(d) or is_house_theft(d) or is_other_theft(d) or is_mvt(d)

def is_inquest_case(d):
    return 'inquest' in _head(d)

def is_ndps_case(d):
    return 'ndps' in _head(d) or 'ndps' in _act(d)

def is_mobile_recovery_case(d):
    h = _head(d)
    return 'mobile' in h or 'phone' in h or 'recovery' in h

def is_important_case(d):
    if d.get('important') is True or d.get('is_important') is True:
        return True
    h = _head(d)
    return any(k in h for k in ('murder', 'robbery', 'dacoity', 'rape', 'pocso', 'sensitive'))

def is_preventive_arrest(d):
    h = _head(d)
    s = _sec(d)
    if 'preventive' in h or 'preventive' in _act(d):
        return True
    return any(k in s for k in ('107', '109', '110', '151', '126', '128', '129', 'dp act'))

def is_financial_fraud_arrest(d):
    h = _head(d)
    if any(k in h for k in ('fraud', 'cyber', 'cheating')):
        return True
    return '420' in _sec(d)

def is_disposed(d):
    return (d.get('status') or '').lower() in ('chargesheeted', 'closed')
