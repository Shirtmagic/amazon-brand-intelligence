/**
 * BigQuery client singleton and query helper
 */
import { BigQuery } from '@google-cloud/bigquery';

// Singleton client instance
let bigQueryClient: BigQuery | null = null;

function parseCredentialsJson(raw: string) {
  const candidates = [raw.trim()];

  try {
    const decoded = Buffer.from(raw.trim(), 'base64').toString('utf8');
    if (decoded && decoded !== raw) {
      candidates.push(decoded.trim());
    }
  } catch {
    // ignore base64 decode failure
  }

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const credentials = JSON.parse(candidate);
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
      return credentials;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Unable to parse BIGQUERY_CREDENTIALS_JSON: ${String(lastError)}`);
}

function getBigQueryConfig(): ConstructorParameters<typeof BigQuery>[0] {
  const projectId = process.env.BIGQUERY_PROJECT_ID || 'renuv-amazon-data-warehouse';
  const credentialsJson = process.env.BIGQUERY_CREDENTIALS_JSON;
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsJson) {
    const credentials = parseCredentialsJson(credentialsJson);
    return {
      projectId,
      credentials,
    };
  }

  if (keyFilePath) {
    return {
      projectId,
      keyFilename: keyFilePath,
    };
  }

  return {
    projectId,
  };
}

/**
 * Get or create the BigQuery client
 */
export function getBigQueryClient(): BigQuery {
  if (!bigQueryClient) {
    bigQueryClient = new BigQuery(getBigQueryConfig());
  }
  return bigQueryClient;
}

/**
 * Generic BigQuery query helper with error handling
 */
export async function queryBigQuery<T>(sql: string): Promise<T[]> {
  try {
    const client = getBigQueryClient();
    const [rows] = await client.query({ query: sql });
    return rows as T[];
  } catch (error) {
    console.error('[BigQuery Error]', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasCredentialsJson: Boolean(process.env.BIGQUERY_CREDENTIALS_JSON),
      hasGoogleApplicationCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      projectId: process.env.BIGQUERY_PROJECT_ID || 'renuv-amazon-data-warehouse',
    });
    return [];
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Calculate trend direction
 */
export function getTrend(current: number, previous: number): 'up' | 'down' | 'flat' {
  const delta = current - previous;
  if (Math.abs(delta) < 0.001) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

/**
 * Calculate percentage change
 */
export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
