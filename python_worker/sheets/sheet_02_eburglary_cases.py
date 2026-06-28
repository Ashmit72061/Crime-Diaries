from classifiers import is_burglary
from formatters import format_person_no_age

NUM = 2
TABLE_NAME = 'excel_2eburglary_cases'
LABEL = 'E-Burglary Cases'
COLUMNS = ['sr_no', 'ps', 'efir_no', 'us', 'complainant_details', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no']
COLUMN_LABELS = {}


def filter_records(classified):
    return [r for r in classified['cases'] if is_burglary(r['data'])]


def map_row(r, idx):
    d = r['data']
    return {
        'sr_no': idx + 1,
        'ps': r.get('ps_name') or '',
        'efir_no': d.get('fir_no') or '',
        'us': d.get('sections') or '',
        'complainant_details': format_person_no_age(
            d.get('complainant_name'),
            d.get('complainant_father_husband_name'),
            d.get('complainant_address'),
            d,
        ),
        'time_of_occurrence': d.get('occurrence_time') or d.get('gd_time') or '',
        'stolen_items': d.get('property_description') or d.get('stolen_items') or 'None',
        'place_of_occurrence': d.get('occurrence_place') or '',
        'io_name': d.get('io_name') or '',
        'io_mobile_no': d.get('io_mobile') or d.get('io_mobile_no') or '',
        'beat_no': d.get('beat_no') or '',
    }
