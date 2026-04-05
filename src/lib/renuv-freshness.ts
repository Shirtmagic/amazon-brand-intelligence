export type Tone = 'positive' | 'warning' | 'critical' | 'neutral';
export type FreshnessStatus = 'live-ready' | 'usable-stale' | 'stale-review' | 'missing';

export type RenuvDataSource = {
  source: string;
  category: 'advertising' | 'retail' | 'traffic' | 'search' | 'inventory' | 'financial';
  lastUpdatedAt: string;
  lastUpdatedUtc: string;
  lagHours: string;
  lagMinutes: string;
  status: FreshnessStatus;
  tone: Tone;
  expectedFrequency: string;
  coverage: string;
  recordCount: string;
  notes: string;
  sourceView: 'reporting_amazon.data_freshness_status';
};

export type RenuvIngestionHealth = {
  pipeline: string;
  category: 'advertising' | 'retail' | 'traffic' | 'search' | 'inventory' | 'financial';
  lastRunAt: string;
  status: 'success' | 'partial' | 'failed';
  tone: Tone;
  recordsIngested: string;
  errorCount: string;
  errorDetail?: string;
  nextScheduled: string;
  sourceView: 'reporting_amazon.ingestion_pipeline_status';
};

export type RenuvDataQuality = {
  check: string;
  description: string;
  status: 'pass' | 'warn' | 'fail';
  tone: Tone;
  detail: string;
  lastCheckedAt: string;
  sourceView: 'reporting_amazon.data_quality_checks';
};

export type RenuvFreshnessPageSnapshot = {
  brand: string;
  periodLabel: string;
  environment: 'internal';
  dataSources: RenuvDataSource[];
  ingestionHealth: RenuvIngestionHealth[];
  qualityChecks: RenuvDataQuality[];
};

export const renuvFreshnessContracts = {
  sources: `CREATE VIEW reporting_amazon.data_freshness_status AS
SELECT
  data_source_name,
  source_category,
  MAX(last_updated_at) AS last_updated_at,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(last_updated_at), HOUR) AS lag_hours,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(last_updated_at), MINUTE) AS lag_minutes,
  CASE
    WHEN TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(last_updated_at), HOUR) < 12 THEN 'live-ready'
    WHEN TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(last_updated_at), HOUR) < 48 THEN 'usable-stale'
    WHEN TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(last_updated_at), HOUR) >= 48 THEN 'stale-review'
    ELSE 'missing'
  END AS freshness_status,
  expected_frequency_hours,
  coverage_pct,
  record_count,
  notes
FROM reporting_amazon.ingestion_metadata
WHERE brand_id = ?
GROUP BY data_source_name, source_category, expected_frequency_hours, coverage_pct, record_count, notes
ORDER BY source_category, data_source_name;`,

  pipelines: `CREATE VIEW reporting_amazon.ingestion_pipeline_status AS
SELECT
  pipeline_name,
  pipeline_category,
  last_run_at,
  run_status,
  records_ingested,
  error_count,
  error_detail,
  next_scheduled_run
FROM data_ingestion.pipeline_runs
WHERE brand_id = ?
  AND last_run_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
ORDER BY last_run_at DESC;`,

  quality: `CREATE VIEW reporting_amazon.data_quality_checks AS
SELECT
  check_name,
  check_description,
  check_status,
  check_detail,
  last_checked_at
FROM data_quality.check_results
WHERE brand_id = ?
  AND last_checked_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
ORDER BY
  CASE check_status
    WHEN 'fail' THEN 1
    WHEN 'warn' THEN 2
    WHEN 'pass' THEN 3
  END,
  last_checked_at DESC;`
};

export const renuvFreshnessMock: RenuvFreshnessPageSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Live status',
  environment: 'internal',
  dataSources: [
    {
      source: 'amazon_api.sponsored_products_report',
      category: 'advertising',
      lastUpdatedAt: '2026-04-01 16:42 EDT',
      lastUpdatedUtc: '2026-04-01 20:42 UTC',
      lagHours: '2h',
      lagMinutes: '116 min',
      status: 'live-ready',
      tone: 'positive',
      expectedFrequency: 'Every 3 hours',
      coverage: '100%',
      recordCount: '1,847',
      notes: 'Production ingestion running normally.',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'amazon_api.sponsored_brands_report',
      category: 'advertising',
      lastUpdatedAt: '2026-04-01 16:38 EDT',
      lastUpdatedUtc: '2026-04-01 20:38 UTC',
      lagHours: '2h',
      lagMinutes: '120 min',
      status: 'live-ready',
      tone: 'positive',
      expectedFrequency: 'Every 3 hours',
      coverage: '100%',
      recordCount: '412',
      notes: 'Production ingestion running normally.',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'amazon_api.search_term_impressions',
      category: 'search',
      lastUpdatedAt: '2026-04-01 14:08 UTC',
      lastUpdatedUtc: '2026-04-01 14:08 UTC',
      lagHours: '5h',
      lagMinutes: '330 min',
      status: 'live-ready',
      tone: 'positive',
      expectedFrequency: 'Daily',
      coverage: '98%',
      recordCount: '3,241',
      notes: 'Minor gap in early morning data; backfill scheduled.',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'amazon_api.sales_traffic_report',
      category: 'traffic',
      lastUpdatedAt: '2026-04-01 06:12 UTC',
      lastUpdatedUtc: '2026-04-01 06:12 UTC',
      lagHours: '13h',
      lagMinutes: '786 min',
      status: 'usable-stale',
      tone: 'warning',
      expectedFrequency: 'Daily',
      coverage: '100%',
      recordCount: '1,129',
      notes: 'Ingestion delayed due to Amazon API rate limiting; retry in progress.',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'amazon_api.business_reports',
      category: 'retail',
      lastUpdatedAt: '2026-04-01 08:34 UTC',
      lastUpdatedUtc: '2026-04-01 08:34 UTC',
      lagHours: '10h',
      lagMinutes: '604 min',
      status: 'live-ready',
      tone: 'positive',
      expectedFrequency: 'Daily',
      coverage: '100%',
      recordCount: '842',
      notes: 'Production ingestion running normally.',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'amazon_api.fba_inventory_report',
      category: 'inventory',
      lastUpdatedAt: '2026-04-01 03:22 UTC',
      lastUpdatedUtc: '2026-04-01 03:22 UTC',
      lagHours: '16h',
      lagMinutes: '956 min',
      status: 'usable-stale',
      tone: 'warning',
      expectedFrequency: 'Every 12 hours',
      coverage: '100%',
      recordCount: '284',
      notes: 'Expected update missed; investigating Amazon Seller Central connectivity.',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'amazon_api.settlement_reports',
      category: 'financial',
      lastUpdatedAt: '2026-03-30 10:14 UTC',
      lastUpdatedUtc: '2026-03-30 10:14 UTC',
      lagHours: '58h',
      lagMinutes: '3464 min',
      status: 'stale-review',
      tone: 'critical',
      expectedFrequency: 'Every 14 days',
      coverage: '92%',
      recordCount: '18',
      notes: 'Settlement report ingestion appears to be failing. Requires manual investigation.',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'amazon_api.category_rank_daily',
      category: 'search',
      lastUpdatedAt: '2026-04-01 06:08 UTC',
      lastUpdatedUtc: '2026-04-01 06:08 UTC',
      lagHours: '13h',
      lagMinutes: '790 min',
      status: 'usable-stale',
      tone: 'warning',
      expectedFrequency: 'Daily',
      coverage: '100%',
      recordCount: '67',
      notes: 'Data delayed but usable for current analysis.',
      sourceView: 'reporting_amazon.data_freshness_status'
    }
  ],
  ingestionHealth: [
    {
      pipeline: 'amazon-advertising-hourly',
      category: 'advertising',
      lastRunAt: '2026-04-01 16:42 EDT',
      status: 'success',
      tone: 'positive',
      recordsIngested: '2,259',
      errorCount: '0',
      nextScheduled: '2026-04-01 19:45 EDT',
      sourceView: 'reporting_amazon.ingestion_pipeline_status'
    },
    {
      pipeline: 'amazon-traffic-daily',
      category: 'traffic',
      lastRunAt: '2026-04-01 06:12 UTC',
      status: 'partial',
      tone: 'warning',
      recordsIngested: '1,129',
      errorCount: '3',
      errorDetail: 'Rate limit exceeded on 3 API calls; will retry on next scheduled run.',
      nextScheduled: '2026-04-02 06:00 UTC',
      sourceView: 'reporting_amazon.ingestion_pipeline_status'
    },
    {
      pipeline: 'amazon-search-daily',
      category: 'search',
      lastRunAt: '2026-04-01 14:08 UTC',
      status: 'success',
      tone: 'positive',
      recordsIngested: '3,308',
      errorCount: '0',
      nextScheduled: '2026-04-02 14:00 UTC',
      sourceView: 'reporting_amazon.ingestion_pipeline_status'
    },
    {
      pipeline: 'amazon-retail-daily',
      category: 'retail',
      lastRunAt: '2026-04-01 08:34 UTC',
      status: 'success',
      tone: 'positive',
      recordsIngested: '842',
      errorCount: '0',
      nextScheduled: '2026-04-02 08:00 UTC',
      sourceView: 'reporting_amazon.ingestion_pipeline_status'
    },
    {
      pipeline: 'amazon-inventory-12h',
      category: 'inventory',
      lastRunAt: '2026-04-01 03:22 UTC',
      status: 'failed',
      tone: 'critical',
      recordsIngested: '0',
      errorCount: '1',
      errorDetail: 'Authentication error: Seller Central API credentials expired or invalid.',
      nextScheduled: '2026-04-01 15:00 UTC',
      sourceView: 'reporting_amazon.ingestion_pipeline_status'
    },
    {
      pipeline: 'amazon-financial-biweekly',
      category: 'financial',
      lastRunAt: '2026-03-30 10:14 UTC',
      status: 'failed',
      tone: 'critical',
      recordsIngested: '0',
      errorCount: '5',
      errorDetail: 'Report generation timeout. Amazon settlement report not available within expected window.',
      nextScheduled: '2026-04-13 10:00 UTC',
      sourceView: 'reporting_amazon.ingestion_pipeline_status'
    }
  ],
  qualityChecks: [
    {
      check: 'Revenue reconciliation',
      description: 'Verify advertising spend + sales revenue sums match expected totals',
      status: 'pass',
      tone: 'positive',
      detail: 'All revenue and spend totals reconcile within 0.3% tolerance.',
      lastCheckedAt: '2026-04-01 17:12 EDT',
      sourceView: 'reporting_amazon.data_quality_checks'
    },
    {
      check: 'ASIN coverage completeness',
      description: 'Ensure all active ASINs appear in traffic and sales reports',
      status: 'pass',
      tone: 'positive',
      detail: 'All 14 active ASINs present in latest daily reports.',
      lastCheckedAt: '2026-04-01 16:58 EDT',
      sourceView: 'reporting_amazon.data_quality_checks'
    },
    {
      check: 'Advertising spend continuity',
      description: 'Detect gaps or anomalies in daily advertising spend data',
      status: 'pass',
      tone: 'positive',
      detail: 'No gaps detected in daily spend data for L30D.',
      lastCheckedAt: '2026-04-01 16:42 EDT',
      sourceView: 'reporting_amazon.data_quality_checks'
    },
    {
      check: 'Search term volume anomaly detection',
      description: 'Flag unusual spikes or drops in search term volume',
      status: 'warn',
      tone: 'warning',
      detail: 'Search volume for "wrinkle reducer serum" dropped 42% vs prior week; may indicate seasonal shift or competitive impact.',
      lastCheckedAt: '2026-04-01 14:18 UTC',
      sourceView: 'reporting_amazon.data_quality_checks'
    },
    {
      check: 'Inventory count validation',
      description: 'Cross-check inventory counts against FBA reports',
      status: 'fail',
      tone: 'critical',
      detail: 'Inventory ingestion failed; unable to validate. See ingestion pipeline status for details.',
      lastCheckedAt: '2026-04-01 03:30 UTC',
      sourceView: 'reporting_amazon.data_quality_checks'
    }
  ]
};

/**
 * Fetch freshness snapshot from BigQuery
 */

