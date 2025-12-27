/* pinClient.ts
   - example wrapper for pin-related server calls
   - uses fetchWithTimeout defined above for reliability
*/

import { fetchWithTimeout } from './fetcher';

const API_BASE = '/api'; // adjust if your API is on different origin

export async function checkPin(pin: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/pin/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
      timeout: 4500, // short timeout for auth check
      retries: 1, // retry once on network error
      cacheEnabled: false // DO NOT cache auth checks
    });
    // res expected to be parsed JSON by fetchWithTimeout
    return { ok: true, data: res };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function setPin(pin: string, force = false) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/pin/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, force }),
      timeout: 7000,
      retries: 1,
      cacheEnabled: false
    });
    return { ok: true, data: res };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function changePin(oldPin: string, newPin: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/pin/change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPin, newPin }),
      timeout: 7000,
      retries: 1,
      cacheEnabled: false
    });
    return { ok: true, data: res };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}