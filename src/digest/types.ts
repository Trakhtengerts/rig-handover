// One row per job in a night's run log. Section 2 imports this signature.
export type RunStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type NightDigest = {
  rows: DigestRow[];
  badLines: number;
};

// null when runs/<night>.jsonl is not on disk. A line that does not parse is counted.
export { readNight } from './read.js';
