/**
 * A tiny Supabase stand-in for integration tests: GoTrue-style auth + PostgREST-style REST over a REAL
 * PostgreSQL database that has the project's migrations applied. Every request runs as the `authenticated`
 * role with `request.jwt.claim.sub` set, so Row Level Security and the sync triggers are genuinely exercised.
 * It implements only what the app uses (auth password flows, select/upsert/patch, rpc).
 */
import http from 'node:http';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const SECRET = 'integration-test-secret';

export async function startShim({ databaseUrl, port = 0, confirmEmail = false }) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 8 });
  const q = (sql, args) => pool.query(sql, args);

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };
  const session = (user) => {
    const access_token = jwt.sign({ sub: user.id, role: 'authenticated', email: user.email }, SECRET, { expiresIn: '1h' });
    const refresh_token = jwt.sign({ sub: user.id, typ: 'refresh' }, SECRET, { expiresIn: '30d' });
    return { access_token, refresh_token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, user_metadata: user.raw_user_meta_data ?? {}, app_metadata: {}, created_at: new Date().toISOString() } };
  };

  const identOk = /^[a-z_][a-z0-9_]*$/;
  const parseFilters = (url) => {
    const where = [];
    const vals = [];
    for (const [k, v] of url.searchParams) {
      if (['select', 'order', 'limit', 'on_conflict', 'columns'].includes(k)) continue;
      const m = v.match(/^(eq|gt|gte|lt|lte)\.(.*)$/);
      if (!m || !identOk.test(k)) throw Object.assign(new Error(`unsupported filter ${k}=${v}`), { status: 400 });
      vals.push(m[2]);
      where.push(`"${k}" ${{ eq: '=', gt: '>', gte: '>=', lt: '<', lte: '<=' }[m[1]]} $${vals.length}`);
    }
    return { where: where.length ? `where ${where.join(' and ')}` : '', vals };
  };

  const asUser = async (userId, fn) => {
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query(`set local role ${userId ? 'authenticated' : 'anon'}`);
      await c.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? '']);
      const out = await fn(c);
      await c.query('commit');
      return out;
    } catch (e) {
      await c.query('rollback').catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  };

  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    const body = raw ? JSON.parse(raw) : undefined;
    const url = new URL(req.url, 'http://x');
    const path = url.pathname;
    try {
      // Test-only: run SQL as superuser so tests can assert on what is really in the database.
      if (path === '/__sql' && req.method === 'POST') {
        const r = await q(body.sql, body.args ?? []);
        return send(res, 200, r.rows);
      }

      // ---------------- Auth ----------------
      if (path === '/auth/v1/signup' && req.method === 'POST') {
        const { email, password, data } = body;
        const exists = await q('select 1 from auth.users where lower(email) = lower($1)', [email]);
        if (exists.rowCount) return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
        if (!password || password.length < 6) return send(res, 422, { code: 422, error_code: 'weak_password', msg: 'Password should be at least 6 characters.' });
        const r = await q(`insert into auth.users (email, raw_user_meta_data, encrypted_password) values ($1, $2, crypt($3, gen_salt('bf'))) returning id, email, raw_user_meta_data`, [email, JSON.stringify(data ?? {}), password]);
        if (confirmEmail) return send(res, 200, { id: r.rows[0].id, email, aud: 'authenticated', user_metadata: data ?? {}, app_metadata: {}, created_at: new Date().toISOString() });
        return send(res, 200, session(r.rows[0]));
      }
      if (path === '/auth/v1/token' && req.method === 'POST') {
        const grant = url.searchParams.get('grant_type');
        if (grant === 'password') {
          const r = await q(`select id, email, raw_user_meta_data from auth.users where lower(email) = lower($1) and encrypted_password = crypt($2, encrypted_password)`, [body.email, body.password]);
          if (!r.rowCount) return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
          return send(res, 200, session(r.rows[0]));
        }
        if (grant === 'refresh_token') {
          const claims = jwt.verify(body.refresh_token, SECRET);
          const r = await q('select id, email, raw_user_meta_data from auth.users where id = $1', [claims.sub]);
          if (!r.rowCount) return send(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
          return send(res, 200, session(r.rows[0]));
        }
      }
      if (path === '/auth/v1/recover' && req.method === 'POST') return send(res, 200, {});
      if (path === '/auth/v1/logout') return send(res, 204);
      if (path === '/auth/v1/user') {
        const claims = jwt.verify((req.headers.authorization ?? '').replace('Bearer ', ''), SECRET);
        const r = await q('select id, email, raw_user_meta_data from auth.users where id = $1', [claims.sub]);
        return r.rowCount ? send(res, 200, session(r.rows[0]).user) : send(res, 401, { msg: 'user not found' });
      }

      // ---------------- REST ----------------
      if (path.startsWith('/rest/v1/')) {
        let userId = null;
        const bearer = (req.headers.authorization ?? '').replace('Bearer ', '');
        try {
          userId = jwt.verify(bearer, SECRET).sub;
        } catch {
          userId = null; // anon key
        }
        const name = path.slice('/rest/v1/'.length);
        const prefer = req.headers.prefer ?? '';
        const wantRep = prefer.includes('return=representation');

        if (name.startsWith('rpc/')) {
          const fn = name.slice(4);
          if (!identOk.test(fn)) return send(res, 400, { message: 'bad function' });
          await asUser(userId, (c) => c.query(`select public.${fn}()`));
          return send(res, 200, null);
        }
        if (!identOk.test(name)) return send(res, 404, { message: 'not found' });

        const out = await asUser(userId, async (c) => {
          if (req.method === 'GET') {
            const { where, vals } = parseFilters(url);
            const order = url.searchParams.get('order');
            const [ocol, odir] = order ? order.split('.') : [];
            const limit = url.searchParams.get('limit');
            const sql = `select * from public."${name}" ${where} ${order && identOk.test(ocol) ? `order by "${ocol}" ${odir === 'desc' ? 'desc' : 'asc'}` : ''} ${limit ? `limit ${Number(limit)}` : ''}`;
            return { status: 200, rows: (await c.query(sql, vals)).rows };
          }
          if (req.method === 'POST') {
            const rows = Array.isArray(body) ? body : [body];
            if (!rows.length) return { status: 201, rows: [] };
            const cols = Object.keys(rows[0]);
            if (!cols.every((k) => identOk.test(k))) throw Object.assign(new Error('bad column'), { status: 400 });
            const params = [];
            const tuples = rows.map((r) => `(${cols.map((k) => (params.push(r[k] !== null && typeof r[k] === 'object' && !Array.isArray(r[k]) ? JSON.stringify(r[k]) : r[k]), `$${params.length}`)).join(',')})`);
            const conflict = url.searchParams.get('on_conflict');
            let upsert = '';
            if (prefer.includes('resolution=merge-duplicates')) {
              const target = (conflict ?? 'id').split(',').map((s) => `"${s.trim()}"`).join(',');
              const sets = cols.map((k) => `"${k}" = excluded."${k}"`).join(',');
              upsert = `on conflict (${target}) do update set ${sets}`;
            }
            const res2 = await c.query(`insert into public."${name}" (${cols.map((k) => `"${k}"`).join(',')}) values ${tuples.join(',')} ${upsert} returning *`, params);
            return { status: 201, rows: res2.rows };
          }
          if (req.method === 'PATCH') {
            const { where, vals } = parseFilters(url);
            const cols = Object.keys(body);
            const sets = cols.map((k, i) => `"${k}" = $${vals.length + i + 1}`).join(',');
            const res2 = await c.query(`update public."${name}" set ${sets} ${where} returning *`, [...vals, ...cols.map((k) => body[k])]);
            return { status: 200, rows: res2.rows };
          }
          throw Object.assign(new Error('method not allowed'), { status: 405 });
        });
        const single = (req.headers.accept ?? '').includes('vnd.pgrst.object');
        if (single) return out.rows.length === 1 ? send(res, 200, out.rows[0]) : send(res, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return send(res, out.status, wantRep || req.method === 'GET' ? out.rows : undefined);
      }
      send(res, 404, { message: 'not found' });
    } catch (e) {
      const code = e.code;
      const status = e.status ?? (code === '42501' ? 403 : code === '23505' ? 409 : code === '23503' ? 409 : 400);
      send(res, status, { code, message: e.message, details: e.detail ?? null, hint: null });
    }
  });

  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    pool,
    close: async () => {
      server.close();
      await pool.end();
    },
  };
}
