import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Starts a throw-away PostgreSQL cluster, applies a Supabase-like stub plus every migration, returns its URL. */
export function startPostgres(root) {
  const bins = fs.readdirSync('/usr/lib/postgresql').map((v) => `/usr/lib/postgresql/${v}/bin`).filter((d) => fs.existsSync(`${d}/initdb`));
  if (!bins.length) throw new Error('PostgreSQL server binaries not found (apt install postgresql).');
  const bin = bins.sort().pop();
  const data = fs.mkdtempSync('/var/tmp/lifeos-pg-');
  const port = 55000 + Math.floor(Math.random() * 900);
  const asRoot = process.getuid?.() === 0;
  if (asRoot) {
    try { execFileSync('id', ['pgtest']); } catch { execFileSync('useradd', ['-m', 'pgtest']); }
    fs.chownSync(data, Number(execFileSync('id', ['-u', 'pgtest']).toString()), Number(execFileSync('id', ['-g', 'pgtest']).toString()));
  }
  const run = (cmd) => (asRoot ? execFileSync('su', ['pgtest', '-c', cmd], { stdio: 'pipe' }) : execFileSync('sh', ['-c', cmd], { stdio: 'pipe' }));
  run(`${bin}/initdb -D ${data} -A trust >/dev/null`);
  run(`${bin}/pg_ctl -D ${data} -o '-p ${port} -k /var/tmp' -l ${data}/log -w start >/dev/null`);
  const psql = (file) => {
    const r = spawnSync(`${bin}/psql`, ['-h', '/var/tmp', '-p', String(port), '-U', asRoot ? 'pgtest' : process.env.USER ?? 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-f', file], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`psql ${file} failed:\n${r.stderr}`);
  };
  psql(path.join(root, 'tests/integration/supabase-stub.sql'));
  for (const f of fs.readdirSync(path.join(root, 'supabase/migrations')).sort()) psql(path.join(root, 'supabase/migrations', f));
  return {
    url: `postgres://${asRoot ? 'pgtest' : process.env.USER ?? 'postgres'}@127.0.0.1:${port}/postgres`,
    stop: () => {
      try { run(`${bin}/pg_ctl -D ${data} -m immediate stop >/dev/null`); } catch {}
      fs.rmSync(data, { recursive: true, force: true });
    },
  };
}
