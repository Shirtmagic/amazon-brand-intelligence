import { NextResponse } from 'next/server';
import { queryBigQuery } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to discover Brand Analytics tables and their columns.
 * Hit: /api/debug-ba-tables
 */
export async function GET() {
  const results: Record<string, any> = {};

  // 1. List ALL tables in the ops_amazon schema that contain "ba" or "search"
  try {
    const tablesSql = `
      SELECT table_name, table_type
      FROM \`renuv-amazon-data-warehouse.ops_amazon.INFORMATION_SCHEMA.TABLES\`
      WHERE LOWER(table_name) LIKE '%ba%'
         OR LOWER(table_name) LIKE '%search%'
         OR LOWER(table_name) LIKE '%top%'
         OR LOWER(table_name) LIKE '%brand_analytics%'
      ORDER BY table_name
    `;
    results.baRelatedTables = await queryBigQuery<any>(tablesSql);
  } catch (e) {
    results.baRelatedTables = { error: String(e) };
  }

  // 2. List ALL tables (full list) to find anything we might have missed
  try {
    const allTablesSql = `
      SELECT table_name
      FROM \`renuv-amazon-data-warehouse.ops_amazon.INFORMATION_SCHEMA.TABLES\`
      ORDER BY table_name
    `;
    results.allTables = await queryBigQuery<any>(allTablesSql);
  } catch (e) {
    results.allTables = { error: String(e) };
  }

  // 3. Check the search_query view columns — maybe it HAS the top 3 fields
  try {
    const colsSql = `
      SELECT column_name, data_type
      FROM \`renuv-amazon-data-warehouse.ops_amazon.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'sp_ba_search_query_by_week_v1_view'
      ORDER BY ordinal_position
    `;
    results.searchQueryViewColumns = await queryBigQuery<any>(colsSql);
  } catch (e) {
    results.searchQueryViewColumns = { error: String(e) };
  }

  // 4. Check if there's a top search terms table
  try {
    const topTermsColsSql = `
      SELECT table_name, column_name, data_type
      FROM \`renuv-amazon-data-warehouse.ops_amazon.INFORMATION_SCHEMA.COLUMNS\`
      WHERE LOWER(table_name) LIKE '%top%search%'
         OR LOWER(table_name) LIKE '%ba_search_term%'
         OR LOWER(table_name) LIKE '%brand_analytics%'
         OR (LOWER(column_name) LIKE '%clicked_asin%' OR LOWER(column_name) LIKE '%top_clicked%')
      ORDER BY table_name, ordinal_position
    `;
    results.topSearchTermsColumns = await queryBigQuery<any>(topTermsColsSql);
  } catch (e) {
    results.topSearchTermsColumns = { error: String(e) };
  }

  // 5. Also check core_amazon schema
  try {
    const coreTablesSql = `
      SELECT table_name
      FROM \`renuv-amazon-data-warehouse.core_amazon.INFORMATION_SCHEMA.TABLES\`
      WHERE LOWER(table_name) LIKE '%ba%'
         OR LOWER(table_name) LIKE '%search%'
         OR LOWER(table_name) LIKE '%brand%'
      ORDER BY table_name
    `;
    results.coreBaTables = await queryBigQuery<any>(coreTablesSql);
  } catch (e) {
    results.coreBaTables = { error: String(e) };
  }

  // 6. Check reporting_amazon schema
  try {
    const reportingTablesSql = `
      SELECT table_name
      FROM \`renuv-amazon-data-warehouse.reporting_amazon.INFORMATION_SCHEMA.TABLES\`
      WHERE LOWER(table_name) LIKE '%search%'
         OR LOWER(table_name) LIKE '%competitor%'
         OR LOWER(table_name) LIKE '%brand%'
         OR LOWER(table_name) LIKE '%ba%'
      ORDER BY table_name
    `;
    results.reportingSearchTables = await queryBigQuery<any>(reportingTablesSql);
  } catch (e) {
    results.reportingSearchTables = { error: String(e) };
  }

  // 7. Sample a row from the search_query view to see actual data shape
  try {
    const sampleSql = `
      SELECT *
      FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
      WHERE ob_seller_id = 'A2CWSK2O443P17'
      ORDER BY end_date DESC
      LIMIT 1
    `;
    results.sampleRow = await queryBigQuery<any>(sampleSql);
  } catch (e) {
    results.sampleRow = { error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
