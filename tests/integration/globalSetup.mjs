import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startPostgres } from './postgres.mjs';
import { startShim } from './supabase-shim.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default async function setup() {
  const pgInst = startPostgres(root);
  // grants must exist for tables created by migrations (default privileges cover them); also expose to tests
  const shim = await startShim({ databaseUrl: pgInst.url });
  globalThis.__LIFEOS_IT__ = { pgInst, shim };
  process.env.IT_SUPABASE_URL = shim.url;
  process.env.IT_DATABASE_URL = pgInst.url;
}
