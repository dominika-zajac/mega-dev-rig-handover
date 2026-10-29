import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { readNight } from './digest/read.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type NightSummary = { night: string; ok: number; retry: number; fail: number; badLines: number };

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightSummary[];
};

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((n) => summarize(config.runsDir, n)),
  };
}

// Counts are per job, by each job's last status.
function summarize(runsDir: string, night: string): NightSummary {
  const data = readNight(runsDir, night);
  const rows = data?.rows ?? [];
  return {
    night,
    ok: rows.filter((r) => r.lastStatus === 'ok').length,
    retry: rows.filter((r) => r.lastStatus === 'retry').length,
    fail: rows.filter((r) => r.lastStatus === 'fail').length,
    badLines: data?.badLines ?? 0,
  };
}
