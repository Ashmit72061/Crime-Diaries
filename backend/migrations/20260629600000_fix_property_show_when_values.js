// The property_major_category options use short values (Jewellery, Electronics,
// Documents, Drugs, Arms) but the previous migration used the long label strings.
// This migration corrects the show_when on all affected repeater fields.

const FIXES = [
  { prefixes: ['prop_gold_'],   wrong: 'Gold/Jewellery',            correct: 'Jewellery' },
  { prefixes: ['prop_elec_'],   wrong: 'Electronics/Gadgets',       correct: 'Electronics' },
  { prefixes: ['prop_doc_'],    wrong: 'Official/Personal Documents', correct: 'Documents' },
  { prefixes: ['prop_drug_'],   wrong: 'Drugs/Narcotics',            correct: 'Drugs' },
  { prefixes: ['prop_arms_'],   wrong: 'Arms/Ammunition',            correct: 'Arms' },
];

export const up = async (knex) => {
  for (const { prefixes, wrong, correct } of FIXES) {
    for (const prefix of prefixes) {
      await knex('field_registry')
        .where('repeater_entity', 'PROPERTY')
        .whereLike('field_key', `${prefix}%`)
        .update({
          show_when: JSON.stringify({ field: 'property_major_category', value: [correct] }),
        });
    }
  }
};

export const down = async (knex) => {
  for (const { prefixes, wrong, correct } of FIXES) {
    for (const prefix of prefixes) {
      await knex('field_registry')
        .where('repeater_entity', 'PROPERTY')
        .whereLike('field_key', `${prefix}%`)
        .update({
          show_when: JSON.stringify({ field: 'property_major_category', value: [wrong] }),
        });
    }
  }
};
