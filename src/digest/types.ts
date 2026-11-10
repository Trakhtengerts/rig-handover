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

// null when runs/<night>.jsonl is not on disk.
export function readNight(runsDir: string, night: string): NightDigest | null {
  void runsDir;
  void night;
  throw new Error('readNight is not implemented');
}
