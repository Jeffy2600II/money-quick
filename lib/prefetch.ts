import { mutate } from 'swr';
import { fetchWithTimeout } from './fetcher';

/**
 * Prefetch a URL into SWR cache and optionally return the data.
 * - key: SWR key (usually the URL)
 * - init: optional fetch options passed to fetchWithTimeout
 * - cacheEnabled: if true, use fetchWithTimeout cacheEnabled mode
 */
export async function prefetchKey(key: string, init ? : any, options ? : { revalidate ? : boolean }) {
  try {
    // directly fetch once (will use fetchWithTimeout and its in-memory caching if enabled)
    const data = await fetchWithTimeout(key, { ...(init || {}), cacheEnabled: true, swr: true });
    // write into SWR cache (immediate)
    await mutate(key, data, options?.revalidate === false ? false : true);
    return data;
  } catch (e) {
    // ignore prefetch errors
    return null;
  }
}