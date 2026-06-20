/**
 * Warehouse API Controller
 * ========================
 * Exposes system status and synchronisation details for the reporting warehouse.
 */

import { getWarehouseStats, isWarehouseReady } from './warehouse.db.js';

/**
 * GET /warehouse/status
 * Returns warehouse health stats, table counts, readiness status, and last sync info.
 */
export async function getStatus(req, res, next) {
  try {
    const ready = await isWarehouseReady();
    const queryMode = process.env.WAREHOUSE_QUERY_MODE || 'AUTO';
    const stats = await getWarehouseStats();

    return res.status(200).json({
      success: true,
      ready,
      queryMode,
      counts: stats.counts,
      lastSync: stats.lastSync
    });
  } catch (err) {
    next(err);
  }
}
