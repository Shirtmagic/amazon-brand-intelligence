import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export type MetaIngestionSourceKind = 'graph-live' | 'report-snapshot' | 'mock';
export type MetaCapabilityStatus = 'ready' | 'blocked';

export type MetaCapability = {
  status: MetaCapabilityStatus;
  detail: string;
};

export type MetaConnectionStatus = {
  source: MetaIngestionSourceKind;
  data: MetaCapability;
  posting: MetaCapability;
  tokenPath: string;
  pageId: string;
  checkedAt: string;
  knownCommentCount?: number;
  knownStoryCount?: number;
  newestKnownCommentAt?: string;
  snapshotFetchedAt?: string;
};

export type RealFacebookThreadEntry = {
  id: string;
  parentId?: string;
  message: string;
  createdTime?: string;
  authorName?: string;
  authorId?: string;
  authorRole: 'customer' | 'page' | 'other';
  isReply?: boolean;
};

export type RealFacebookComment = {
  id: string;
  storyId: string;
  pageId: string;
  adId?: string;
  adName?: string;
  authorName?: string;
  authorId?: string;
  message: string;
  createdTime?: string;
  likeCount?: number;
  commentCount?: number;
  isHidden?: boolean;
  permalinkUrl?: string;
  priorThreadEntries?: RealFacebookThreadEntry[];
  existingReplies?: RealFacebookThreadEntry[];
};

type TokenKind = 'user' | 'page';

type GraphRequestMethod = 'GET' | 'POST';

type GraphRequestOptions = {
  method?: GraphRequestMethod;
  params?: Record<string, string>;
  token?: string;
};

type MetaGraphErrorPayload = {
  error?: {
    message?: string;
  };
};

type MetaPageAccount = {
  id?: string;
  name?: string;
  access_token?: string;
};

type MetaActor = {
  id?: string;
  name?: string;
};

const workspaceRoot = path.resolve(process.cwd(), '..', '..');
const tokenPath = path.join(workspaceRoot, 'secrets', 'renuv_meta_access_token.txt');
const rawCommentsPath = path.join(workspaceRoot, 'reports', 'renuv_meta_comment_threads_raw.json');
const adsWithStoryIdsPath = path.join(workspaceRoot, 'reports', 'renuv_meta_ads_with_story_ids.json');
const pageId = '122832026259228';
const graphVersion = 'v22.0';

/** Max stories to query per ingestion cycle (limits API calls). */
const AD_STORY_QUERY_LIMIT = 1000;
/** Max concurrent Graph requests when fetching ad/story comments. */
const AD_STORY_CONCURRENCY = 12;
/** Max pages of comments to follow per story (cursor pagination). */
const AD_STORY_COMMENT_PAGES = 10;

let cachedUserToken: string | null = null;
let cachedPageToken: string | null = null;
let cachedPageName: string | null = null;

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

async function readUserToken() {
  if (cachedUserToken) {
    return cachedUserToken;
  }

  cachedUserToken = (await readFile(tokenPath, 'utf8')).trim();
  return cachedUserToken;
}

function graphUrl(objectId: string, searchParams: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${objectId}`);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function graphRequest<T>(objectId: string, options: GraphRequestOptions = {}) {
  const method = options.method ?? 'GET';
  const token = options.token ?? await readUserToken();
  const params = { ...(options.params ?? {}), access_token: token };
  const url = graphUrl(objectId, method === 'GET' ? params : {});

  const response = await fetch(url, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    body: method === 'POST' ? new URLSearchParams(params).toString() : undefined,
    cache: 'no-store'
  });

  const data = (await response.json()) as MetaGraphErrorPayload & T;
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Meta Graph request failed (${response.status}).`);
  }
  return data as T;
}

function isMetaAuthError(error: unknown) {
  const message = formatMetaError(error).toLowerCase();
  return message.includes('access token')
    || message.includes('session has expired')
    || message.includes('oauth')
    || message.includes('invalid token')
    || message.includes('expired');
}

async function graphRequestWithFreshPageToken<T>(objectId: string, options: Omit<GraphRequestOptions, 'token'> = {}) {
  try {
    return await graphRequest<T>(objectId, {
      ...options,
      token: await getGraphToken('page')
    });
  } catch (error) {
    if (!isMetaAuthError(error)) {
      throw error;
    }

    cachedPageToken = null;
    return graphRequest<T>(objectId, {
      ...options,
      token: await getGraphToken('page', true)
    });
  }
}

async function getPageAccessToken(forceRefresh = false): Promise<string> {
  if (cachedPageToken && !forceRefresh) {
    return cachedPageToken;
  }

  const userToken = await readUserToken();
  const accounts = await graphRequest<{ data?: MetaPageAccount[] }>('me/accounts', {
    token: userToken,
    params: {
      fields: 'id,name,access_token',
      limit: '100'
    }
  });

  const page = (accounts.data ?? []).find((account) => account.id === pageId);
  if (!page) {
    throw new Error(`Stored Meta user token can call /me/accounts, but page ${pageId} was not returned.`);
  }

  if (!page.access_token) {
    throw new Error(`Meta /me/accounts returned page ${pageId} without an access_token.`);
  }

  cachedPageToken = page.access_token;
  cachedPageName = page.name ?? cachedPageName;
  return cachedPageToken;
}

async function getGraphToken(kind: TokenKind, forceRefresh = false) {
  if (kind === 'page') {
    return getPageAccessToken(forceRefresh);
  }

  return readUserToken();
}

function formatMetaError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown Meta Graph error.';
}

function getAuthorRole(params: { authorId?: string; authorName?: string; pageId: string }) {
  const { authorId, authorName, pageId } = params;
  if (authorId && authorId === pageId) {
    return 'page' as const;
  }

  if (authorName && cachedPageName && authorName.trim().toLowerCase() === cachedPageName.trim().toLowerCase()) {
    return 'page' as const;
  }

  return authorId ? ('customer' as const) : ('other' as const);
}

function normalizeThreadEntry(params: {
  raw: Record<string, unknown>;
  pageId: string;
  isReply?: boolean;
  parentId?: string;
}) {
  const from = (params.raw.from as MetaActor | undefined) ?? undefined;
  const authorId = typeof from?.id === 'string' ? from.id : undefined;
  const authorName = typeof from?.name === 'string' ? from.name : undefined;

  return {
    id: String(params.raw.id ?? ''),
    parentId: params.parentId,
    message: String(params.raw.message ?? ''),
    createdTime: typeof params.raw.created_time === 'string' ? params.raw.created_time : undefined,
    authorId,
    authorName,
    authorRole: getAuthorRole({ authorId, authorName, pageId: params.pageId }),
    isReply: params.isReply ?? false
  } satisfies RealFacebookThreadEntry;
}

function sortByCreatedTime<T extends { createdTime?: string; created_time?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aValue = a.createdTime ?? a.created_time;
    const bValue = b.createdTime ?? b.created_time;
    const aTime = aValue ? new Date(aValue).getTime() : 0;
    const bTime = bValue ? new Date(bValue).getTime() : 0;
    return aTime - bTime;
  });
}

function mergeThreadEntries(existing: RealFacebookThreadEntry[] = [], incoming: RealFacebookThreadEntry[] = []) {
  const byId = new Map<string, RealFacebookThreadEntry>();
  for (const entry of [...existing, ...incoming]) {
    if (entry.id && entry.message) {
      byId.set(entry.id, entry);
    }
  }
  return sortByCreatedTime(Array.from(byId.values()));
}

function mergeComments(primary: RealFacebookComment[], supplemental: RealFacebookComment[]) {
  const byId = new Map<string, RealFacebookComment>();

  for (const comment of supplemental) {
    if (comment.id && comment.message) {
      byId.set(comment.id, comment);
    }
  }

  for (const comment of primary) {
    if (!comment.id || !comment.message) {
      continue;
    }

    const existing = byId.get(comment.id);
    byId.set(comment.id, existing ? {
      ...existing,
      ...comment,
      adId: comment.adId ?? existing.adId,
      adName: comment.adName ?? existing.adName,
      authorId: comment.authorId ?? existing.authorId,
      authorName: comment.authorName ?? existing.authorName,
      createdTime: comment.createdTime ?? existing.createdTime,
      likeCount: comment.likeCount ?? existing.likeCount,
      commentCount: comment.commentCount ?? existing.commentCount,
      isHidden: comment.isHidden ?? existing.isHidden,
      permalinkUrl: comment.permalinkUrl ?? existing.permalinkUrl,
      priorThreadEntries: mergeThreadEntries(existing.priorThreadEntries, comment.priorThreadEntries),
      existingReplies: mergeThreadEntries(existing.existingReplies, comment.existingReplies)
    } : comment);
  }

  return sortByCreatedTime(Array.from(byId.values())).reverse();
}

function formatSnapshotCoverageDetail(params: {
  commentCount: number;
  storyCount: number;
  newestCommentAt?: string;
  snapshotFetchedAt?: string;
}) {
  const parts = [`stored snapshot has ${params.commentCount} known comment${params.commentCount === 1 ? '' : 's'} across ${params.storyCount} stor${params.storyCount === 1 ? 'y' : 'ies'}`];

  if (params.newestCommentAt) {
    parts.push(`newest captured comment: ${params.newestCommentAt}`);
  }

  if (params.snapshotFetchedAt) {
    parts.push(`snapshot file updated: ${params.snapshotFetchedAt}`);
  }

  return parts.join(' · ');
}

async function getSnapshotCoverage() {
  try {
    const [threads, fileStat] = await Promise.all([
      readJsonFile<Array<{ comments?: Array<{ created_time?: string }> }>>(rawCommentsPath),
      stat(rawCommentsPath)
    ]);

    let commentCount = 0;
    let newestCommentAt: string | undefined;
    for (const thread of threads) {
      for (const comment of thread.comments ?? []) {
        commentCount += 1;
        if (comment.created_time && (!newestCommentAt || new Date(comment.created_time).getTime() > new Date(newestCommentAt).getTime())) {
          newestCommentAt = comment.created_time;
        }
      }
    }

    return {
      storyCount: threads.length,
      commentCount,
      newestCommentAt,
      snapshotFetchedAt: fileStat.mtime.toISOString()
    };
  } catch {
    return null;
  }
}

async function loadSnapshotComments(): Promise<RealFacebookComment[]> {
  const [threads, ads] = await Promise.all([
    readJsonFile<Array<{ target_id: string; ad_id?: string; ad_name?: string; comments?: Array<Record<string, unknown>> }>>(rawCommentsPath),
    readJsonFile<Array<{ id: string; name?: string; creative?: { effective_object_story_id?: string; object_story_spec?: { page_id?: string } } }>>(adsWithStoryIdsPath).catch(() => [])
  ]);

  const adByStoryId = new Map<string, { adId: string; adName?: string; pageId?: string }>();
  for (const ad of ads) {
    const storyId = ad.creative?.effective_object_story_id;
    if (!storyId) {
      continue;
    }

    adByStoryId.set(storyId, {
      adId: ad.id,
      adName: ad.name,
      pageId: ad.creative?.object_story_spec?.page_id
    });
  }

  return threads.flatMap((thread) => {
    const storyId = thread.target_id;
    const adInfo = adByStoryId.get(storyId);
    const storyPageId = adInfo?.pageId ?? pageId;
    const storyComments = sortByCreatedTime((thread.comments ?? []) as Array<Record<string, unknown>>);

    return storyComments.map((comment, index) => {
      const replies = sortByCreatedTime(((((comment.comments as { data?: Array<Record<string, unknown>> } | undefined)?.data) ?? [])
        .map((reply) => normalizeThreadEntry({ raw: reply, pageId: storyPageId, isReply: true, parentId: String(comment.id ?? '') }))
        .filter((reply) => reply.id && reply.message)));

      const priorThreadEntries = storyComments
        .slice(0, index)
        .map((entry) => normalizeThreadEntry({ raw: entry, pageId: storyPageId }))
        .filter((entry) => entry.id && entry.message);

      return {
        id: String(comment.id ?? ''),
        storyId,
        pageId: storyPageId,
        adId: thread.ad_id ?? adInfo?.adId,
        adName: thread.ad_name ?? adInfo?.adName,
        authorId: typeof (comment.from as MetaActor | undefined)?.id === 'string' ? (comment.from as MetaActor | undefined)?.id : undefined,
        authorName: typeof (comment.from as MetaActor | undefined)?.name === 'string' ? (comment.from as MetaActor | undefined)?.name : undefined,
        message: String(comment.message ?? ''),
        createdTime: typeof comment.created_time === 'string' ? comment.created_time : undefined,
        likeCount: typeof comment.like_count === 'number' ? comment.like_count : undefined,
        commentCount: typeof comment.comment_count === 'number' ? comment.comment_count : undefined,
        isHidden: typeof comment.is_hidden === 'boolean' ? comment.is_hidden : undefined,
        permalinkUrl: typeof comment.permalink_url === 'string' ? comment.permalink_url : undefined,
        priorThreadEntries,
        existingReplies: replies
      };
    });
  }).filter((comment) => comment.id && comment.message);
}

type AdStoryEntry = {
  storyId: string;
  adId: string;
  adName?: string;
  storyPageId: string;
};

/**
 * Discover the ad account ID from the user token so we can query the
 * Marketing API for currently-active ads.
 */
async function discoverAdAccountId(): Promise<string | null> {
  try {
    const userToken = await readUserToken();
    const result = await graphRequest<{ data?: Array<{ account_id?: string; id?: string }> }>('me/adaccounts', {
      token: userToken,
      params: { fields: 'account_id', limit: '5' }
    });
    const first = (result.data ?? [])[0];
    return first?.id ?? (first?.account_id ? `act_${first.account_id}` : null);
  } catch {
    return null;
  }
}

type LiveAdRecord = {
  id: string;
  name?: string;
  updated_time?: string;
  creative?: {
    effective_object_story_id?: string;
    object_story_spec?: { page_id?: string };
  };
};

/**
 * Fetch currently active (or recently paused) ads from the Marketing API,
 * sorted by updated_time descending so the most-commented-on ads come first.
 */
/** Max pages of ad-list results to follow (each page up to 500 ads). */
const AD_LIST_MAX_PAGES = 10;

async function fetchLiveAdInventory(): Promise<AdStoryEntry[]> {
  const accountId = await discoverAdAccountId();
  if (!accountId) return [];

  const userToken = await readUserToken();

  // Collect ads across cursor pages so accounts with >500 ads are not silently clipped.
  const allAds: LiveAdRecord[] = [];
  let nextUrl: string | undefined;
  let page = 0;

  const firstPage = await graphRequest<{ data?: LiveAdRecord[]; paging?: { next?: string } }>(`${accountId}/ads`, {
    token: userToken,
    params: {
      fields: 'id,name,updated_time,creative{effective_object_story_id,object_story_spec}',
      effective_status: JSON.stringify(['ACTIVE', 'PAUSED']),
      limit: '500'
    }
  });
  allAds.push(...(firstPage.data ?? []));
  nextUrl = firstPage.paging?.next;
  page = 1;

  while (nextUrl && page < AD_LIST_MAX_PAGES) {
    try {
      const response = await fetch(nextUrl, { cache: 'no-store' });
      if (!response.ok) break;
      const result = (await response.json()) as { data?: LiveAdRecord[]; paging?: { next?: string } };
      const pageData = result.data ?? [];
      if (pageData.length === 0) break;
      allAds.push(...pageData);
      nextUrl = result.paging?.next;
      page++;
    } catch {
      break;
    }
  }

  const seen = new Set<string>();
  const entries: AdStoryEntry[] = [];
  // Sort by updated_time descending so most recently active ads come first
  const sorted = [...allAds].sort((a, b) => {
    const aTime = a.updated_time ? new Date(a.updated_time).getTime() : 0;
    const bTime = b.updated_time ? new Date(b.updated_time).getTime() : 0;
    return bTime - aTime;
  });

  for (const ad of sorted) {
    const storyId = ad.creative?.effective_object_story_id;
    if (!storyId || seen.has(storyId)) continue;
    seen.add(storyId);
    entries.push({
      storyId,
      adId: ad.id,
      adName: ad.name,
      storyPageId: ad.creative?.object_story_spec?.page_id ?? pageId
    });
  }
  return entries;
}

function loadStaticAdInventory(ads: Array<{
  id: string;
  name?: string;
  creative?: {
    effective_object_story_id?: string;
    object_story_spec?: { page_id?: string };
  };
}>): AdStoryEntry[] {
  const seen = new Set<string>();
  const entries: AdStoryEntry[] = [];
  for (const ad of ads) {
    const storyId = ad.creative?.effective_object_story_id;
    if (!storyId || seen.has(storyId)) continue;
    seen.add(storyId);
    entries.push({
      storyId,
      adId: ad.id,
      adName: ad.name,
      storyPageId: ad.creative?.object_story_spec?.page_id ?? pageId
    });
  }
  return entries;
}

/**
 * Build the ad/story inventory with live-active ads prioritized first,
 * then backfill from the static report file.
 */
async function loadAdStoryInventory(): Promise<AdStoryEntry[]> {
  const [liveEntries, staticAds] = await Promise.all([
    fetchLiveAdInventory().catch(() => [] as AdStoryEntry[]),
    readJsonFile<Array<{
      id: string;
      name?: string;
      creative?: {
        effective_object_story_id?: string;
        object_story_spec?: { page_id?: string };
      };
    }>>(adsWithStoryIdsPath).catch(() => [])
  ]);

  const staticEntries = loadStaticAdInventory(staticAds);

  // Merge: live-active first (recency-sorted), then static backfill
  const seen = new Set<string>();
  const merged: AdStoryEntry[] = [];

  for (const entry of [...liveEntries, ...staticEntries]) {
    if (seen.has(entry.storyId)) continue;
    seen.add(entry.storyId);
    merged.push(entry);
  }

  return merged;
}

/**
 * Fetch all comments for a single story, following cursor pagination
 * up to AD_STORY_COMMENT_PAGES pages.
 */
async function fetchStoryCommentPages(
  storyId: string,
  pageToken: string,
  commentFields: string
): Promise<Array<Record<string, unknown>>> {
  const allData: Array<Record<string, unknown>> = [];
  let nextUrl: string | undefined;
  let page = 0;

  // First page
  const first = await graphRequest<{
    data?: Array<Record<string, unknown>>;
    paging?: { next?: string };
  }>(`${storyId}/comments`, {
    token: pageToken,
    params: { fields: commentFields, limit: '50' }
  });
  allData.push(...(first.data ?? []));
  nextUrl = first.paging?.next;
  page = 1;

  // Follow cursor for additional pages
  while (nextUrl && page < AD_STORY_COMMENT_PAGES) {
    try {
      const response = await fetch(nextUrl, { cache: 'no-store' });
      if (!response.ok) break;
      const result = (await response.json()) as {
        data?: Array<Record<string, unknown>>;
        paging?: { next?: string };
      };
      const pageData = result.data ?? [];
      if (pageData.length === 0) break;
      allData.push(...pageData);
      nextUrl = result.paging?.next;
      page++;
    } catch {
      break;
    }
  }

  return allData;
}

function normalizeStoryComments(
  sorted: Array<Record<string, unknown>>,
  entry: AdStoryEntry
): RealFacebookComment[] {
  const comments: RealFacebookComment[] = [];

  for (let idx = 0; idx < sorted.length; idx++) {
    const comment = sorted[idx];
    const replies = sortByCreatedTime(
      (((comment.comments as { data?: Array<Record<string, unknown>> } | undefined)?.data) ?? [])
        .map((reply) => normalizeThreadEntry({ raw: reply, pageId: entry.storyPageId, isReply: true, parentId: String(comment.id ?? '') }))
        .filter((reply) => reply.id && reply.message)
    );

    const priorThreadEntries = sorted
      .slice(0, idx)
      .map((e) => normalizeThreadEntry({ raw: e, pageId: entry.storyPageId }))
      .filter((e) => e.id && e.message);

    const from = (comment.from as MetaActor | undefined) ?? undefined;

    const normalized: RealFacebookComment = {
      id: String(comment.id ?? ''),
      storyId: entry.storyId,
      pageId: entry.storyPageId,
      adId: entry.adId,
      adName: entry.adName,
      authorId: typeof from?.id === 'string' ? from.id : undefined,
      authorName: typeof from?.name === 'string' ? from.name : undefined,
      message: String(comment.message ?? ''),
      createdTime: typeof comment.created_time === 'string' ? comment.created_time : undefined,
      likeCount: typeof comment.like_count === 'number' ? comment.like_count : undefined,
      commentCount: typeof comment.comment_count === 'number' ? comment.comment_count : undefined,
      isHidden: typeof comment.is_hidden === 'boolean' ? comment.is_hidden : undefined,
      permalinkUrl: typeof comment.permalink_url === 'string' ? comment.permalink_url : undefined,
      priorThreadEntries,
      existingReplies: replies
    };

    if (normalized.id && normalized.message) {
      comments.push(normalized);
    }
  }

  return comments;
}

async function loadAdStoryComments(): Promise<RealFacebookComment[]> {
  const inventory = await loadAdStoryInventory();
  if (inventory.length === 0) return [];

  const storiesToQuery = inventory.slice(0, AD_STORY_QUERY_LIMIT);
  const pageToken = await getGraphToken('page');
  const commentFields = 'id,message,created_time,like_count,comment_count,from,permalink_url,is_hidden,comments.limit(25){id,message,created_time,from,permalink_url,like_count,is_hidden}';
  const allComments: RealFacebookComment[] = [];

  // Process in concurrent batches
  for (let i = 0; i < storiesToQuery.length; i += AD_STORY_CONCURRENCY) {
    const batch = storiesToQuery.slice(i, i + AD_STORY_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((entry) =>
        fetchStoryCommentPages(entry.storyId, pageToken, commentFields)
          .then((data) => ({ entry, data }))
      )
    );

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const { entry, data } = result.value;
      const sorted = sortByCreatedTime(data);
      allComments.push(...normalizeStoryComments(sorted, entry));
    }
  }

  return allComments;
}

/** Max pages of feed results to follow for organic post comments. */
const LIVE_FEED_MAX_PAGES = 5;

async function loadLiveFeedComments(): Promise<RealFacebookComment[]> {
  const pageToken = await getGraphToken('page');
  const feedFields = 'id,message,comments.limit(50){id,message,created_time,like_count,comment_count,from,permalink_url,is_hidden,comments.limit(25){id,message,created_time,from,permalink_url,like_count,is_hidden}}';
  const allPosts: Array<Record<string, unknown>> = [];
  let nextUrl: string | undefined;
  let page = 0;

  const first = await graphRequest<{ data?: Array<Record<string, unknown>>; paging?: { next?: string } }>(`${pageId}/feed`, {
    token: pageToken,
    params: { fields: feedFields, limit: '50' }
  });
  allPosts.push(...(first.data ?? []));
  nextUrl = first.paging?.next;
  page = 1;

  while (nextUrl && page < LIVE_FEED_MAX_PAGES) {
    try {
      const response = await fetch(nextUrl, { cache: 'no-store' });
      if (!response.ok) break;
      const result = (await response.json()) as { data?: Array<Record<string, unknown>>; paging?: { next?: string } };
      const pageData = result.data ?? [];
      if (pageData.length === 0) break;
      allPosts.push(...pageData);
      nextUrl = result.paging?.next;
      page++;
    } catch {
      break;
    }
  }

  return allPosts.flatMap((post) => {
    const storyId = typeof post.id === 'string' ? post.id : '';
    const nested = sortByCreatedTime((post.comments as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []);

    return nested.map((comment, index) => {
      const replies = sortByCreatedTime((((comment.comments as { data?: Array<Record<string, unknown>> } | undefined)?.data) ?? [])
        .map((reply) => normalizeThreadEntry({ raw: reply, pageId, isReply: true, parentId: String(comment.id ?? '') }))
        .filter((reply) => reply.id && reply.message));

      const priorThreadEntries = nested
        .slice(0, index)
        .map((entry) => normalizeThreadEntry({ raw: entry, pageId }))
        .filter((entry) => entry.id && entry.message);

      const from = (comment.from as MetaActor | undefined) ?? undefined;

      return {
        id: String(comment.id ?? ''),
        storyId,
        pageId,
        authorId: typeof from?.id === 'string' ? from.id : undefined,
        authorName: typeof from?.name === 'string' ? from.name : undefined,
        message: String(comment.message ?? ''),
        createdTime: typeof comment.created_time === 'string' ? comment.created_time : undefined,
        likeCount: typeof comment.like_count === 'number' ? comment.like_count : undefined,
        commentCount: typeof comment.comment_count === 'number' ? comment.comment_count : undefined,
        isHidden: typeof comment.is_hidden === 'boolean' ? comment.is_hidden : undefined,
        permalinkUrl: typeof comment.permalink_url === 'string' ? comment.permalink_url : undefined,
        priorThreadEntries,
        existingReplies: replies
      };
    });
  }).filter((comment) => comment.id && comment.message);
}

export async function getMetaConnectionStatus(): Promise<MetaConnectionStatus> {
  const checkedAt = new Date().toISOString();
  const snapshotCoverage = await getSnapshotCoverage();

  try {
    const pageToken = await getGraphToken('page');
    await graphRequest<{ id: string; name: string }>(pageId, {
      token: pageToken,
      params: { fields: 'id,name' }
    });

    const canReadSnapshot = await hasReportSnapshot();
    return {
      source: 'graph-live',
      data: {
        status: 'ready',
        detail: canReadSnapshot
          ? `Stored user token successfully derived the Renuv Page token. Mission Control discovers all active/paused ads via Marketing API (no date filter), queries ad/story comments directly (up to ${AD_STORY_QUERY_LIMIT} stories per cycle, ${AD_STORY_COMMENT_PAGES} pages each), combines with live page/feed reads (${LIVE_FEED_MAX_PAGES} pages), and falls back to the stored snapshot for older threads. ${snapshotCoverage ? formatSnapshotCoverageDetail(snapshotCoverage) : ''}`.trim()
          : `Stored user token successfully derived the Renuv Page token. Live Graph page/feed reads and ad/story comment ingestion (up to ${AD_STORY_QUERY_LIMIT} stories with live ad discovery, no date filter) are enabled.`
      },
      posting: { status: 'ready', detail: 'Stored user token successfully derived the Renuv Page token, and live Facebook reply posting can be attempted when a comment id is present.' },
      tokenPath,
      pageId,
      checkedAt,
      knownCommentCount: snapshotCoverage?.commentCount,
      knownStoryCount: snapshotCoverage?.storyCount,
      newestKnownCommentAt: snapshotCoverage?.newestCommentAt,
      snapshotFetchedAt: snapshotCoverage?.snapshotFetchedAt
    };
  } catch (error) {
    cachedPageToken = null;
    const detail = formatMetaError(error);
    const canReadSnapshot = await hasReportSnapshot();
    return {
      source: canReadSnapshot ? 'report-snapshot' : 'mock',
      data: {
        status: canReadSnapshot ? 'ready' : 'blocked',
        detail: canReadSnapshot
          ? `Live Graph unavailable (${detail}). Falling back to stored Meta comment snapshot. ${snapshotCoverage ? formatSnapshotCoverageDetail(snapshotCoverage) : ''} This is only a partial backlog proxy, not full Business Suite parity.`.trim()
          : `Live Graph unavailable and no stored Meta comment snapshot is present (${detail}).`
      },
      posting: { status: 'blocked', detail: `Live Facebook reply posting is blocked: ${detail}` },
      tokenPath,
      pageId,
      checkedAt,
      knownCommentCount: snapshotCoverage?.commentCount,
      knownStoryCount: snapshotCoverage?.storyCount,
      newestKnownCommentAt: snapshotCoverage?.newestCommentAt,
      snapshotFetchedAt: snapshotCoverage?.snapshotFetchedAt
    };
  }
}

export async function hasReportSnapshot() {
  try {
    await readFile(rawCommentsPath, 'utf8');
    return true;
  } catch {
    return false;
  }
}

export async function listRealFacebookComments(): Promise<{ comments: RealFacebookComment[]; connection: MetaConnectionStatus }> {
  const connection = await getMetaConnectionStatus();

  if (connection.source === 'graph-live') {
    const [liveComments, adStoryComments, snapshotComments] = await Promise.all([
      loadLiveFeedComments(),
      loadAdStoryComments().catch(() => [] as RealFacebookComment[]),
      hasReportSnapshot().then((hasSnapshot) => hasSnapshot ? loadSnapshotComments() : [])
    ]);

    // Ad/story comments are highest priority (most coverage), then live feed, then snapshot fallback
    const merged = mergeComments(adStoryComments, mergeComments(liveComments, snapshotComments));

    return { comments: merged, connection };
  }

  return {
    comments: await loadSnapshotComments(),
    connection
  };
}

export async function postReplyToFacebookComment(params: { commentId?: string; message: string }) {
  if (!params.commentId) {
    throw new Error('Cannot post Facebook reply because this approval item is missing a real Meta comment id.');
  }

  const connection = await getMetaConnectionStatus();
  if (connection.posting.status !== 'ready') {
    throw new Error(connection.posting.detail);
  }

  return graphRequestWithFreshPageToken<{ id: string }>(`${params.commentId}/comments`, {
    method: 'POST',
    params: { message: params.message }
  });
}

export async function setFacebookCommentHidden(params: { commentId?: string; hidden: boolean }) {
  if (!params.commentId) {
    throw new Error(`Cannot ${params.hidden ? 'hide' : 'unhide'} Facebook comment because this approval item is missing a real Meta comment id.`);
  }

  const connection = await getMetaConnectionStatus();
  if (connection.posting.status !== 'ready') {
    throw new Error(connection.posting.detail);
  }

  return graphRequestWithFreshPageToken<{ success?: boolean; is_hidden?: boolean }>(`${params.commentId}`, {
    method: 'POST',
    params: { is_hidden: params.hidden ? 'true' : 'false' }
  });
}
