import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { readNight } from './digest/types.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type NightOnDisk = {
  night: string;
  ok: number;
  retry: number;
  fail: number;
};

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightOnDisk[];
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

function nightSummary(runsDir: string, night: string): NightOnDisk {
  const digest = readNight(runsDir, night);
  let ok = 0;
  let retry = 0;
  let fail = 0;
  for (const row of digest?.rows ?? []) {
    if (row.lastStatus === 'ok') ok += 1;
    else if (row.lastStatus === 'retry') retry += 1;
    else fail += 1;
  }
  return { night, ok, retry, fail };
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((night) => nightSummary(config.runsDir, night)),
  };
}
