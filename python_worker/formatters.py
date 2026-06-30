from datetime import date as _date, datetime as _datetime


def fmt_date(d_str):
    """Return DD/MM/YYYY from an ISO date string, date, or datetime."""
    if not d_str:
        return ''
    if isinstance(d_str, (_date, _datetime)):
        return d_str.strftime('%d/%m/%Y')
    s = str(d_str).split('T')[0]
    parts = s.split('-')
    if len(parts) == 3:
        return f'{parts[2]}/{parts[1]}/{parts[0]}'
    return str(d_str)


def format_person(name, age, father_husband_name, address, record_data=None):
    """
    Build "Name @ Nickname S/O Father R/O Address Age- N yrs" string.
    Mirrors the JS formatPerson function exactly.
    """
    d = record_data or {}
    gender = None
    relation_type = None
    nickname = None

    if d:
        # Try to find which prefix owns father_husband_name
        prefix = ''
        for k, v in d.items():
            if k.endswith('_relative_name') and v == father_husband_name:
                prefix = k[:-len('_relative_name')]
                break
            if k.endswith('_father_husband_name') and v == father_husband_name:
                prefix = k[:-len('_father_husband_name')]
                break

        if prefix:
            gender = d.get(f'{prefix}_gender')
            relation_type = d.get(f'{prefix}_relation_type') or d.get(f'{prefix}_relationship')
            nickname = d.get(f'{prefix}_nickname') or d.get(f'{prefix}_nick_name')

        if not gender:
            gender = (d.get('gender') or d.get('sex') or d.get('arrested_gender')
                      or d.get('complainant_gender') or d.get('accused_gender') or d.get('deceased_gender'))
        if not relation_type:
            relation_type = (d.get('relation_type') or d.get('relationship')
                             or d.get('arrested_relation_type') or d.get('complainant_relation_type')
                             or d.get('accused_relation_type') or d.get('deceased_relation_type'))
        if not nickname:
            nickname = (d.get('nickname') or d.get('nick_name') or d.get('arrested_nickname')
                        or d.get('complainant_nickname') or d.get('accused_nickname'))

    parts = []

    name_str = name or ''
    if nickname and name_str and nickname not in name_str:
        name_str += f' @ {nickname}'
    if name_str:
        parts.append(name_str)

    rel_prefix = 'S/O'
    if relation_type:
        rel_lower = str(relation_type).lower()
        if rel_lower == 'husband':
            rel_prefix = 'W/O'
        elif rel_lower in ('father', 'mother'):
            rel_prefix = 'D/O' if gender and str(gender).lower() == 'female' else 'S/O'
        else:
            rel_prefix = 'C/O'
    else:
        if gender and str(gender).lower() == 'female':
            rel_prefix = 'D/O'

    if father_husband_name:
        parts.append(f'{rel_prefix} {father_husband_name}')
    if address:
        parts.append(f'R/O {address}')
    if age:
        parts.append(f'Age- {age} yrs')

    return ' '.join(parts)


def format_person_no_age(name, father_husband_name, address, record_data=None):
    return format_person(name, None, father_husband_name, address, record_data)
