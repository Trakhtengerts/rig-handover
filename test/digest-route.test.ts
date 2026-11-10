import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { NightDigest } from '../src/digest/types.js';

const made: string[] = [];

function tempRuns(): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  made.push(dir);
  return dir;
}

afterEach(() => {
  while (made.length > 0) {
    const dir = made.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function app(runsDir: string) {
  return createApp({
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir,
  });
}

describe('digest routes', () => {
  it('returns 200 and the same jobs in the same order for the page and the JSON', async () => {
    const dir = tempRuns();
    writeFileSync(
      join(dir, '2026-10-03.jsonl'),
      [
        '{"at":"2026-10-03T03:00:00+01:00","job":"rig/rotate-logs","status":"ok","owner":"lane-07"}',
        '{"at":"2026-10-03T01:00:00+01:00","job":"digest/render","status":"fail","owner":null,"error":"quota exceeded"}',
        '',
      ].join('\n'),
    );
    const page = await app(dir).request('/digest/2026-10-03');
    const json = await app(dir).request('/api/digest/2026-10-03');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const html = await page.text();
    const body = (await json.json()) as NightDigest;
    const jobs = body.rows.map((row) => row.job);
    expect(jobs).toEqual(['digest/render', 'rig/rotate-logs']);
    let at = 0;
    for (const job of jobs) {
      const found = html.indexOf(`<td>${job}</td>`, at);
      expect(found).toBeGreaterThanOrEqual(0);
      at = found + job.length;
    }
    expect(body.rows[0]?.owner).toBeNull();
    expect(html).toContain('\u2014');
    expect(html).toContain('class="warn"');
    expect(html).not.toContain('nothing ran');
  });

  it('returns 404 when the night file is missing', async () => {
    const dir = tempRuns();
    expect((await app(dir).request('/digest/2026-01-01')).status).toBe(404);
    expect((await app(dir).request('/api/digest/2026-01-01')).status).toBe(404);
  });

  it('renders nothing ran for an empty night', async () => {
    const dir = tempRuns();
    writeFileSync(join(dir, '2026-10-01.jsonl'), '');
    const page = await app(dir).request('/digest/2026-10-01');
    const json = await app(dir).request('/api/digest/2026-10-01');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('nothing ran');
    expect(html).not.toContain('<table');
    expect(await json.json()).toEqual({ rows: [], badLines: 0 });
  });

  it('renders a night with a bad line', async () => {
    const dir = tempRuns();
    writeFileSync(
      join(dir, '2026-10-02.jsonl'),
      '{"at":"2026-10-02T01:00:00+01:00","job":"lane/sync","status":"ok","owner":"rook"}\n{"at":"2026-10-02T05:59:58+01:00","job":"lane/sy\n',
    );
    const page = await app(dir).request('/digest/2026-10-02');
    const json = await app(dir).request('/api/digest/2026-10-02');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const html = await page.text();
    const body = (await json.json()) as NightDigest;
    expect(body.badLines).toBe(1);
    expect(body.rows.map((row) => row.job)).toEqual(['lane/sync']);
    expect(html).toContain('<td>lane/sync</td>');
    expect(html).toContain('1 unreadable');
    expect(html).not.toContain('nothing ran');
  });
});
