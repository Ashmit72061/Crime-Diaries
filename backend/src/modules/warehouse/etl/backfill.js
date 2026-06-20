/**
 * Backfill Engine (ETL Layer)
 * ===========================
 * Handles one-time bulk backfill of historical data from the live operational
 * table to the reporting warehouse.
 */

import { runWarehouseSync } from './sync.js';
import { clearDimensionCaches, syncHierarchyDimensions } from './dimensions.js';
import { invalidateWarehouseCache } from '../warehouse.db.js';

/**
 * Triggers a complete backfill of all tables.
 * This is idempotent and can be safely re-run.
 */
export async function runFullBackfill() {
  console.log('[Warehouse Backfill] Starting full backfill...');

  // 1. Reset dimensions cache and sync locations
  clearDimensionCaches();
  console.log('[Warehouse Backfill] Syncing locations/hierarchy nodes...');
  const hierarchyStats = await syncHierarchyDimensions();
  console.log(`[Warehouse Backfill] Hierarchy synced: ${hierarchyStats.districtsSynced} districts, ${hierarchyStats.psSynced} stations.`);

  // 2. Perform full sync (forceFullSync = true)
  console.log('[Warehouse Backfill] Loading all records into fact tables (this may take a few moments)...');
  const syncStats = await runWarehouseSync('ALL', true);

  console.log('[Warehouse Backfill] Backfill completed successfully!');
  console.log(`- Scanned: ${syncStats.scanned} records`);
  console.log(`- Upserted: ${syncStats.upserted} records`);
  console.log(`- Failed: ${syncStats.failed} records`);
  console.log(`- Bridges created: ${syncStats.bridges} links`);

  invalidateWarehouseCache();

  return syncStats;
}
