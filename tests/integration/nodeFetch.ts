/** Real HTTP fetch for the jest-expo environment (its default fetch is a native-module stub). */
import http from 'node:http';

export function nodeFetch(input: unknown, init: { method?: string; headers?: unknown; body?: unknown; signal?: { aborted?: boolean } } = {}): Promise<unknown> {
  const url = new URL(typeof input === 'string' ? input : (input as { url: string }).url ?? String(input));
  const headers: Record<string, string> = {};
  const h = init.headers as { forEach?: (cb: (v: string, k: string) => void) => void } | Record<string, string> | undefined;
  if (h && typeof (h as { forEach?: unknown }).forEach === 'function') (h as { forEach: (cb: (v: string, k: string) => void) => void }).forEach((v, k) => (headers[k] = v));
  else if (h) Object.assign(headers, h);
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: init.method ?? 'GET', headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        const resHeaders = new Map(Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
        const make = (): unknown => ({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: { get: (k: string) => resHeaders.get(k.toLowerCase()) ?? null, forEach: (cb: (v: string, k: string) => void) => resHeaders.forEach(cb) },
          text: async () => text,
          json: async () => JSON.parse(text),
          clone: make,
        });
        resolve(make());
      });
    });
    req.on('error', reject);
    if (init.body !== undefined && init.body !== null) req.write(String(init.body));
    req.end();
  });
}
