/**
 * Server-only fetch functions for notes data
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { RenuvNotesPageSnapshot } from './renuv-notes';

const NOTES_FILE = '/Users/augustbot/.openclaw/workspace/mission-control/data/renuv-notes.json';

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  const dir = dirname(NOTES_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Initialize notes file with seed data if it doesn't exist
 */
const emptyNotesSnapshot: RenuvNotesPageSnapshot = {
  brand: 'Renuv',
  periodLabel: new Date().toISOString().split('T')[0],
  environment: 'internal',
  recentNotes: [],
  nextActions: [],
  recentDecisions: []
};

function initializeNotesFile() {
  ensureDataDir();
  if (!existsSync(NOTES_FILE)) {
    writeFileSync(NOTES_FILE, JSON.stringify(emptyNotesSnapshot, null, 2), 'utf8');
    console.log('[initializeNotesFile] Created empty notes file');
  }
}

/**
 * Fetch notes snapshot from JSON file
 */
export async function fetchNotesSnapshot(): Promise<RenuvNotesPageSnapshot> {
  try {
    initializeNotesFile();
    const content = readFileSync(NOTES_FILE, 'utf8');
    const data = JSON.parse(content) as RenuvNotesPageSnapshot;
    return data;
  } catch (error) {
    console.error('[fetchNotesSnapshot] Failed to read notes file:', error);
    return emptyNotesSnapshot;
  }
}

/**
 * Save notes snapshot to JSON file
 */
export async function saveNotesSnapshot(snapshot: RenuvNotesPageSnapshot): Promise<void> {
  try {
    ensureDataDir();
    writeFileSync(NOTES_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
    console.log('[saveNotesSnapshot] Saved notes to file');
  } catch (error) {
    console.error('[saveNotesSnapshot] Failed to save notes:', error);
    throw error;
  }
}
