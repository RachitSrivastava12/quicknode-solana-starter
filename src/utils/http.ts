import { RPCError } from '../types/errors';

export async function rpcPost<T>(
  url: string,
  method: string,
  params: unknown,
  timeoutMs = 30_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
      signal:  controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) throw new RPCError(method, 0, `Timed out after ${timeoutMs}ms`);
    throw new RPCError(method, 0, msg);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  if (!res.ok) throw new RPCError(method, res.status, text);
  let data: { result?: T; error?: { code: number; message: string } };
  try { data = JSON.parse(text); }
  catch { throw new RPCError(method, res.status, `Invalid JSON: ${text.slice(0, 200)}`); }
  if (data.error) throw new RPCError(method, res.status, `${data.error.code}: ${data.error.message}`);
  return data.result as T;
}

export async function httpGet<T>(url: string, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
  } catch (err: unknown) {
    clearTimeout(timer);
    throw new Error(`GET ${url} failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) { const b = await res.text(); throw new Error(`GET ${url} HTTP ${res.status}: ${b.slice(0,200)}`); }
  return res.json() as Promise<T>;
}

export async function httpPost<T>(url: string, body: unknown, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    throw new Error(`POST ${url} failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) { const e = await res.text(); throw new Error(`POST ${url} HTTP ${res.status}: ${e.slice(0,200)}`); }
  return res.json() as Promise<T>;
}
