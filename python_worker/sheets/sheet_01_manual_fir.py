from classifiers import is_electronic_case
from formatters import format_person_no_age

NUM = 1
TABLE_NAME = 'excel_1manual_fir'
LABEL = 'Manual FIR'
COLUMNS = ['ps', 'fir_no', 'us', 'complainant_details', 'time_of_occurrence', 'place_of_occurrence', 'gist', 'arrested_details']
COLUMN_LABELS = {}


def filter_records(classified):
    return [r for r in classified['cases'] if not is_electronic_case(r['data'])]


def map_row(r, idx):
    d = r['data']
    return {
        'ps': r.get('ps_name') or '',
        'fir_no': d.get('fir_no') or '',
        'us': d.get('sections') or d.get('under_section') or '',
        'complainant_details': format_person_no_age(
            d.get('complainant_name'),
            d.get('complainant_father_husband_name'),
            d.get('complainant_address'),
            d,
        ),
        'time_of_occurrence': d.get('occurrence_time') or d.get('gd_time') or '',
        'place_of_occurrence': d.get('occurrence_place') or '',
        'gist': d.get('brief_facts') or '',
        'arrested_details': d.get('arrested_person') or d.get('accused_name') or 'None',
    }
