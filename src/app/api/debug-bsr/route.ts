import { queryBigQuery } from '@/lib/bigquery';
import { NextResponse } from 'next/server';

export async function GET() {
  const datesSql = `
    SELECT DISTINCT ob_date, COUNT(*) as asin_count
    FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`
    WHERE sales_rank > 0
    GROUP BY ob_date
    ORDER BY ob_date DESC
    LIMIT 15
  `;

  const sampleSql = `
    SELECT asin, product_name, sales_rank, ob_date
    FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`
    WHERE ob_date = (SELECT MAX(ob_date) FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`)
      AND sales_rank > 0
    ORDER BY sales_rank ASC
    LIMIT 5
  `;

  const [dates, sample] = await Promise.all([
    queryBigQuery<any>(datesSql),
    queryBigQuery<any>(sampleSql),
  ]);

  return NextResponse.json({
    availableDates: dates.map((r: any) => ({
      date: r.ob_date?.value || r.ob_date,
      asinCount: Number(r.asin_count),
    })),
    latestSample: sample.map((r: any) => ({
      asin: r.asin,
      product: r.product_name,
      bsr: Number(r.sales_rank),
      date: r.ob_date?.value || r.ob_date,
    })),
  });
}
