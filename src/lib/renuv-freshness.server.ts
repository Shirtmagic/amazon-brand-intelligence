/**
 * Server-only fetch functions for freshness data
 */
import { queryBigQuery } from './bigquery';
import {
  RenuvFreshnessPageSnapshot,
  RenuvDataSource,
} from './renuv-freshness';

export async function fetchFreshnessSnapshot(): Promise<RenuvFreshnessPageSnapshot> {
  try {
    const sql = `
      SELECT
        source_table,
        last_seen_record_date,
        days_stale,
        freshness_status,
        warning_level
      FROM \`renuv-amazon-data-warehouse.reporting_amazon.data_freshness_status\`
      ORDER BY source_table
    `;

    const rows = await queryBigQuery<any>(sql);

    if (rows.length === 0) {
      console.log('[fetchFreshnessSnapshot] No freshness data available');
      return {
        brand: 'Renuv',
        periodLabel: 'No data available',
        environment: 'internal' as const,
        dataSources: [],
        ingestionHealth: [],
        qualityChecks: []
      };
    }

    const categoryMap: Record<string, 'advertising' | 'retail' | 'traffic' | 'search' | 'inventory' | 'financial'> = {
      'ads': 'advertising',
      'retail': 'retail',
      'orders': 'traffic',
      'search': 'search',
      'fees': 'financial',
    };

    const dataSources: RenuvDataSource[] = rows.map((r: any) => {
      const tableName = (r.source_table || '').toLowerCase();
      const category = tableName.includes('ads') ? 'advertising' :
                       tableName.includes('retail') ? 'retail' :
                       tableName.includes('order') ? 'traffic' :
                       tableName.includes('search') || tableName.includes('ba_') ? 'search' :
                       tableName.includes('fee') || tableName.includes('storage') ? 'financial' : 'retail';
      const daysStale = r.days_stale || 0;
      const status = daysStale < 1 ? 'live-ready' as const :
                     daysStale < 3 ? 'usable-stale' as const :
                     daysStale < 7 ? 'stale-review' as const : 'missing' as const;
      const tone = status === 'live-ready' ? 'positive' as const :
                   status === 'usable-stale' ? 'neutral' as const :
                   status === 'stale-review' ? 'warning' as const : 'critical' as const;

      return {
        source: r.source_table || 'Unknown',
        category,
        lastUpdatedAt: r.last_seen_record_date ? new Date(r.last_seen_record_date.value || r.last_seen_record_date).toLocaleDateString() : 'Unknown',
        lastUpdatedUtc: r.last_seen_record_date ? String(r.last_seen_record_date.value || r.last_seen_record_date) : '',
        lagHours: `${(daysStale * 24).toFixed(0)}h`,
        lagMinutes: `${(daysStale * 24 * 60).toFixed(0)}m`,
        status,
        tone,
        expectedFrequency: 'Daily',
        coverage: 'Current',
        recordCount: '-',
        notes: r.freshness_status || '',
        sourceView: 'reporting_amazon.data_freshness_status' as const,
      };
    });

    return {
      brand: 'Renuv',
      periodLabel: 'Live data freshness',
      environment: 'internal',
      dataSources,
      ingestionHealth: [],
      qualityChecks: [],
    };
  } catch (error) {
    console.error('[fetchFreshnessSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      environment: 'internal' as const,
      dataSources: [],
      ingestionHealth: [],
      qualityChecks: []
    };
  }
}
