import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let runsDir = '';
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  process.env.LANE_MARKER = 'TEST-MARKER';
  runsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rig-digest-'));
  fs.copyFileSync(path.join('runs', '2026-10-28.jsonl'), path.join(runsDir, '2026-10-28.jsonl'));
  fs.writeFileSync(path.join(runsDir, '2026-10-30.jsonl'), '');
  app = createApp({
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir,
  });
});

afterAll(() => {
  fs.rmSync(runsDir, { recursive: true, force: true });
});

type Row = { job: string };
type Digest = { night: string; rows: Row[]; badLines: number };

describe('digest page', () => {
  it('renders one row per job, with — for a null owner', async () => {
    const res = await app.request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('fixtures/refresh');
    expect(html).toContain('notes/backup');
    expect(html).toContain('digest/render');
    expect(html).toContain('—');
  });

  it('marks rows with retries>=3 or a failed last status as warn', async () => {
    const html = await (await app.request('/digest/2026-10-28')).text();
    expect(html).toMatch(/class="[^"]*\bwarn\b[^"]*"/);
  });

  it('reports bad lines', async () => {
    const html = await (await app.request('/digest/2026-10-28')).text();
    expect(html).toContain('1 bad line');
  });

  it('says nothing ran for an empty night', async () => {
    const res = await app.request('/digest/2026-10-30');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('404s for a night with no file', async () => {
    expect((await app.request('/digest/2026-01-01')).status).toBe(404);
  });

  it('404s for a malformed night', async () => {
    expect((await app.request('/digest/abc')).status).toBe(404);
  });
});

describe('digest json', () => {
  it('returns sorted rows and the bad line count', async () => {
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Digest;
    expect(body.night).toBe('2026-10-28');
    expect(body.rows.length).toBe(5);
    expect(body.badLines).toBe(1);
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual([...jobs].sort());
  });

  it('returns no rows for an empty night', async () => {
    const res = await app.request('/api/digest/2026-10-30');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Digest;
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('404s for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-01-01')).status).toBe(404);
  });
});

describe('page and json agree', () => {
  it('lists jobs in the same order', async () => {
    const html = await (await app.request('/digest/2026-10-28')).text();
    const body = (await (await app.request('/api/digest/2026-10-28')).json()) as Digest;
    let last = -1;
    for (const { job } of body.rows) {
      const at = html.indexOf(job);
      expect(at).toBeGreaterThan(last);
      last = at;
    }
  });
});
