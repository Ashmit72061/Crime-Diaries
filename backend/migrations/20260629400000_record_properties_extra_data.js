export const up = async (knex) => {
  await knex.schema.table('record_properties', (t) => {
    t.text('uid');                // case UID / unique record ID
    t.text('fir_no');             // FIR number from record data
    t.jsonb('extra_data');        // category-specific detail fields
    t.text('updated_at');
  });
};

export const down = async (knex) => {
  await knex.schema.table('record_properties', (t) => {
    t.dropColumn('uid');
    t.dropColumn('fir_no');
    t.dropColumn('extra_data');
    t.dropColumn('updated_at');
  });
};
