import { appendFile, mkdir, readFile, writeFile, open, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_FILE = path.join(directory, 'logs', 'reports', 'reports.jsonl');
const RESOLVED_FILE = path.join(directory, 'logs', 'reports', 'resolved.json');
const BLOCK_LIST_FILE = path.join(directory, 'logs', 'reports', 'block-list.json');
const MAX_REPORTS_READ_BYTES = 2 * 1024 * 1024;
let writeQueue = Promise.resolve();

async function ensureDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

// ── Reports ──────────────────────────────────────────────────────────────────

export function appendReport(entry) {
  const write = writeQueue.then(async () => {
    await ensureDir(REPORTS_FILE);
    await appendFile(REPORTS_FILE, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', flag: 'a' });
  });
  writeQueue = write.then(() => undefined, () => undefined);
  return write;
}

export async function readResolvedMap() {
  try {
    const raw = await readFile(RESOLVED_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export async function resolveReport(reportId, resolution = {}) {
  const current = await readResolvedMap();
  current[reportId] = {
    resolvedAt: new Date().toISOString(),
    ...resolution
  };
  await ensureDir(RESOLVED_FILE);
  await writeFile(RESOLVED_FILE, JSON.stringify(current, null, 2), 'utf8');
  return current[reportId];
}

export async function readRecentReports(limit = 200) {
  let fileStats;
  try {
    fileStats = await stat(REPORTS_FILE);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (fileStats.size === 0) return [];

  const start = Math.max(0, fileStats.size - MAX_REPORTS_READ_BYTES);
  const length = fileStats.size - start;
  const file = await open(REPORTS_FILE, constants.O_RDONLY);
  let contents;
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await file.read(buffer, 0, length, start);
    contents = buffer.toString('utf8', 0, bytesRead);
  } finally {
    await file.close();
  }

  const lines = contents.split(/\r?\n/);
  if (start > 0) lines.shift();

  const reports = [];
  for (let i = lines.length - 1; i >= 0 && reports.length < limit; i--) {
    if (!lines[i]) continue;
    try { reports.push(JSON.parse(lines[i])); } catch { /* skip */ }
  }

  const resolvedMap = await readResolvedMap().catch(() => ({}));
  for (const report of reports) {
    if (resolvedMap[report.id]) {
      report.resolved = true;
      report.resolution = resolvedMap[report.id];
    }
  }

  return reports;
}

// ── Block list ────────────────────────────────────────────────────────────────

export async function readBlockList() {
  try {
    const raw = await readFile(BLOCK_LIST_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function saveBlockList(list) {
  await ensureDir(BLOCK_LIST_FILE);
  await writeFile(BLOCK_LIST_FILE, JSON.stringify(list, null, 2), 'utf8');
}

export async function addToBlockList(word) {
  const current = await readBlockList();
  const normalised = word.trim().toLowerCase();
  if (!normalised || current.includes(normalised)) return current;
  const updated = [...current, normalised].sort();
  await saveBlockList(updated);
  return updated;
}

export async function removeFromBlockList(word) {
  const current = await readBlockList();
  const normalised = word.trim().toLowerCase();
  const updated = current.filter((w) => w !== normalised);
  await saveBlockList(updated);
  return updated;
}
