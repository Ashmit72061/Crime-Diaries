export async function up(knex) {
  await knex.schema.alterTable('field_registry', (table) => {
    table.float('sort_order').alter();
    table.boolean('readonly').defaultTo(false);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('field_registry', (table) => {
    table.integer('sort_order').alter();
    table.dropColumn('readonly');
  });
}
