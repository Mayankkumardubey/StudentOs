const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStore {
  store: Map<string, CacheEntry<unknown>>;
}

declare global {
  var __opportunityCache: CacheStore | undefined;
}

function getCache(): CacheStore {
  if (!global.__opportunityCache) {
    global.__opportunityCache = { store: new Map() };
  }
  return global.__opportunityCache;
}

export function cacheGet<T>(key: string): T | null {
  const { store } = getCache();
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  const { store } = getCache();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function buildCacheKey(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .filter((k) => params[k])
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sorted || "__empty__";
}
