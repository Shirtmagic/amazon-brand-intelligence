import { NextResponse } from 'next/server';
import { queryBigQuery } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

/**
 * AWD (Amazon Warehousing & Distribution) inventory discovery endpoint.
 * Probes every dataset in the warehouse for tables/columns that look like
 * they carry AWD stock so we can wire them into the Inventory tab.
 *
 * Hit: /api/debug-awd
 */
export async function GET() {
  const results: Record<string, unknown> = {};
  const project = 'renuv-amazon-data-warehouse';

  // --- 1. List every dataset (schema) in the project ----------------------
  try {
    const datasetsSql = `
      SELECT schema_name
      FROM \`${project}.INFORMATION_SCHEMA.SCHEMATA\`
      ORDER BY schema_name
    `;
    results.datasets = await queryBigQuery<{ schema_name: string }>(datasetsSql);
  } catch (e) {
    results.datasets = { error: String(e) };
  }

  const datasets: string[] = Array.isArray(results.datasets)
    ? (results.datasets as { schema_name: string }[]).map(d => d.schema_name)
    : ['ops_amazon', 'core_amazon', 'reporting_amazon'];

  // --- 2. In every dataset, find any table/view whose NAME mentions AWD ---
  const tableHits: Array<{ dataset: string; table_name: string; table_type: string }> = [];
  for (const ds of datasets) {
    try {
      const sql = `
        SELECT '${ds}' AS dataset, table_name, table_type
        FROM \`${project}.${ds}.INFORMATION_SCHEMA.TABLES\`
        WHERE LOWER(table_name) LIKE '%awd%'
           OR LOWER(table_name) LIKE '%warehousing%'
           OR LOWER(table_name) LIKE '%warehouse_distribution%'
           OR LOWER(table_name) LIKE '%upstream%'
           OR LOWER(table_name) LIKE '%bulk_storage%'
        ORDER BY table_name
      `;
      const hits = await queryBigQuery<{ dataset: string; table_name: string; table_type: string }>(sql);
      tableHits.push(...hits);
    } catch (e) {
      // swallow per-dataset errors; we still want the others
      tableHits.push({ dataset: ds, table_name: `__error__: ${String(e)}`, table_type: '' });
    }
  }
  results.awdTableNameMatches = tableHits;

  // --- 3. In every dataset, find any COLUMN whose name mentions AWD -------
  // This catches cases where AWD stock lives inside an otherwise FBA-scoped
  // table (e.g., a unified inventory view with an `awd_quantity` column).
  const columnHits: Array<{
    dataset: string;
    table_name: string;
    column_name: string;
    data_type: string;
  }> = [];
  for (const ds of datasets) {
    try {
      const sql = `
        SELECT '${ds}' AS dataset, table_name, column_name, data_type
        FROM \`${project}.${ds}.INFORMATION_SCHEMA.COLUMNS\`
        WHERE LOWER(column_name) LIKE '%awd%'
           OR LOWER(column_name) LIKE '%warehousing%'
           OR LOWER(column_name) LIKE '%warehouse_distribution%'
           OR LOWER(column_name) LIKE '%upstream%'
           OR LOWER(column_name) LIKE '%bulk_storage%'
           OR LOWER(column_name) LIKE '%in_transit_from_awd%'
        ORDER BY table_name, column_name
      `;
      const hits = await queryBigQuery<{
        dataset: string;
        table_name: string;
        column_name: string;
        data_type: string;
      }>(sql);
      columnHits.push(...hits);
    } catch (e) {
      columnHits.push({
        dataset: ds,
        table_name: `__error__: ${String(e)}`,
        column_name: '',
        data_type: '',
      });
    }
  }
  results.awdColumnNameMatches = columnHits;

  // --- 4. Also check if any SP-API AWD report has landed under its
  //        canonical name (Amazon's SP-API uses `awd_inventory_report`) ----
  const reportNameHits: Array<{ dataset: string; table_name: string }> = [];
  for (const ds of datasets) {
    try {
      const sql = `
        SELECT '${ds}' AS dataset, table_name
        FROM \`${project}.${ds}.INFORMATION_SCHEMA.TABLES\`
        WHERE LOWER(table_name) LIKE '%inventory%'
        ORDER BY table_name
      `;
      const hits = await queryBigQuery<{ dataset: string; table_name: string }>(sql);
      reportNameHits.push(...hits);
    } catch (e) {
      reportNameHits.push({ dataset: ds, table_name: `__error__: ${String(e)}` });
    }
  }
  results.allInventoryTables = reportNameHits;

  // --- 5. Inventory Ledger often carries AWD location movements even
  //        when there's no explicitly-named AWD table. Pull the schema
  //        of both ledger tables and sample distinct location/disposition
  //        values to see whether AWD shows up as a fulfillment center. ---
  try {
    const sql = `
      SELECT column_name, data_type
      FROM \`${project}.ops_amazon.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name IN ('sp_inventory_ledger_detailed_v5', 'sp_inventory_ledger_summary_v4', 'sp_inventory_v8')
      ORDER BY table_name, ordinal_position
    `;
    results.ledgerColumns = await queryBigQuery<{ column_name: string; data_type: string }>(sql);
  } catch (e) {
    results.ledgerColumns = { error: String(e) };
  }

  // Probe distinct location values from the detailed ledger — AWD locations
  // typically include codes like "AWD1", "UWD*", or names containing "AWD".
  try {
    const sql = `
      SELECT DISTINCT location
      FROM \`${project}.ops_amazon.sp_inventory_ledger_detailed_v5\`
      WHERE location IS NOT NULL
      LIMIT 100
    `;
    results.ledgerDistinctLocations = await queryBigQuery<{ location: string }>(sql);
  } catch (e) {
    results.ledgerDistinctLocations = { error: String(e) };
  }

  // Same probe for fulfillment_center / fc_id / fc_name if those columns exist.
  try {
    const sql = `
      SELECT DISTINCT disposition
      FROM \`${project}.ops_amazon.sp_inventory_ledger_detailed_v5\`
      WHERE disposition IS NOT NULL
      LIMIT 50
    `;
    results.ledgerDistinctDispositions = await queryBigQuery<{ disposition: string }>(sql);
  } catch (e) {
    results.ledgerDistinctDispositions = { error: String(e) };
  }

  // --- 6. sp_inventory_v8 may be the unified "summary" inventory that
  //        combines AWD + FBA. Check its columns for anything AWD-shaped ---
  try {
    const sql = `
      SELECT column_name, data_type
      FROM \`${project}.ops_amazon.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'sp_inventory_v8'
      ORDER BY ordinal_position
    `;
    results.spInventoryV8Columns = await queryBigQuery<{ column_name: string; data_type: string }>(sql);
  } catch (e) {
    results.spInventoryV8Columns = { error: String(e) };
  }

  // Sample a single row of sp_inventory_v8 for a Renuv SKU so we can
  // see what fields it actually populates.
  try {
    const sql = `
      SELECT *
      FROM \`${project}.ops_amazon.sp_inventory_v8\`
      WHERE ob_seller_id = 'A2CWSK2O443P17'
      ORDER BY ob_processed_at DESC
      LIMIT 1
    `;
    results.spInventoryV8Sample = await queryBigQuery<Record<string, unknown>>(sql);
  } catch (e) {
    results.spInventoryV8Sample = { error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
