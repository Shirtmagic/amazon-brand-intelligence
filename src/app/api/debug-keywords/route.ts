import { NextResponse } from 'next/server';
import { queryBigQuery } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check what search queries exist in the BA table.
 * Hit: /api/debug-keywords?q=washing+machine
 * Or: /api/debug-keywords (shows top 20 queries by volume)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    let sql: string;
    if (q) {
      // Search for keywords matching the pattern
      sql = `
        SELECT DISTINCT
          LOWER(search_query_data_search_query) AS search_query,
          MAX(search_query_data_search_query_volume) AS query_volume,
          MAX(end_date) AS latest_week,
          COUNT(DISTINCT end_date) AS week_count,
          SUM(click_data_asin_click_count) AS total_clicks,
          SUM(purchase_data_asin_purchase_count) AS total_purchases
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
        WHERE ob_seller_id = 'A2CWSK2O443P17'
          AND LOWER(search_query_data_search_query) LIKE '%${q.toLowerCase().replace(/'/g, "''")}%'
        GROUP BY LOWER(search_query_data_search_query)
        ORDER BY total_purchases DESC, total_clicks DESC
        LIMIT 30
      `;
    } else {
      // Show top queries by volume
      sql = `
        WITH latest_week AS (
          SELECT MAX(end_date) AS max_week
          FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
          WHERE ob_seller_id = 'A2CWSK2O443P17'
        )
        SELECT DISTINCT
          LOWER(search_query_data_search_query) AS search_query,
          MAX(search_query_data_search_query_volume) AS query_volume,
          SUM(click_data_asin_click_count) AS total_clicks,
          SUM(purchase_data_asin_purchase_count) AS total_purchases
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
        CROSS JOIN latest_week
        WHERE ob_seller_id = 'A2CWSK2O443P17'
          AND end_date = latest_week.max_week
        GROUP BY LOWER(search_query_data_search_query)
        ORDER BY total_purchases DESC, total_clicks DESC
        LIMIT 30
      `;
    }

    const rows = await queryBigQuery<any>(sql);

    // Also check column names
    const schemaSql = `
      SELECT column_name, data_type
      FROM \`renuv-amazon-data-warehouse.ops_amazon.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'sp_ba_search_query_by_week_v1_view'
        AND (column_name LIKE '%cart%' OR column_name LIKE '%add%' OR column_name LIKE '%search_query%' OR column_name LIKE '%impression%' OR column_name LIKE '%click%' OR column_name LIKE '%purchase%')
      ORDER BY column_name
    `;

    let schema: any[] = [];
    try {
      schema = await queryBigQuery<any>(schemaSql);
    } catch (schemaErr) {
      // INFORMATION_SCHEMA might not be accessible
      schema = [{ error: String(schemaErr) }];
    }

    return NextResponse.json({
      query: q || '(top queries)',
      resultCount: rows.length,
      results: rows.map((r: any) => ({
        searchQuery: r.search_query,
        queryVolume: Number(r.query_volume || 0),
        totalClicks: Number(r.total_clicks || 0),
        totalPurchases: Number(r.total_purchases || 0),
        latestWeek: r.latest_week?.value || r.latest_week || undefined,
        weekCount: r.week_count ? Number(r.week_count) : undefined,
      })),
      schema,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
