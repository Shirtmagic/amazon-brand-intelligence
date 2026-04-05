'use server';

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { listRealFacebookComments, postReplyToFacebookComment, setFacebookCommentHidden, type MetaConnectionStatus, type RealFacebookThreadEntry } from '@/lib/meta-facebook';
import { invalidateDashboardCache } from '@/lib/dashboard-cache';

export type RuntimeStatus = 'online' | 'busy' | 'idle' | 'blocked' | 'future';
export type Priority = 'low' | 'medium' | 'high';
export type ApprovalStatus = 'needs-review' | 'approved' | 'rejected' | 'draft-ready' | 'revision-requested';
export type AuditActionKind = 'approval-decision' | 'model-change' | 'stop-task' | 'comment-revision' | 'feedback-captured' | 'queue-dismissed' | 'comment-visibility' | 'training-milestone';
export type AuditTargetType = 'approval' | 'agent' | 'guidance';

export type AgentRegistryItem = {
  id: string;
  name: string;
  role: string;
  laneId: string;
  lane: string;
  provider: string;
  model: string;
  reportsTo: string;
  responsibilities: string[];
};

export type RuntimeAgentState = {
  id: string;
  status: RuntimeStatus;
  currentTask: string;
  focus: string;
  lastHeartbeat: string;
  pendingTasks: number;
  pendingApprovals: number;
  blocker?: string;
};

export type RuntimeSource = {
  source: string;
  lastSyncedAt: string;
  agents: RuntimeAgentState[];
};

export type ApprovalThreadContext = {
  storyId: string;
  summary: string;
  priorCustomerCommentCount: number;
  priorPageReplyCount: number;
  existingReplyCount: number;
  messages: Array<{
    id: string;
    parentId?: string;
    message: string;
    createdTime?: string;
    authorName?: string;
    authorRole: 'customer' | 'page' | 'other';
    isReply?: boolean;
    isCurrent?: boolean;
  }>;
};

export type ApprovalItem = {
  id: string;
  title: string;
  type: string;
  owner: string;
  status: ApprovalStatus;
  risk: Priority;
  destination: string;
  summary: string;
  requestedAt: string;
  sla: string;
  decisionOwner: string;
  agentId: string;
  workflowKind?: 'facebook-comment' | 'generic';
  channel?: string;
  account?: string;
  previewEyebrow?: string;
  previewTitle?: string;
  originalComment?: string;
  commentMeta?: string;
  responseTitle?: string;
  suggestedResponse?: string;
  responseMeta?: string;
  noPublicReplyRecommended?: boolean;
  decidedAt?: string;
  decisionNote?: string;
  operatorFeedback?: string;
  operatorDraft?: string;
  revisedResponse?: string;
  replyReadyToPost?: string;
  approvedReply?: string;
  revisedAt?: string;
  revisionCount?: number;
  lastRevisionState?: 'awaiting-feedback' | 'revising' | 'updated';
  learningNoteIds?: string[];
  externalCommentId?: string;
  externalStoryId?: string;
  externalPermalinkUrl?: string;
  liveDataSource?: 'graph-live' | 'report-snapshot' | 'mock';
  commentHidden?: boolean;
  threadContext?: ApprovalThreadContext;
};

export type ApprovalSource = {
  source: string;
  lastUpdatedAt: string;
  items: ApprovalItem[];
};

export type ActivityItem = {
  id: string;
  time: string;
  actor: string;
  summary: string;
  object: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  actionKind: AuditActionKind;
  targetType: AuditTargetType;
  targetId: string;
  targetLabel: string;
  summary: string;
  detail: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type AuditLogSource = {
  source: string;
  lastUpdatedAt: string;
  events: AuditEvent[];
};

export type CommentGuidanceItem = {
  id: string;
  agentId: string;
  approvalId: string;
  rule: string;
  createdAt: string;
  lastAppliedAt: string;
  timesApplied: number;
};

export type CommentFeedbackEvent = {
  id: string;
  approvalId: string;
  feedback: string;
  operatorDraft?: string;
  revisedResponse: string;
  createdAt: string;
  guidanceIds: string[];
};

export type CommentGuidanceSource = {
  source: string;
  lastUpdatedAt: string;
  items: CommentGuidanceItem[];
  history: CommentFeedbackEvent[];
};

const dataDir = path.join(process.cwd(), 'src/data');
const MAX_ACTIVITY_ITEMS = 24;
const MAX_AUDIT_EVENTS = 120;
const MAX_GUIDANCE_HISTORY = 60;

const dataFile = (fileName: string) => path.join(dataDir, fileName);

async function readJsonFile<T>(fileName: string): Promise<T> {
  const raw = await readFile(dataFile(fileName), 'utf8');
  return JSON.parse(raw) as T;
}

async function writeJsonFile(fileName: string, data: unknown) {
  const filePath = dataFile(fileName);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  invalidateDashboardCache();
}

function nowIso() {
  return new Date().toISOString();
}

function nowTimeLabel() {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());
}

function formatRelativeLabel(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function actionId(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

function normalizeGuidanceState(params: {
  approvals: ApprovalSource;
  guidance: CommentGuidanceSource;
}) {
  const { approvals, guidance } = params;
  const seen = new Map<string, number>();
  const remappedIds = new Map<string, string[]>();
  let changed = false;

  const nextGuidanceItems = guidance.items.map((item) => {
    const occurrence = (seen.get(item.id) ?? 0) + 1;
    seen.set(item.id, occurrence);

    const nextId = occurrence === 1 ? item.id : `${item.id}__${occurrence}`;
    const existing = remappedIds.get(item.id) ?? [];
    existing.push(nextId);
    remappedIds.set(item.id, existing);

    if (nextId !== item.id) {
      changed = true;
      return { ...item, id: nextId };
    }

    return item;
  });

  if (!changed) {
    return { approvals, guidance, changed: false };
  }

  const nextApprovals: ApprovalSource = {
    ...approvals,
    items: approvals.items.map((approval) => {
      const originalIds = approval.learningNoteIds ?? [];
      if (!originalIds.length) {
        return approval;
      }

      const counters = new Map<string, number>();
      const nextLearningNoteIds = originalIds.flatMap((id) => {
        const matches = remappedIds.get(id);
        if (!matches?.length) {
          return [id];
        }

        const nextIndex = counters.get(id) ?? 0;
        counters.set(id, nextIndex + 1);
        return [matches[Math.min(nextIndex, matches.length - 1)]];
      });

      return {
        ...approval,
        learningNoteIds: nextLearningNoteIds
      };
    })
  };

  const nextGuidance: CommentGuidanceSource = {
    ...guidance,
    items: nextGuidanceItems,
    history: guidance.history.map((event) => {
      const counters = new Map<string, number>();
      return {
        ...event,
        guidanceIds: event.guidanceIds.flatMap((id) => {
          const matches = remappedIds.get(id);
          if (!matches?.length) {
            return [id];
          }

          const nextIndex = counters.get(id) ?? 0;
          counters.set(id, nextIndex + 1);
          return [matches[Math.min(nextIndex, matches.length - 1)]];
        })
      };
    })
  };

  return {
    approvals: nextApprovals,
    guidance: nextGuidance,
    changed: true
  };
}

async function readAuditLog() {
  try {
    return await readJsonFile<AuditLogSource>('mission-control-audit-log.json');
  } catch {
    return {
      source: 'mission-control/audit-log.json',
      lastUpdatedAt: nowIso(),
      events: []
    } satisfies AuditLogSource;
  }
}

async function readCommentGuidance() {
  try {
    return await readJsonFile<CommentGuidanceSource>('mission-control-comment-guidance.json');
  } catch {
    return {
      source: 'mission-control/comment-guidance.json',
      lastUpdatedAt: nowIso(),
      items: [],
      history: []
    } satisfies CommentGuidanceSource;
  }
}

function trimNote(note?: string) {
  return note?.trim() || undefined;
}

function isPlaceholderReply(note?: string) {
  const normalized = trimNote(note)?.toLowerCase();
  return normalized === 'reply draft not generated yet.' || normalized === 'reply draft not generated yet';
}

function sentenceCaseDecision(decision: 'approve' | 'revise' | 'reject' | 'dismiss' | 'reopen') {
  const labels = {
    approve: 'approved',
    revise: 'requested revisions on',
    reject: 'rejected',
    dismiss: 'dismissed',
    reopen: 'reopened'
  } as const;

  return labels[decision];
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function sentenceTrim(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getReplyReadyToPost(approval: ApprovalItem) {
  const candidates = [approval.replyReadyToPost, approval.revisedResponse, approval.suggestedResponse]
    .map((value) => trimNote(value))
    .filter((value): value is string => Boolean(value));

  return candidates.find((value) => !isPlaceholderReply(value)) ?? undefined;
}

function syncReplyReadyToPost(approval: ApprovalItem, replyReadyToPost?: string) {
  const normalized = trimNote(replyReadyToPost);
  if (!normalized || isPlaceholderReply(normalized)) return approval;

  approval.replyReadyToPost = normalized;
  approval.revisedResponse = normalized;

  if (!trimNote(approval.suggestedResponse) || isPlaceholderReply(approval.suggestedResponse)) {
    approval.suggestedResponse = normalized;
  }

  return approval;
}

function buildGuidanceRules(feedback?: string, operatorDraft?: string) {
  const raw = [feedback, operatorDraft]
    .filter(Boolean)
    .flatMap((value) => String(value).split(/\n|;+/))
    .map((line) => line.trim())
    .filter((line) => line.length >= 8);

  const rules = new Set<string>();

  for (const line of raw) {
    const lower = line.toLowerCase();
    if (lower.includes('short')) rules.add('Keep Facebook replies concise and easy to scan.');
    if (lower.includes('direct')) rules.add('Lead with the answer before extra context.');
    if (lower.includes('friendly') || lower.includes('warm')) rules.add('Keep the tone warm, calm, and human.');
    if (lower.includes('cta') || lower.includes('next step') || lower.includes('directions')) rules.add('Only add a next step when it is directly useful, and keep it casual.');
    if (lower.includes('no hype') || lower.includes('not salesy') || lower.includes('less sales')) {
      rules.add('Avoid hypey claims and keep the reply grounded.');
      rules.add('Skip salesy closers or support-funnel language.');
      rules.add('Keep the tone loose, natural, and low-pressure.');
    }
    if (lower.includes('public')) rules.add('Write for a public comment thread, not a private back-and-forth chat.');
  }

  for (const line of raw) {
    rules.add(sentenceTrim(line));
    if (rules.size >= 4) break;
  }

  return Array.from(rules).filter(Boolean).slice(0, 4);
}

function maybeShortenResponse(text: string) {
  return splitSentences(text).slice(0, 2).join(' ');
}

function hasSalesyCloser(text: string) {
  const normalized = normalizeText(text);
  return /let me know if you have questions|let me know if you have any questions|if there'?s anything specific you want to know|i can help with that|i can answer that directly|if you want[, ]+i can point you|if you'?d like[, ]+i can point you|happy to help|happy to answer|tell me the model[, ]+i can be more specific|what machine are you using[?]? i can answer that more directly once i know the model|share the machine or issue[, ]+i can answer that directly|reach out if you need anything|reach out if you have questions|dm us|send us a dm|message us|check the product page|check out the product page|feel free to ask|we can help|we d be happy to help|give it a try|you'?ll love it|order now/.test(normalized);
}

function stripSalesyClosers(text: string) {
  const cleaned = splitSentences(text)
    .filter((sentence) => !hasSalesyCloser(sentence))
    .join(' ')
    .replace(/(?:^|\s)(and|but)?\s*(if you want|if you'd like|if you would like|let me know|happy to help|happy to answer|i can help with that|i can answer that directly|tell me the model|share the machine or issue|reach out if you need anything|reach out if you have questions|dm us|send us a dm|message us|check(?: out)? the product page|feel free to ask|we can help|we'd be happy to help)[^.?!]*[.?!]?$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\.\s*\./g, '.')
    .replace(/\s*[—-]\s*$/g, '')
    .trim();

  return cleaned;
}

function startsWithWeakFiller(text: string) {
  const trimmed = text.trim();
  // Playbook: "thanks for the comment/question" on real product questions is weak filler
  if (/^(thanks for the comment|thanks for your comment|thanks for the question|thanks for reaching out|appreciate the comment|appreciate you asking)\b/i.test(trimmed)) return true;
  // Playbook: name-leading replies ("Hi Sarah, ...") are clunky unless genuinely helpful
  if (/^(hi|hey|hello)\s+[A-Z][a-z]+[,!]?\s/i.test(trimmed)) return true;
  return false;
}

function isPraiseOnlyComment(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (/\?/.test(text)) return false;
  return /thanks|love|works|great|fresh|clean|good cup|good clean|awesome|helped/.test(normalized)
    && !/older|keurig|ninja|breville|dishwasher|washing machine|washer|compatible|safe for|works in|buy|purchase|amazon|website|scam|really work|how|what|why/.test(normalized);
}

function getDirectAnswerLead(text: string) {
  const normalized = normalizeText(text);

  if (/where can (you|i) buy|where do (you|i) buy|where to buy|buy this|buy it|purchase|order/.test(normalized)) {
    return 'You can get it on our website here: https://renuv.com/products/coffee-machine-cleaner-descaler';
  }

  if (/amazon|walmart|tiktok shop|ebay|website|site/.test(normalized)) {
    return 'You can get it on our website here: https://renuv.com/products/coffee-machine-cleaner-descaler';
  }

  if (/older|works in|use this in|safe for|compatible|fit my|keurig|ninja|breville|espresso|coffee maker|dishwasher|washing machine|washer|tablet|pod machine|machine|cleaning cycle|descal|buildup|hard water/.test(normalized)) {
    return 'Yes — it is meant for machines that can run a normal cleaning or descale cycle.';
  }

  if (/scam|miracle|snake oil|another bottle|does this really work|actually work|marketing/.test(normalized)) {
    return 'Fair question — it is meant to help break down buildup, not promise miracles.';
  }

  return undefined;
}

function ensureDirectAnswerFirst(response: string, originalComment: string) {
  if (!response.trim()) return response;

  let nextResponse = response.trim();
  const directLead = getDirectAnswerLead(originalComment);
  const commentLooksLikePraise = isPraiseOnlyComment(originalComment);

  if (!commentLooksLikePraise && startsWithWeakFiller(nextResponse)) {
    nextResponse = nextResponse
      .replace(/^(thanks for the comment|thanks for your comment|thanks for the question|thanks for reaching out|appreciate the comment|appreciate you asking)[,!\s-—:]*/i, '')
      .replace(/^(hi|hey|hello)\s+[A-Z][a-z]+[,!]?\s*/i, '');
  }

  if (directLead && !new RegExp(`^${directLead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}`, 'i').test(nextResponse)) {
    if (/^yes\b|^fair question\b|^you can get it\b/i.test(nextResponse)) {
      return sentenceTrim(nextResponse);
    }

    const lower = nextResponse.toLowerCase();
    if (!lower.includes(directLead.toLowerCase().slice(0, 24))) {
      nextResponse = `${directLead} ${lowerFirst(nextResponse)}`;
    }
  }

  if (!commentLooksLikePraise && startsWithWeakFiller(nextResponse)) {
    nextResponse = nextResponse
      .replace(/^(thanks for the comment|thanks for your comment|thanks for the question|thanks for reaching out|appreciate the comment|appreciate you asking)[,!\s-—:]*/i, '')
      .replace(/^(hi|hey|hello)\s+[A-Z][a-z]+[,!]?\s*/i, '');
  }

  return sentenceTrim(nextResponse);
}

function deriveSteeringLead(feedbackLower: string, originalComment: string) {
  const directLead = getDirectAnswerLead(originalComment);

  if (/older/.test(feedbackLower) && directLead?.toLowerCase().startsWith('yes')) {
    return 'Yes — it can work on many older machines too, as long as they still run a normal cleaning cycle.';
  }

  if ((feedbackLower.includes('answer first') || feedbackLower.includes('lead with the answer') || feedbackLower.includes('direct')) && directLead) {
    return directLead;
  }

  return undefined;
}

function makeReplyLooserAndLowerPressure(response: string) {
  return response
    .replace(/\bAbsolutely\b/gi, 'Yes')
    .replace(/\bdefinitely\b/gi, 'usually')
    .replace(/\bdesigned to help\b/gi, 'meant to help')
    .replace(/\bglad to hear that\b/gi, 'glad it helped')
    .replace(/\bwe recommend\b/gi, 'usually')
    .replace(/\bit is intended to\b/gi, 'it is meant to')
    .replace(/\byou can use it on many older machines too, as long as they still run a normal cleaning cycle\b/gi, 'it can work on many older machines too, as long as they still run a normal cleaning cycle')
    .replace(/\s+/g, ' ')
    .trim();
}

function finalizeFacebookReply(params: {
  response: string;
  originalComment: string;
  feedbackLower?: string;
  guidanceRules?: string[];
}) {
  const { originalComment } = params;
  const feedbackLower = params.feedbackLower ?? '';
  const guidanceLower = (params.guidanceRules ?? []).join(' ').toLowerCase();
  const wantsShort = feedbackLower.includes('short') || feedbackLower.includes('shorter') || feedbackLower.includes('concise') || guidanceLower.includes('concise');
  const wantsLooseHuman = feedbackLower.includes('casual') || feedbackLower.includes('human') || feedbackLower.includes('loose') || feedbackLower.includes('low-pressure') || feedbackLower.includes('not sales') || feedbackLower.includes('no hype') || feedbackLower.includes('less sales') || guidanceLower.includes('low-pressure') || guidanceLower.includes('loose') || guidanceLower.includes('natural');

  let nextResponse = params.response.trim();
  nextResponse = stripSalesyClosers(nextResponse);
  nextResponse = ensureDirectAnswerFirst(nextResponse, originalComment);

  const steeringLead = deriveSteeringLead(feedbackLower, originalComment);
  if (steeringLead && !new RegExp(`^${steeringLead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}`, 'i').test(nextResponse)) {
    nextResponse = `${steeringLead} ${lowerFirst(stripSalesyClosers(nextResponse))}`;
  }

  if (feedbackLower && /thanks for the comment|if there is anything specific you want to know|i can help with that/i.test(nextResponse)) {
    nextResponse = steeringLead ?? getDirectAnswerLead(originalComment) ?? nextResponse;
  }

  if (wantsLooseHuman) {
    nextResponse = makeReplyLooserAndLowerPressure(nextResponse);
  }

  nextResponse = stripSalesyClosers(nextResponse);
  nextResponse = nextResponse
    .replace(/^just to add to the thread\s*[—-]\s*/i, '')
    .replace(/^adding a bit more context here\s*[—-]\s*/i, '')
    .replace(/^thanks for following up(?: here)?\s*[—-]\s*/i, '')
    .replace(/\bDirections are on the product page if needed\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (wantsShort && splitSentences(nextResponse).length > 1) {
    nextResponse = splitSentences(nextResponse)[0] ?? nextResponse;
  }

  if (wantsShort && nextResponse.length > 140) {
    nextResponse = maybeShortenResponse(nextResponse);
  }

  nextResponse = stripSalesyClosers(nextResponse);
  nextResponse = ensureDirectAnswerFirst(nextResponse, originalComment);

  return sentenceTrim(nextResponse);
}

function extractUrl(text?: string) {
  const match = text?.match(/https?:\/\/\S+/i);
  return match?.[0]?.replace(/[),.;!?]+$/, '');
}

function rewritePurchaseDestination(response: string, feedback?: string, guidanceRules: string[] = []) {
  const combined = [feedback, ...guidanceRules].filter(Boolean).join(' ');
  const lower = combined.toLowerCase();

  const wantsWebsite = /\bour website\b|\bwebsite\b/.test(lower);
  const rejectsAmazon = /\bnot amazon\b|\binstead of amazon\b|\bno amazon\b|\bdon't use amazon\b|\bdo not use amazon\b/.test(lower);
  const replacementUrl = extractUrl(combined);

  if (!wantsWebsite && !rejectsAmazon && !replacementUrl) {
    return response;
  }

  let nextResponse = response;
  const normalizedUrl = replacementUrl ?? 'https://renuv.com/products/coffee-machine-cleaner-descaler';
  const isPurchaseReply = /where can (you|i) buy|where do (you|i) buy|you can get it|purchase|buy this|buy it/i.test(nextResponse);

  if (isPurchaseReply || /amazon/i.test(nextResponse) || wantsWebsite || rejectsAmazon) {
    nextResponse = nextResponse
      .replace(/\bAmazon\b/gi, 'our website')
      .replace(/https?:\/\/www\.amazon\.com\/\S+/gi, normalizedUrl)
      .replace(/https?:\/\/amazon\.com\/\S+/gi, normalizedUrl)
      .replace(/you can get it on our website here/gi, 'you can get it on our website here')
      .replace(/you can get it here/gi, 'you can get it on our website here');

    if (!/our website/i.test(nextResponse) && isPurchaseReply) {
      nextResponse = `You can get it on our website here: ${normalizedUrl}`;
    }

    if (!new RegExp(normalizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(nextResponse)) {
      nextResponse = nextResponse.replace(/([.!?])?\s*$/, ` ${normalizedUrl}$1`.trim());
    }
  }

  return nextResponse;
}

function applyFeedbackTransforms(response: string, feedbackLower: string) {
  let nextResponse = response;

  if (feedbackLower.includes('remove the last sentence') || feedbackLower.includes('remove last sentence')) {
    const sentences = splitSentences(nextResponse);
    if (sentences.length > 1) {
      nextResponse = sentences.slice(0, -1).join(' ');
    }
  }

  if (feedbackLower.includes('first sentence only')) {
    const firstSentence = splitSentences(nextResponse)[0];
    if (firstSentence) {
      nextResponse = firstSentence;
    }
  }

  if (feedbackLower.includes('not sales') || feedbackLower.includes('no hype') || feedbackLower.includes('less sales') || feedbackLower.includes('casual') || feedbackLower.includes('human')) {
    nextResponse = stripSalesyClosers(nextResponse);
  }

  return nextResponse;
}

function isNoPublicReplyApproval(approval: ApprovalItem) {
  if (approval.noPublicReplyRecommended === true) {
    return true;
  }

  if (approval.noPublicReplyRecommended === false) {
    return false;
  }

  const hasReplyWorkflowFields = approval.responseTitle?.toLowerCase().includes('reply that will post if approved')
    || Boolean(trimNote(approval.replyReadyToPost))
    || Boolean(trimNote(approval.revisedResponse));

  if (hasReplyWorkflowFields) {
    return false;
  }

  const haystack = [
    approval.type,
    approval.title,
    approval.summary,
    approval.responseTitle,
    approval.suggestedResponse
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes('no public reply')
    || haystack.includes('no-reply')
    || haystack.includes('no reply recommended')
    || haystack.includes('no-reply decision');
}

function getCurrentThreadMessage(approval: ApprovalItem) {
  return approval.threadContext?.messages.find((message) => message.isCurrent)?.message?.trim()
    || approval.originalComment?.trim()
    || '';
}

function getThreadTextForMatching(approval: ApprovalItem) {
  return (approval.threadContext?.messages ?? [])
    .map((message) => message.message?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function getApprovedReplyText(approval?: ApprovalItem) {
  return [approval?.approvedReply, approval?.replyReadyToPost, approval?.revisedResponse, approval?.suggestedResponse]
    .map((value) => trimNote(value))
    .find((value): value is string => Boolean(value) && !isPlaceholderReply(value));
}

function classifyCommentIntent(text: string) {
  const normalized = normalizeText(text);

  if (!normalized) return 'empty';
  if (/^[\p{Emoji}\s.?!]+$/u.test(text) || normalized.length < 3) return 'emoji';

  // Noise: tags, "amen", "I need that", "wow", short low-context chatter (playbook §skip)
  if (/^@\w/i.test(text.trim()) && normalized.length < 40) return 'tag';
  if (/^(amen|i need that|i need this|wow|omg|yes please|need|want|gimme|same)\b/i.test(normalized) && normalized.length < 30) return 'noise';

  if (/https?:\/\//i.test(text) || /amazon\.com|renuv\.com/i.test(text)) return 'link';

  // Support / order issues — route separately from purchase (playbook §5)
  if (/broken|damaged|didn.?t arrive|never received|wrong item|refund|return|shipping issue|order issue|customer service|support|complaint/i.test(normalized)) return 'support';

  if (/where can (you|i) buy|where do (you|i) buy|were can you buy|where to buy|buy this|buy it|purchase|order/i.test(normalized)) return 'purchase';
  if (/amazon|walmart|tiktok shop|ebay|website|site/i.test(normalized)) return 'availability';
  if (/older|keurig|ninja|breville|coffee maker|espresso|dishwasher|washing machine|washer|agitator|fabric softener|scrud|tablet|pod machine|machine|cleaning cycle|descal|buildup|hard water|works in|use this in|safe for|compatible|fit my/i.test(normalized)) return 'product-use';
  if (/scam|miracle|snake oil|same|label|another bottle|does this really work|sure it works|actually work|marketing/i.test(normalized)) return 'skeptical';

  // Alternative-method comments: vinegar, bleach, baking soda, etc. (playbook §6)
  if (/\b(vinegar|bleach|lemon|baking soda|distilled water|citric acid|clr|white vinegar)\b/i.test(normalized) && !/\?/.test(text)) return 'alternative-method';

  if (/\?/.test(text)) return 'question';
  if (/thanks|love|works|great|fresh|clean|good cup|good clean|awesome|helped/i.test(normalized)) return 'praise';
  if (/should|could|start cleaning|doors open|easy to clean|comes apart|notice/i.test(normalized)) return 'tip';
  return 'general';
}

/**
 * Playbook-driven skip/hide routing.
 * Returns true for intents where a public reply adds no value per the Sammy
 * reply playbook (tags, emoji, noise, alternative-method drive-bys).
 */
function shouldRecommendNoPublicReply(commentText: string) {
  const intent = classifyCommentIntent(commentText);
  return intent === 'tag' || intent === 'emoji' || intent === 'noise' || intent === 'alternative-method' || intent === 'empty';
}

function scoreReplyExample(params: {
  example: ApprovalItem;
  approval: ApprovalItem;
  guidanceRules?: string[];
}) {
  const { example, approval, guidanceRules = [] } = params;
  const exampleComment = getCurrentThreadMessage(example);
  const targetComment = getCurrentThreadMessage(approval);
  const exampleReply = getApprovedReplyText(example) ?? '';
  const targetThread = getThreadTextForMatching(approval);
  const exampleThread = getThreadTextForMatching(example);

  let score = 0;
  if (!exampleReply) return -1;

  const targetIntent = classifyCommentIntent(targetComment);
  const exampleIntent = classifyCommentIntent(exampleComment);
  const guidanceLower = guidanceRules.join(' ').toLowerCase();
  if (targetIntent === exampleIntent) score += 10;

  const targetWords = new Set(normalizeText(`${targetComment} ${targetThread}`).split(' ').filter((word) => word.length >= 4));
  const exampleWords = new Set(normalizeText(`${exampleComment} ${exampleThread}`).split(' ').filter((word) => word.length >= 4));
  for (const word of targetWords) {
    if (exampleWords.has(word)) score += 1;
  }

  if (/amazon|renuv\.com|website/.test(exampleReply.toLowerCase()) && /amazon|website|buy|purchase|order/.test(targetComment.toLowerCase())) score += 5;
  if (/yes\b|fair question\b|you can get it\b/i.test(exampleReply)) score += 3;
  if (startsWithWeakFiller(exampleReply) && targetIntent !== 'praise' && targetIntent !== 'emoji') score -= 7;
  if (hasSalesyCloser(exampleReply) && targetIntent !== 'praise' && targetIntent !== 'emoji') score -= 10;
  if (exampleReply.length <= 160) score += 2;
  if (exampleReply.length > 240) score -= 3;
  if (example.status === 'approved') score += 2;
  if ((guidanceLower.includes('concise') || guidanceLower.includes('lead with the answer')) && exampleReply.length <= 140) score += 2;
  if ((targetIntent === 'product-use' || targetIntent === 'purchase' || targetIntent === 'availability' || targetIntent === 'skeptical') && !/^yes\b|^fair question\b|^you can get it\b/i.test(exampleReply)) score -= 4;

  // Playbook: penalize weak historical reply patterns
  // Name-leading replies ("Hi Sarah, ...") are clunky per playbook
  if (/^(hi|hey|hello)\s+[A-Z][a-z]+/i.test(exampleReply)) score -= 5;
  // Rambling replies (>300 chars) are almost always bad examples
  if (exampleReply.length > 300) score -= 6;
  // Amazon-first buy replies violate the website-first rule
  if (/amazon/i.test(exampleReply) && !/website|renuv\.com/i.test(exampleReply) && (targetIntent === 'purchase' || targetIntent === 'availability')) score -= 8;
  // "Give it a try" / "You'll love it" / "Order now" — salesy language the playbook bans
  if (/give it a try|you'?ll love it|order now|we'?d be happy to help/i.test(exampleReply)) score -= 6;
  // "Thanks for the comment/question" on non-praise is a playbook anti-pattern
  if (/^thanks for (the|your) (comment|question)/i.test(exampleReply) && targetIntent !== 'praise') score -= 5;

  return score;
}

function pickBestApprovedReplyExample(approval: ApprovalItem, approvals: ApprovalItem[], guidanceRules: string[] = []) {
  return approvals
    .filter((item) => item.id !== approval.id && item.workflowKind === 'facebook-comment')
    .map((item) => ({ item, score: scoreReplyExample({ example: item, approval, guidanceRules }) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function generateReplyFromOriginalComment(approval: ApprovalItem, options?: {
  approvals?: ApprovalItem[];
  guidanceRules?: string[];
  includeLearnedStyle?: boolean;
}) {
  const original = getCurrentThreadMessage(approval);
  const intent = classifyCommentIntent(original);
  const guidanceRules = options?.guidanceRules ?? [];
  const approvedExample = options?.approvals
    ? pickBestApprovedReplyExample(approval, options.approvals, guidanceRules)
    : undefined;
  const approvedExampleReply = getApprovedReplyText(approvedExample);
  const guidanceLower = guidanceRules.join(' ').toLowerCase();
  const preferShortDirect = guidanceLower.includes('concise') || guidanceLower.includes('lead with the answer') || intent !== 'praise';

  // Playbook §skip: tags, noise, and emoji get no substantive reply
  if (intent === 'tag' || intent === 'noise') {
    return '';
  }

  // Playbook §5: support/order issues — brief ack + support redirect
  if (intent === 'support') {
    return approvedExampleReply && /support|help|sorry/i.test(approvedExampleReply) && !hasSalesyCloser(approvedExampleReply) && approvedExampleReply.length <= 160
      ? stripSalesyClosers(approvedExampleReply)
      : 'Sorry about that — please reach out to support so we can help sort it out.';
  }

  // Playbook §6: alternative-method comments — usually skip; short distinction only if worth it
  if (intent === 'alternative-method') {
    return 'That can help in some cases, but this is meant to clean internal buildup without leaving a vinegar smell behind.';
  }

  if (intent === 'link') {
    return approvedExampleReply && /amazon|website/i.test(approvedExampleReply) && !startsWithWeakFiller(approvedExampleReply)
      ? approvedExampleReply
      : 'You can get it on our website here: https://renuv.com/products/coffee-machine-cleaner-descaler';
  }

  if (intent === 'purchase' || intent === 'availability') {
    return approvedExampleReply && /website|buy|order/i.test(approvedExampleReply) && !startsWithWeakFiller(approvedExampleReply)
      ? ensureDirectAnswerFirst(approvedExampleReply, original)
      : 'You can get it on our website here: https://renuv.com/products/coffee-machine-cleaner-descaler';
  }

  if (intent === 'product-use') {
    return approvedExampleReply && /yes|machine|clean|cycle|buildup|keurig|washer|dishwasher|compatible|safe/i.test(approvedExampleReply) && !startsWithWeakFiller(approvedExampleReply) && !hasSalesyCloser(approvedExampleReply)
      ? ensureDirectAnswerFirst(stripSalesyClosers(approvedExampleReply), original)
      : 'Yes — it is meant for machines that can run a normal cleaning or descale cycle.';
  }

  if (intent === 'skeptical') {
    return approvedExampleReply && /fair question|promise miracles|buildup|performance|break down/i.test(approvedExampleReply) && !startsWithWeakFiller(approvedExampleReply) && !hasSalesyCloser(approvedExampleReply)
      ? ensureDirectAnswerFirst(stripSalesyClosers(approvedExampleReply), original)
      : 'Fair question — it is meant to help break down buildup, not promise miracles.';
  }

  if (intent === 'praise') {
    return approvedExampleReply && /thank|enjoy|fresh cup|glad/i.test(approvedExampleReply)
      ? approvedExampleReply
      : 'Glad it helped.';
  }

  if (intent === 'tip') {
    const concise = 'Good tip — leaving it open to dry out really does help.';
    return approvedExampleReply && approvedExampleReply.length <= 140 && !startsWithWeakFiller(approvedExampleReply) ? approvedExampleReply : concise;
  }

  if (intent === 'question') {
    return preferShortDirect
      ? 'Which machine is it?'
      : 'Which machine is it?';
  }

  if (intent === 'emoji') {
    return approvedExampleReply && approvedExampleReply.length <= 60 ? approvedExampleReply : 'Glad it helped.';
  }

  if (approvedExampleReply && options?.includeLearnedStyle !== false && !startsWithWeakFiller(approvedExampleReply) && !hasSalesyCloser(approvedExampleReply)) {
    return ensureDirectAnswerFirst(stripSalesyClosers(approvedExampleReply), original);
  }

  return preferShortDirect
    ? 'What machine is it for?'
    : 'What machine is it for?';
}

function buildRevisedResponse(params: {
  approval: ApprovalItem;
  feedback?: string;
  operatorDraft?: string;
  guidanceRules: string[];
  approvals?: ApprovalItem[];
}) {
  const { approval, feedback, operatorDraft, guidanceRules, approvals = [] } = params;
  if (operatorDraft?.trim()) {
    return operatorDraft.trim();
  }

  const original = getCurrentThreadMessage(approval);
  const approvedExample = pickBestApprovedReplyExample(approval, approvals, guidanceRules);
  const approvedExampleReply = getApprovedReplyText(approvedExample);
  const existingReplyReadyToPost = getReplyReadyToPost(approval);
  const hasFreshSteer = Boolean(feedback?.trim());
  const generatedReply = generateReplyFromOriginalComment(approval, {
    approvals,
    guidanceRules,
    includeLearnedStyle: true
  });

  let response = (hasFreshSteer
    ? generatedReply
      || approvedExampleReply
      || existingReplyReadyToPost
    : approvedExampleReply
      || existingReplyReadyToPost
      || generatedReply) ?? '';
  const feedbackLower = feedback?.toLowerCase() ?? '';
  const guidanceLower = guidanceRules.join(' ').toLowerCase();

  if (original.toLowerCase().includes('older') && !response.toLowerCase().includes('older')) {
    response = `Yes — it can be used on many older machines too, as long as they still run a normal cleaning cycle. ${response}`;
  }

  if ((feedbackLower.includes('short') || guidanceLower.includes('concise')) && response.length > 170) {
    response = maybeShortenResponse(response);
  }

  if (feedbackLower.includes('direct') || guidanceLower.includes('lead with the answer')) {
    response = response
      .replace(/^absolutely\s*[—-]\s*/i, '')
      .replace(/^yes\s*[—-]\s*/i, 'Yes — ')
      .replace(/^it should/i, 'Yes, it should');
  }

  if ((feedbackLower.includes('friendly') || feedbackLower.includes('warm')) && !/^absolutely|^yes/i.test(response)) {
    response = `Absolutely — ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
  }

  if ((feedbackLower.includes('cta') || feedbackLower.includes('directions')) && !/want|happy to|if you'd like/i.test(response)) {
    response = `${response} Directions are on the product page if needed.`;
  }

  if (feedbackLower.includes('not sales') || feedbackLower.includes('no hype') || feedbackLower.includes('less sales')) {
    response = response.replace(/definitely/gi, 'often').replace(/designed to help/gi, 'meant to help');
  }

  response = rewritePurchaseDestination(response, feedback, guidanceRules);
  response = stripSalesyClosers(response);
  response = ensureDirectAnswerFirst(response, original);
  response = buildContextAwareReply(approval, response);
  response = applyFeedbackTransforms(response, feedbackLower);
  response = stripSalesyClosers(response);
  response = ensureDirectAnswerFirst(response, original);

  // Playbook brevity rule: for factual intents, cap at 2 sentences when response
  // is getting long.  "If sentence 2 is not making the answer clearer, delete it."
  const intent = classifyCommentIntent(original);
  const factualIntents = new Set(['product-use', 'purchase', 'availability', 'skeptical', 'question', 'support']);
  if (factualIntents.has(intent) && response.length > 200) {
    response = maybeShortenResponse(response);
  }

  return sentenceTrim(response.replace(/\s+/g, ' '));
}

export async function listAvailableModels() {
  const registry = await readJsonFile<AgentRegistryItem[]>('mission-control-agent-registry.json');
  return Array.from(new Set([
    'GPT-5.4',
    'GPT-5.4 mini',
    'Claude Sonnet',
    'Gemini 1.5 Pro',
    ...registry.map((agent) => agent.model)
  ])).sort((a, b) => a.localeCompare(b));
}

function makeRealFacebookApprovalId(commentId: string) {
  return `apr-fb-${commentId.replace(/[^a-zA-Z0-9]+/g, '-')}`;
}

function relativeRequestedAt(createdTime?: string) {
  if (!createdTime) return 'Imported from Meta snapshot';
  return formatRelativeLabel(createdTime);
}

function summarizeComment(message: string) {
  const trimmed = trimNote(message) ?? '';
  if (!trimmed) return 'Imported from Meta comments.';
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed;
}

function getIsoTime(value?: string) {
  return value ? new Date(value).getTime() : 0;
}

const META_COMMENT_LOOKBACK_DAYS = 14;

function isWithinMetaLookbackWindow(createdTime?: string) {
  const createdAtMs = getIsoTime(createdTime);
  if (!createdAtMs) return false;

  const lookbackMs = META_COMMENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  return createdAtMs >= Date.now() - lookbackMs;
}

/**
 * Returns true if the thread has new customer comments that arrived after
 * the operator's last decision on this item.  This is the signal used to
 * resurface a handled comment so the operator can decide whether to respond
 * again — without this, decided items stay resolved.
 */
function hasNewCustomerActivitySinceDecision(
  threadContext: ApprovalThreadContext | undefined,
  decidedAt: string | undefined
): boolean {
  if (!decidedAt || !threadContext?.messages?.length) return false;
  const decidedAtMs = getIsoTime(decidedAt);
  if (!decidedAtMs) return false;

  return threadContext.messages.some(
    (msg) =>
      msg.authorRole === 'customer' &&
      !msg.isCurrent &&
      getIsoTime(msg.createdTime) > decidedAtMs
  );
}

function lowerFirst(value: string) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function dedupeThreadEntries(entries: Array<ApprovalThreadContext['messages'][number]>) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (!entry.id || seen.has(entry.id)) return false;
    seen.add(entry.id);
    return Boolean(entry.message?.trim());
  });
}

function buildThreadContext(params: {
  storyId: string;
  originalComment: string;
  currentCommentId: string;
  currentCreatedTime?: string;
  priorThreadEntries?: RealFacebookThreadEntry[];
  existingReplies?: RealFacebookThreadEntry[];
}) {
  const priorThreadEntries = params.priorThreadEntries ?? [];
  const existingReplies = params.existingReplies ?? [];
  const currentCreatedTime = getIsoTime(params.currentCreatedTime);

  const priorCustomerComments = priorThreadEntries.filter((entry) => entry.authorRole === 'customer');
  const priorPageReplies = [
    ...priorThreadEntries.filter((entry) => entry.authorRole === 'page'),
    ...existingReplies.filter((entry) => entry.authorRole === 'page' && getIsoTime(entry.createdTime) <= currentCreatedTime)
  ];

  const messages = dedupeThreadEntries([
    ...priorThreadEntries.map((entry) => ({
      id: entry.id,
      parentId: entry.parentId,
      message: entry.message,
      createdTime: entry.createdTime,
      authorName: entry.authorName,
      authorRole: entry.authorRole,
      isReply: entry.isReply ?? false,
      isCurrent: false
    })),
    {
      id: params.currentCommentId,
      message: params.originalComment,
      createdTime: params.currentCreatedTime,
      authorRole: 'customer' as const,
      isReply: false,
      isCurrent: true
    },
    ...existingReplies.map((entry) => ({
      id: entry.id,
      parentId: entry.parentId,
      message: entry.message,
      createdTime: entry.createdTime,
      authorName: entry.authorName,
      authorRole: entry.authorRole,
      isReply: entry.isReply ?? true,
      isCurrent: false
    }))
  ]).sort((a, b) => getIsoTime(a.createdTime) - getIsoTime(b.createdTime));

  const summaryParts = [];
  if (priorCustomerComments.length) summaryParts.push(`${priorCustomerComments.length} earlier customer comment${priorCustomerComments.length === 1 ? '' : 's'}`);
  if (priorPageReplies.length) summaryParts.push(`${priorPageReplies.length} prior page repl${priorPageReplies.length === 1 ? 'y' : 'ies'}`);
  if (existingReplies.length) summaryParts.push(`${existingReplies.length} repl${existingReplies.length === 1 ? 'y already on this comment' : 'ies already on this comment'}`);
  if (!summaryParts.length) summaryParts.push('No additional same-post comments or replies were included in the current Meta data');

  return {
    storyId: params.storyId,
    summary: summaryParts.join(' · '),
    priorCustomerCommentCount: priorCustomerComments.length,
    priorPageReplyCount: priorPageReplies.length,
    existingReplyCount: existingReplies.length,
    messages
  } satisfies ApprovalThreadContext;
}

function getSyncedFacebookApprovalStatus(params: {
  existing?: ApprovalItem;
  connection: MetaConnectionStatus;
  hasExistingPageReply: boolean;
  commentHidden?: boolean;
  hasNewThreadActivitySinceDecision?: boolean;
}) {
  const { existing, connection, hasExistingPageReply, commentHidden, hasNewThreadActivitySinceDecision } = params;

  if (commentHidden || hasExistingPageReply) {
    // If there is new customer activity on a thread we already replied to,
    // resurface the item so the operator can decide whether to respond again.
    if (hasNewThreadActivitySinceDecision && existing?.decidedAt) {
      return 'needs-review' as const;
    }
    return existing?.status ?? 'approved';
  }

  if (!existing) {
    return 'draft-ready' as const;
  }

  // Once an item has been decided (approved/rejected), keep that status
  // unless there is new thread activity that warrants re-review.
  if (existing.decidedAt) {
    if (hasNewThreadActivitySinceDecision) {
      return 'needs-review' as const;
    }
    return existing.status;
  }

  return existing.status;
}

function getFacebookActionBlockReason(params: {
  connection: MetaConnectionStatus;
  action: 'approve-reply' | 'change-visibility';
}) {
  const { connection, action } = params;
  if (connection.posting.status === 'ready') {
    return null;
  }

  const actionLabel = action === 'approve-reply'
    ? 'approve this reply for posting'
    : 'change Facebook comment visibility';

  return `Cannot ${actionLabel} because Meta posting/moderation is blocked right now. ${connection.posting.detail}`;
}

function buildContextAwareReply(approval: ApprovalItem, response: string) {
  const context = approval.threadContext;
  if (!context) {
    return response;
  }

  let nextResponse = response.trim();
  const hasPriorExchange = context.priorCustomerCommentCount > 0 || context.priorPageReplyCount > 0;
  const original = getCurrentThreadMessage(approval);
  const intent = classifyCommentIntent(original);
  const shouldStayAnswerFirst = intent === 'product-use' || intent === 'purchase' || intent === 'availability' || intent === 'skeptical' || intent === 'question';

  if (!shouldStayAnswerFirst && hasPriorExchange && !/following up|coming back|adding a bit more context/i.test(nextResponse)) {
    if (/^thanks for the question/i.test(nextResponse)) {
      nextResponse = nextResponse.replace(/^thanks for the question/i, 'Thanks for following up');
    } else if (/^thanks for the comment/i.test(nextResponse)) {
      nextResponse = nextResponse.replace(/^thanks for the comment/i, 'Thanks for following up here');
    } else if (!/^yes\b|^fair question\b|^you can get it\b/i.test(nextResponse)) {
      nextResponse = `Adding a bit more context here — ${lowerFirst(nextResponse)}`;
    }
  }

  if (!shouldStayAnswerFirst && context.existingReplyCount > 0 && !/just to add|to add|adding a bit more context/i.test(nextResponse)) {
    nextResponse = `Just to add to the thread — ${lowerFirst(nextResponse)}`;
  }

  return ensureDirectAnswerFirst(nextResponse, original);
}

/** Cache the Meta Graph result to avoid hitting the API on every 20s dashboard poll. */
const META_SYNC_CACHE_TTL_MS = 90 * 1000; // 90 seconds
let metaSyncCache: { comments: Awaited<ReturnType<typeof listRealFacebookComments>>['comments']; connection: Awaited<ReturnType<typeof listRealFacebookComments>>['connection']; fetchedAt: number } | null = null;

async function getMetaSyncData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && metaSyncCache && (now - metaSyncCache.fetchedAt) < META_SYNC_CACHE_TTL_MS) {
    return { comments: metaSyncCache.comments, connection: metaSyncCache.connection };
  }

  const result = await listRealFacebookComments();
  metaSyncCache = { ...result, fetchedAt: now };
  return result;
}

/** Force the next sync to re-fetch from Meta (called after write actions). */
function invalidateMetaSyncCache() {
  metaSyncCache = null;
}

export async function syncFacebookCommentApprovals() {
  const approvals = await readJsonFile<ApprovalSource>('mission-control-approvals.json');
  const { comments, connection } = await getMetaSyncData();

  const existingByExternalCommentId = new Map(
    approvals.items
      .filter((item) => item.workflowKind === 'facebook-comment' && item.externalCommentId)
      .map((item) => [item.externalCommentId as string, item])
  );

  const recentComments = comments.filter((comment) => isWithinMetaLookbackWindow(comment.createdTime));

  const realItems = recentComments.map((comment) => {
    const existing = existingByExternalCommentId.get(comment.id);
    const threadContext = buildThreadContext({
      storyId: comment.storyId,
      originalComment: comment.message,
      currentCommentId: comment.id,
      currentCreatedTime: comment.createdTime,
      priorThreadEntries: comment.priorThreadEntries,
      existingReplies: comment.existingReplies
    });
    const existingReply = [existing?.replyReadyToPost, existing?.revisedResponse, existing?.suggestedResponse].find((value) => value && !isPlaceholderReply(value));
    const generatedReplyBaseApproval = { ...(existing ?? {}), originalComment: comment.message, threadContext } as ApprovalItem;
    const generatedReply = sentenceTrim(buildContextAwareReply(generatedReplyBaseApproval, generateReplyFromOriginalComment(generatedReplyBaseApproval, {
      approvals: approvals.items,
      includeLearnedStyle: true
    })));
    const defaultReply = existingReply ? existingReply : generatedReply;
    const newThreadActivity = hasNewCustomerActivitySinceDecision(threadContext, existing?.decidedAt);
    const syncedStatus = getSyncedFacebookApprovalStatus({
      existing,
      connection,
      hasExistingPageReply: threadContext.existingReplyCount > 0,
      commentHidden: comment.isHidden,
      hasNewThreadActivitySinceDecision: newThreadActivity
    });
    // When a decided item resurfaces due to new thread activity, clear the
    // decision fields so it properly re-enters the active queue.
    const resurfaced = existing?.decidedAt && newThreadActivity && syncedStatus === 'needs-review';

    return {
      ...existing,
      id: existing?.id ?? makeRealFacebookApprovalId(comment.id),
      title: existing?.title ?? `Reply to Facebook comment · ${comment.adName ?? 'Renuv'}`,
      type: 'Comment reply',
      owner: existing?.owner ?? 'Sammy',
      status: syncedStatus,
      risk: existing?.risk ?? 'medium',
      destination: 'Meta comments',
      summary: existing?.summary ?? summarizeComment(comment.message),
      requestedAt: relativeRequestedAt(comment.createdTime),
      sla: existing?.sla ?? 'Monitor in dashboard',
      decisionOwner: existing?.decisionOwner ?? 'Todd',
      agentId: existing?.agentId ?? 'comment-agent',
      workflowKind: 'facebook-comment' as const,
      channel: 'Facebook',
      account: existing?.account ?? 'Renuv',
      previewEyebrow: 'Original public comment',
      previewTitle: existing?.previewTitle ?? (comment.adName ? `Comment on ${comment.adName}` : 'Imported Meta comment'),
      originalComment: comment.message,
      commentMeta: [
        connection.source === 'graph-live' ? 'Live Meta Graph data' : 'Stored Meta comment snapshot',
        comment.adName,
        threadContext.summary,
        comment.permalinkUrl ? 'permalink available' : null
      ].filter(Boolean).join(' · '),
      responseTitle: existing?.responseTitle ?? 'Reply that will post if approved',
      suggestedResponse: existing?.suggestedResponse ?? defaultReply,
      responseMeta: existing?.responseMeta ?? (connection.source === 'graph-live' ? 'Live Meta thread loaded for context-aware reply' : 'Stored Meta thread loaded for context-aware reply'),
      noPublicReplyRecommended: existing?.noPublicReplyRecommended ?? shouldRecommendNoPublicReply(comment.message),
      decidedAt: resurfaced ? undefined : existing?.decidedAt,
      decisionNote: resurfaced ? 'Resurfaced: new customer activity on this thread.' : existing?.decisionNote,
      operatorFeedback: existing?.operatorFeedback,
      operatorDraft: existing?.operatorDraft,
      revisedResponse: existing?.revisedResponse,
      replyReadyToPost: defaultReply,
      approvedReply: resurfaced ? undefined : existing?.approvedReply,
      revisedAt: existing?.revisedAt,
      revisionCount: existing?.revisionCount,
      lastRevisionState: resurfaced ? 'updated' : existing?.lastRevisionState,
      learningNoteIds: existing?.learningNoteIds,
      externalCommentId: comment.id,
      externalStoryId: comment.storyId,
      externalPermalinkUrl: comment.permalinkUrl,
      liveDataSource: connection.source,
      commentHidden: comment.isHidden,
      threadContext
    } satisfies ApprovalItem;
  });

  // Keep non-Facebook items and also any in-progress Facebook items whose
  // comments have aged out of the 14-day ingestion window so that operator
  // work-in-progress is not silently discarded.
  const syncedCommentIds = new Set(realItems.map((item) => item.externalCommentId));
  const nonSyncedItems = approvals.items.filter((item) => {
    if (!item.externalCommentId || item.workflowKind !== 'facebook-comment') {
      return true;
    }
    // Already covered by the fresh sync
    if (syncedCommentIds.has(item.externalCommentId)) {
      return false;
    }
    // Preserve items the operator was still working on (pending statuses)
    const isPending = item.status === 'needs-review' || item.status === 'draft-ready' || item.status === 'revision-requested';
    return isPending;
  });
  const nextItems = [...realItems, ...nonSyncedItems];
  const changed = JSON.stringify(nextItems) !== JSON.stringify(approvals.items);

  if (changed) {
    approvals.items = nextItems;
    approvals.lastUpdatedAt = new Date().toISOString();
    await writeJsonFile('mission-control-approvals.json', approvals);
  }

  // Push fresh connection into the background worker cache so the next
  // dashboard read (which uses the cached path) sees up-to-date status.
  import('@/lib/meta-sync-worker').then(({ setLastMetaConnection }) => {
    setLastMetaConnection(connection);
  }).catch(() => { /* worker not loaded yet — fine */ });

  return { approvals, connection };
}

/**
 * Read approvals + connection status without triggering a live Meta sync.
 * Used by the dashboard read path so page loads never crawl the Graph API.
 */
export async function readFacebookApprovalsCached(): Promise<{ approvals: ApprovalSource; connection: MetaConnectionStatus }> {
  const { getLastMetaConnection } = await import('@/lib/meta-sync-worker');
  const approvals = await readJsonFile<ApprovalSource>('mission-control-approvals.json');
  const connection = getLastMetaConnection() ?? makeFallbackConnection();
  return { approvals, connection };
}

function makeFallbackConnection(): MetaConnectionStatus {
  return {
    source: 'report-snapshot',
    data: { status: 'ready', detail: 'Cached snapshot — live sync warming up' },
    posting: { status: 'blocked', detail: 'Meta connection warming up — live actions available shortly' },
    tokenPath: '',
    pageId: '',
    checkedAt: new Date().toISOString()
  };
}

export async function getFacebookIntegrationStatus(): Promise<MetaConnectionStatus> {
  const { connection } = await syncFacebookCommentApprovals();
  return connection;
}

export async function updateApprovalDecision(params: {
  id: string;
  decision: 'approve' | 'revise' | 'reject' | 'dismiss' | 'reopen';
  note?: string;
  replyText?: string;
}) {
  const { id, decision } = params;
  const note = trimNote(params.note);
  const replyText = trimNote(params.replyText);
  const [{ approvals, connection }, runtime, registry, activity, auditLog] = await Promise.all([
    syncFacebookCommentApprovals(),
    readJsonFile<RuntimeSource>('mission-control-runtime.json'),
    readJsonFile<AgentRegistryItem[]>('mission-control-agent-registry.json'),
    readJsonFile<ActivityItem[]>('mission-control-activity.json'),
    readAuditLog()
  ]);

  const approvalIndex = approvals.items.findIndex((item) => item.id === id);
  const approval = approvalIndex >= 0 ? approvals.items[approvalIndex] : undefined;
  if (!approval) {
    throw new Error(`Approval item not found: ${id}`);
  }

  const previousStatus = approval.status;
  const dismissedAt = nowIso();
  const isNoReplyItem = isNoPublicReplyApproval(approval);
  const convertNoReplyToReplyWorkflow = decision === 'reject' && isNoReplyItem && approval.workflowKind === 'facebook-comment';

  if (decision === 'dismiss') {
    if (!isNoReplyItem) {
      throw new Error('Dismiss is only available for no-public-reply Facebook commenter items.');
    }

    approvals.items.splice(approvalIndex, 1);
    approvals.lastUpdatedAt = dismissedAt;
  } else if (decision === 'reopen' && approval.workflowKind === 'facebook-comment') {
    const existingReply = getReplyReadyToPost(approval);

    approval.status = existingReply ? 'draft-ready' : 'needs-review';
    approval.decidedAt = undefined;
    approval.approvedReply = undefined;
    approval.lastRevisionState = existingReply ? 'updated' : undefined;
    approval.decisionNote = note ?? 'Reopened resolved comment for review.';
    approval.revisedAt = dismissedAt;
    approvals.lastUpdatedAt = dismissedAt;
  } else if (convertNoReplyToReplyWorkflow) {
    const generatedReply = generateReplyFromOriginalComment(approval);

    approval.type = 'Comment reply';
    approval.title = `Reply to Facebook comment after overriding no-reply recommendation`;
    approval.summary = 'Todd rejected the no-public-reply recommendation and requested a normal public reply workflow for this comment.';
    approval.responseTitle = 'Reply that will post if approved';
    approval.responseMeta = `Reply workflow opened after rejecting no-reply recommendation · ${new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dismissedAt))}`;
    approval.noPublicReplyRecommended = false;
    approval.status = 'draft-ready';
    approval.decidedAt = undefined;
    approval.decisionNote = note ?? 'Rejected the no-reply recommendation and opened a normal reply workflow.';
    approval.lastRevisionState = 'updated';
    approval.approvedReply = undefined;
    approval.revisedAt = dismissedAt;
    approval.revisionCount = Math.max(1, approval.revisionCount ?? 0);
    syncReplyReadyToPost(approval, generatedReply);
    approvals.lastUpdatedAt = dismissedAt;
  } else {
    const statusMap: Record<Exclude<typeof decision, 'dismiss' | 'reopen'>, ApprovalStatus> = {
      approve: 'approved',
      revise: 'revision-requested',
      reject: 'rejected'
    };

    const effectiveReplyReadyToPost = approval.workflowKind === 'facebook-comment' && decision === 'approve'
      ? (replyText ?? getReplyReadyToPost(approval))
      : getReplyReadyToPost(approval);

    if (decision === 'approve' && approval.workflowKind === 'facebook-comment' && !effectiveReplyReadyToPost) {
      throw new Error('No reply is ready to post for this Facebook comment.');
    }

    if (decision === 'approve' && approval.workflowKind === 'facebook-comment') {
      const blockedReason = getFacebookActionBlockReason({
        connection,
        action: 'approve-reply'
      });
      if (blockedReason) {
        throw new Error(blockedReason);
      }

      try {
        await postReplyToFacebookComment({
          commentId: approval.externalCommentId,
          message: effectiveReplyReadyToPost ?? ''
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown Facebook posting error.';
        throw new Error(`Failed to post approved Facebook reply: ${detail}`);
      }
    }

    approval.status = statusMap[decision as Exclude<typeof decision, 'dismiss' | 'reopen'>];
    approval.decidedAt = dismissedAt;
    approval.decisionNote = note;
    approval.lastRevisionState = decision === 'revise' ? 'awaiting-feedback' : approval.lastRevisionState;
    approval.approvedReply = decision === 'approve' ? effectiveReplyReadyToPost : undefined;
    syncReplyReadyToPost(approval, effectiveReplyReadyToPost);
    approvals.lastUpdatedAt = dismissedAt;
  }

  const effectiveReplyReadyToPost = decision === 'dismiss'
    ? getReplyReadyToPost(approval)
    : approval.workflowKind === 'facebook-comment' && decision === 'approve'
      ? (replyText ?? getReplyReadyToPost(approval))
      : getReplyReadyToPost(approval);

  const runtimeAgent = runtime.agents.find((agent) => agent.id === approval.agentId);
  const registryAgent = registry.find((agent) => agent.id === approval.agentId);
  if (runtimeAgent) {
    runtimeAgent.pendingApprovals = convertNoReplyToReplyWorkflow || decision === 'reopen'
      ? Math.max(1, runtimeAgent.pendingApprovals)
      : Math.max(0, runtimeAgent.pendingApprovals - 1);
    runtimeAgent.lastHeartbeat = 'just now';

    if (decision === 'approve') {
      runtimeAgent.status = runtimeAgent.status === 'blocked' ? 'busy' : runtimeAgent.status;
      runtimeAgent.currentTask = `Executing approved work: ${approval.title}`;
      runtimeAgent.focus = approval.workflowKind === 'facebook-comment'
        ? `Posting approved Facebook reply: ${effectiveReplyReadyToPost ?? 'reply ready to post'}`
        : `Delivering ${approval.destination.toLowerCase()} after approval`;
      runtimeAgent.blocker = undefined;
    }

    if (decision === 'revise') {
      runtimeAgent.status = 'busy';
      runtimeAgent.currentTask = approval.workflowKind === 'facebook-comment'
        ? `Preparing fast revision: ${approval.title}`
        : `Revising deliverable: ${approval.title}`;
      runtimeAgent.focus = approval.workflowKind === 'facebook-comment'
        ? 'Turning operator feedback into the reply that will post from Mission Control'
        : `Applying revision feedback for ${approval.destination.toLowerCase()}`;
      runtimeAgent.blocker = note ? `Revision requested: ${note}` : undefined;
    }

    if (decision === 'reject') {
      if (convertNoReplyToReplyWorkflow) {
        runtimeAgent.status = 'online';
        runtimeAgent.currentTask = `Standing by on generated Facebook reply: ${approval.title}`;
        runtimeAgent.focus = 'No-reply recommendation was rejected; a postable Facebook reply is now waiting for steering or approval';
        runtimeAgent.blocker = undefined;
      } else {
        runtimeAgent.status = 'idle';
        runtimeAgent.currentTask = `Waiting for new assignment after rejection: ${approval.title}`;
        runtimeAgent.focus = `Re-prioritizing after rejected ${approval.type.toLowerCase()}`;
        runtimeAgent.blocker = note ? `Rejected by Mission Control: ${note}` : undefined;
      }
    }

    if (decision === 'dismiss') {
      runtimeAgent.status = 'online';
      runtimeAgent.currentTask = `Dismissed no-reply item: ${approval.title}`;
      runtimeAgent.focus = 'No-public-reply item cleared from the dashboard queue';
      runtimeAgent.blocker = undefined;
    }

    if (decision === 'reopen') {
      runtimeAgent.status = 'online';
      runtimeAgent.pendingApprovals = Math.max(1, runtimeAgent.pendingApprovals);
      runtimeAgent.currentTask = `Reopened comment for review: ${approval.title}`;
      runtimeAgent.focus = 'Previously resolved comment returned to the active queue for steering';
      runtimeAgent.blocker = undefined;
    }
  }

  runtime.lastSyncedAt = nowIso();

  const actor = registryAgent?.name ?? approval.owner;
  const summaries: Record<typeof decision, string> = {
    approve: approval.workflowKind === 'facebook-comment'
      ? 'Approved the exact Facebook reply shown in Mission Control and cleared it for posting.'
      : `Approved ${approval.type.toLowerCase()} and cleared it for execution.`,
    revise: approval.workflowKind === 'facebook-comment'
      ? 'Sent the Facebook reply back for a fast revision inside the dedicated commenter lane.'
      : `Requested revisions on ${approval.type.toLowerCase()} before it can move forward.`,
    reject: convertNoReplyToReplyWorkflow
      ? 'Rejected the no-reply recommendation and converted the item into a normal Facebook reply workflow with a postable draft.'
      : `Rejected ${approval.type.toLowerCase()} and sent the work back out of the queue.`,
    dismiss: 'Cleared the no-public-reply recommendation and removed it from the dashboard queue.',
    reopen: 'Reopened a resolved Facebook comment and returned it to the active review queue.'
  };

  activity.unshift({
    id: actionId(decision === 'dismiss' ? 'act-dismiss' : decision === 'reopen' ? 'act-reopen' : 'act-approval'),
    time: nowTimeLabel(),
    actor: 'Mission Control',
    summary: `${approval.decisionOwner} ${summaries[decision]} ${actor} now owns the next step.`,
    object: decision === 'dismiss' || decision === 'reopen' ? `Facebook commenter · ${approval.title}` : `Approval queue · ${approval.title}`
  });

  auditLog.events.unshift({
    id: actionId(decision === 'dismiss' ? 'audit-dismiss' : decision === 'reopen' ? 'audit-reopen' : 'audit-approval'),
    timestamp: dismissedAt,
    actor: 'Mission Control',
    actionKind: decision === 'dismiss' ? 'queue-dismissed' : decision === 'reopen' ? 'approval-decision' : 'approval-decision',
    targetType: 'approval',
    targetId: approval.id,
    targetLabel: approval.title,
    summary: convertNoReplyToReplyWorkflow
      ? `${approval.decisionOwner} rejected the no-reply recommendation and opened a reply workflow for ${approval.title}.`
      : `${approval.decisionOwner} ${sentenceCaseDecision(decision)} ${approval.title}.`,
    detail: decision === 'dismiss'
      ? note
        ? `Removed the no-public-reply item from the local dashboard queue. Previous status: ${previousStatus}. Note: ${note}`
        : `Removed the no-public-reply item from the local dashboard queue. Previous status: ${previousStatus}.`
      : decision === 'reopen'
        ? `Reopened resolved comment and returned it to the active queue. Status moved from ${previousStatus} to ${approval.status}.${note ? ` Note: ${note}` : ''}`
      : convertNoReplyToReplyWorkflow
        ? note
          ? `Rejected the no-public-reply recommendation and converted the item into a normal Facebook reply workflow. Status moved from ${previousStatus} to ${approval.status}. Draft reply ready to post: ${effectiveReplyReadyToPost}. Note: ${note}`
          : `Rejected the no-public-reply recommendation and converted the item into a normal Facebook reply workflow. Status moved from ${previousStatus} to ${approval.status}. Draft reply ready to post: ${effectiveReplyReadyToPost}.`
        : decision === 'approve' && approval.workflowKind === 'facebook-comment'
          ? `Status moved from ${previousStatus} to ${approval.status}. Approved reply: ${effectiveReplyReadyToPost}`
          : note
            ? `Status moved from ${previousStatus} to ${approval.status}. Note: ${note}`
            : `Status moved from ${previousStatus} to ${approval.status}.`,
    metadata: {
      decision,
      previousStatus,
      newStatus: decision === 'dismiss' ? 'removed-from-queue' : approval.status,
      decisionOwner: approval.decisionOwner,
      destination: approval.destination,
      agentId: approval.agentId,
      note: note ?? null,
      replyReadyToPost: effectiveReplyReadyToPost ?? null,
      approvedReply: approval.approvedReply ?? null,
      replyTextOverrideUsed: approval.workflowKind === 'facebook-comment' && decision === 'approve'
        ? Boolean(replyText)
        : false,
      removedFromQueue: decision === 'dismiss',
      convertedNoReplyToReplyWorkflow: convertNoReplyToReplyWorkflow
    }
  });
  auditLog.lastUpdatedAt = dismissedAt;

  await Promise.all([
    writeJsonFile('mission-control-approvals.json', approvals),
    writeJsonFile('mission-control-runtime.json', runtime),
    writeJsonFile('mission-control-activity.json', activity.slice(0, MAX_ACTIVITY_ITEMS)),
    writeJsonFile('mission-control-audit-log.json', {
      ...auditLog,
      events: auditLog.events.slice(0, MAX_AUDIT_EVENTS)
    })
  ]);

  invalidateMetaSyncCache();
  return approval;
}


export async function updateFacebookCommentVisibility(params: {
  id: string;
  hidden: boolean;
  note?: string;
}) {
  const { id, hidden } = params;
  const note = trimNote(params.note);
  const [{ approvals, connection }, runtime, registry, activity, auditLog] = await Promise.all([
    syncFacebookCommentApprovals(),
    readJsonFile<RuntimeSource>('mission-control-runtime.json'),
    readJsonFile<AgentRegistryItem[]>('mission-control-agent-registry.json'),
    readJsonFile<ActivityItem[]>('mission-control-activity.json'),
    readAuditLog()
  ]);

  const approval = approvals.items.find((item) => item.id === id);
  if (!approval) {
    throw new Error(`Approval item not found: ${id}`);
  }

  if (approval.workflowKind !== 'facebook-comment') {
    throw new Error('Hide comment is only available for Facebook commenter items.');
  }

  const blockedReason = getFacebookActionBlockReason({
    connection,
    action: 'change-visibility'
  });
  if (blockedReason) {
    throw new Error(blockedReason);
  }

  await setFacebookCommentHidden({
    commentId: approval.externalCommentId,
    hidden
  });

  const changedAt = nowIso();
  approval.commentHidden = hidden;
  approvals.lastUpdatedAt = changedAt;

  const runtimeAgent = runtime.agents.find((agent) => agent.id === approval.agentId);
  const registryAgent = registry.find((agent) => agent.id === approval.agentId);

  if (runtimeAgent) {
    runtimeAgent.lastHeartbeat = 'just now';
    runtimeAgent.status = runtimeAgent.status === 'blocked' ? 'blocked' : 'online';
    runtimeAgent.currentTask = hidden
      ? `Comment hidden from Mission Control: ${approval.title}`
      : `Comment restored in Mission Control: ${approval.title}`;
    runtimeAgent.focus = hidden
      ? 'Moderator action completed and audit trail updated'
      : 'Moderator action reversed and audit trail updated';
  }
  runtime.lastSyncedAt = changedAt;

  const agentName = registryAgent?.name ?? approval.owner;
  activity.unshift({
    id: actionId(hidden ? 'act-comment-hide' : 'act-comment-unhide'),
    time: nowTimeLabel(),
    actor: 'Mission Control',
    summary: `${approval.decisionOwner} ${hidden ? 'hid' : 'unhid'} a Facebook comment. ${agentName} now sees the moderation action in the dashboard history.`,
    object: `Facebook commenter · ${approval.title}`
  });

  auditLog.events.unshift({
    id: actionId(hidden ? 'audit-comment-hide' : 'audit-comment-unhide'),
    timestamp: changedAt,
    actor: 'Mission Control',
    actionKind: 'comment-visibility',
    targetType: 'approval',
    targetId: approval.id,
    targetLabel: approval.title,
    summary: `${approval.decisionOwner} ${hidden ? 'hid' : 'unhid'} the public Facebook comment for ${approval.title}.`,
    detail: note
      ? `${hidden ? 'Set' : 'Cleared'} Meta comment visibility via /${approval.externalCommentId}?is_hidden=${hidden ? 'true' : 'false'}. Note: ${note}`
      : `${hidden ? 'Set' : 'Cleared'} Meta comment visibility via /${approval.externalCommentId}?is_hidden=${hidden ? 'true' : 'false'}.`,
    metadata: {
      agentId: approval.agentId,
      decisionOwner: approval.decisionOwner,
      externalCommentId: approval.externalCommentId ?? null,
      hidden,
      note: note ?? null,
      graphPath: approval.externalCommentId ? `/${approval.externalCommentId}?is_hidden=${hidden ? 'true' : 'false'}` : null
    }
  });
  auditLog.lastUpdatedAt = changedAt;

  await Promise.all([
    writeJsonFile('mission-control-approvals.json', approvals),
    writeJsonFile('mission-control-runtime.json', runtime),
    writeJsonFile('mission-control-activity.json', activity.slice(0, MAX_ACTIVITY_ITEMS)),
    writeJsonFile('mission-control-audit-log.json', {
      ...auditLog,
      events: auditLog.events.slice(0, MAX_AUDIT_EVENTS)
    })
  ]);

  invalidateMetaSyncCache();
  return approval;
}

export async function submitFacebookCommentRevision(params: {
  id: string;
  feedback?: string;
  operatorDraft?: string;
}) {
  const { id } = params;
  const feedback = trimNote(params.feedback);
  const operatorDraft = trimNote(params.operatorDraft);

  if (!feedback && !operatorDraft) {
    throw new Error('Feedback or an operator draft is required.');
  }

  const [{ approvals: approvalsSource }, runtime, registry, activity, auditLog, guidanceSource] = await Promise.all([
    syncFacebookCommentApprovals(),
    readJsonFile<RuntimeSource>('mission-control-runtime.json'),
    readJsonFile<AgentRegistryItem[]>('mission-control-agent-registry.json'),
    readJsonFile<ActivityItem[]>('mission-control-activity.json'),
    readAuditLog(),
    readCommentGuidance()
  ]);

  const normalizedState = normalizeGuidanceState({
    approvals: approvalsSource,
    guidance: guidanceSource
  });
  const approvals = normalizedState.approvals;
  const guidance = normalizedState.guidance;

  const approval = approvals.items.find((item) => item.id === id);
  if (!approval) {
    throw new Error(`Approval item not found: ${id}`);
  }

  if (approval.workflowKind !== 'facebook-comment') {
    throw new Error('Fast revision is only available for Facebook commenter items.');
  }

  const runtimeAgent = runtime.agents.find((agent) => agent.id === approval.agentId);
  const registryAgent = registry.find((agent) => agent.id === approval.agentId);
  const revisedAt = nowIso();
  const previousReplyReadyToPost = getReplyReadyToPost(approval);
  const guidanceRules = buildGuidanceRules(feedback, operatorDraft);
  const guidanceIds: string[] = [];

  for (const rule of guidanceRules) {
    const normalizedRule = normalizeText(rule);
    const existing = guidance.items.find((item) => normalizeText(item.rule) === normalizedRule && item.agentId === approval.agentId);

    if (existing) {
      existing.lastAppliedAt = revisedAt;
      existing.timesApplied += 1;
      guidanceIds.push(existing.id);
      continue;
    }

    const newGuidance = {
      id: actionId('guide'),
      agentId: approval.agentId,
      approvalId: approval.id,
      rule,
      createdAt: revisedAt,
      lastAppliedAt: revisedAt,
      timesApplied: 1
    } satisfies CommentGuidanceItem;

    guidance.items.unshift(newGuidance);
    guidanceIds.push(newGuidance.id);
  }

  const revisedResponse = buildRevisedResponse({
    approval,
    feedback,
    operatorDraft,
    guidanceRules,
    approvals: approvals.items
  });
  const normalizedPreviousReply = previousReplyReadyToPost ? normalizeText(previousReplyReadyToPost) : '';
  const normalizedRevisedReply = normalizeText(revisedResponse);

  if (feedback && !operatorDraft && normalizedPreviousReply && normalizedPreviousReply === normalizedRevisedReply) {
    throw new Error('Operator steering did not produce a new postable reply yet. The steering is still in the input — refine it or use Replacement copy for exact wording.');
  }

  approval.status = 'draft-ready';
  syncReplyReadyToPost(approval, revisedResponse);
  approval.revisedAt = revisedAt;
  approval.operatorFeedback = undefined;
  approval.operatorDraft = undefined;
  approval.approvedReply = undefined;
  approval.revisionCount = (approval.revisionCount ?? 0) + 1;
  approval.lastRevisionState = 'updated';
  approval.learningNoteIds = guidanceIds;
  approval.responseTitle = 'Reply that will post if approved';
  approval.responseMeta = `Postable reply updated from operator steer · ${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(revisedAt))}`;
  approval.decidedAt = undefined;
  approval.decisionNote = feedback ?? operatorDraft ?? approval.decisionNote;
  approvals.lastUpdatedAt = revisedAt;

  guidance.history.unshift({
    id: actionId('feedback'),
    approvalId: approval.id,
    feedback: feedback ?? 'Operator supplied a direct replacement draft.',
    operatorDraft,
    revisedResponse,
    createdAt: revisedAt,
    guidanceIds
  });
  guidance.lastUpdatedAt = revisedAt;

  if (runtimeAgent) {
    runtimeAgent.status = 'online';
    runtimeAgent.currentTask = `Standing by on revised Facebook reply: ${approval.title}`;
    runtimeAgent.focus = 'Reply that will post is updated and waiting for approval';
    runtimeAgent.lastHeartbeat = 'just now';
    runtimeAgent.pendingApprovals = Math.max(1, runtimeAgent.pendingApprovals);
    runtimeAgent.blocker = undefined;
  }
  runtime.lastSyncedAt = revisedAt;

  const agentName = registryAgent?.name ?? approval.owner;
  activity.unshift({
    id: actionId('act-comment-revision'),
    time: nowTimeLabel(),
    actor: 'Mission Control',
    summary: `${agentName} updated the reply that will post inside Mission Control using the latest operator steer.`,
    object: `Facebook commenter · ${approval.title}`
  });

  auditLog.events.unshift({
    id: actionId('audit-comment-revision'),
    timestamp: revisedAt,
    actor: 'Mission Control',
    actionKind: 'comment-revision',
    targetType: 'approval',
    targetId: approval.id,
    targetLabel: approval.title,
    summary: `Fast revision completed for ${approval.title}.`,
    detail: feedback
      ? `Captured operator feedback and updated the reply that will post in the Facebook commenter lane. Feedback: ${feedback}`
      : 'Captured an operator replacement draft and updated the reply that will post in the Facebook commenter lane.',
    metadata: {
      agentId: approval.agentId,
      revisionCount: approval.revisionCount ?? 1,
      guidanceApplied: guidanceIds.length,
      hasOperatorDraft: Boolean(operatorDraft),
      replyReadyToPost: approval.replyReadyToPost ?? null
    }
  });

  if (guidanceIds.length) {
    auditLog.events.unshift({
      id: actionId('audit-feedback-guidance'),
      timestamp: revisedAt,
      actor: 'Mission Control',
      actionKind: 'feedback-captured',
      targetType: 'guidance',
      targetId: guidanceIds[0],
      targetLabel: `${approval.owner} guidance`,
      summary: `Saved ${guidanceIds.length} reusable Facebook reply guidance note${guidanceIds.length === 1 ? '' : 's'}.`,
      detail: `Operator feedback is now stored locally and can be shown as reusable guidance for future comment replies.`,
      metadata: {
        approvalId: approval.id,
        guidanceIds: guidanceIds.join(', ')
      }
    });
  }

  auditLog.lastUpdatedAt = revisedAt;

  await Promise.all([
    writeJsonFile('mission-control-approvals.json', approvals),
    writeJsonFile('mission-control-runtime.json', runtime),
    writeJsonFile('mission-control-activity.json', activity.slice(0, MAX_ACTIVITY_ITEMS)),
    writeJsonFile('mission-control-audit-log.json', {
      ...auditLog,
      events: auditLog.events.slice(0, MAX_AUDIT_EVENTS)
    }),
    writeJsonFile('mission-control-comment-guidance.json', {
      ...guidance,
      items: guidance.items.slice(0, 30),
      history: guidance.history.slice(0, MAX_GUIDANCE_HISTORY)
    })
  ]);

  invalidateMetaSyncCache();
  return {
    approval,
    guidance: guidanceIds
  };
}

export async function updateAgentModel(params: { id: string; model: string }) {
  const { id, model } = params;
  const [registry, runtime, activity, auditLog] = await Promise.all([
    readJsonFile<AgentRegistryItem[]>('mission-control-agent-registry.json'),
    readJsonFile<RuntimeSource>('mission-control-runtime.json'),
    readJsonFile<ActivityItem[]>('mission-control-activity.json'),
    readAuditLog()
  ]);

  const agent = registry.find((item) => item.id === id);
  if (!agent) {
    throw new Error(`Agent not found: ${id}`);
  }

  const previousModel = agent.model;
  agent.model = model;

  const runtimeAgent = runtime.agents.find((item) => item.id === id);
  if (runtimeAgent) {
    runtimeAgent.lastHeartbeat = 'just now';
    runtimeAgent.focus = `Running on ${model}`;
    if (runtimeAgent.status === 'idle') {
      runtimeAgent.status = 'online';
    }
  }

  runtime.lastSyncedAt = nowIso();

  activity.unshift({
    id: actionId('act-model'),
    time: nowTimeLabel(),
    actor: 'Mission Control',
    summary: `Changed ${agent.name} from ${previousModel} to ${model}.`,
    object: 'Agent runtime control'
  });

  auditLog.events.unshift({
    id: actionId('audit-model'),
    timestamp: nowIso(),
    actor: 'Mission Control',
    actionKind: 'model-change',
    targetType: 'agent',
    targetId: agent.id,
    targetLabel: agent.name,
    summary: `Changed ${agent.name} from ${previousModel} to ${model}.`,
    detail: `${agent.role} is now configured to run on ${model}.`,
    metadata: {
      previousModel,
      newModel: model,
      provider: agent.provider
    }
  });
  auditLog.lastUpdatedAt = nowIso();

  await Promise.all([
    writeJsonFile('mission-control-agent-registry.json', registry),
    writeJsonFile('mission-control-runtime.json', runtime),
    writeJsonFile('mission-control-activity.json', activity.slice(0, MAX_ACTIVITY_ITEMS)),
    writeJsonFile('mission-control-audit-log.json', {
      ...auditLog,
      events: auditLog.events.slice(0, MAX_AUDIT_EVENTS)
    })
  ]);

  return agent;
}

export async function stopAgentTask(params: { id: string }) {
  const { id } = params;
  const [registry, runtime, activity, auditLog] = await Promise.all([
    readJsonFile<AgentRegistryItem[]>('mission-control-agent-registry.json'),
    readJsonFile<RuntimeSource>('mission-control-runtime.json'),
    readJsonFile<ActivityItem[]>('mission-control-activity.json'),
    readAuditLog()
  ]);

  const agent = registry.find((item) => item.id === id);
  const runtimeAgent = runtime.agents.find((item) => item.id === id);

  if (!agent || !runtimeAgent) {
    throw new Error(`Runtime agent not found: ${id}`);
  }

  const stoppedTask = runtimeAgent.currentTask;
  runtimeAgent.status = 'idle';
  runtimeAgent.currentTask = 'Task stopped by Mission Control. Awaiting reassignment.';
  runtimeAgent.focus = 'Paused for operator intervention and re-prioritization';
  runtimeAgent.blocker = 'Manual stop issued from Mission Control';
  runtimeAgent.lastHeartbeat = 'just now';
  runtime.lastSyncedAt = nowIso();

  activity.unshift({
    id: actionId('act-stop'),
    time: nowTimeLabel(),
    actor: 'Mission Control',
    summary: `Stopped ${agent.name}'s active task and parked the agent for reassignment. Previous task: ${stoppedTask}`,
    object: 'Agent runtime control'
  });

  auditLog.events.unshift({
    id: actionId('audit-stop'),
    timestamp: nowIso(),
    actor: 'Mission Control',
    actionKind: 'stop-task',
    targetType: 'agent',
    targetId: agent.id,
    targetLabel: agent.name,
    summary: `Stopped ${agent.name}'s current task.`,
    detail: `Previous task: ${stoppedTask}`,
    metadata: {
      previousTask: stoppedTask,
      resultingStatus: runtimeAgent.status
    }
  });
  auditLog.lastUpdatedAt = nowIso();

  await Promise.all([
    writeJsonFile('mission-control-runtime.json', runtime),
    writeJsonFile('mission-control-activity.json', activity.slice(0, MAX_ACTIVITY_ITEMS)),
    writeJsonFile('mission-control-audit-log.json', {
      ...auditLog,
      events: auditLog.events.slice(0, MAX_AUDIT_EVENTS)
    })
  ]);

  return runtimeAgent;
}
