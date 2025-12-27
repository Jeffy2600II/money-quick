// Client-side wrapper สำหรับ API ที่เกี่ยวกับ PIN
type ApiResult < T > = {
  ok: boolean;
  data ? : T;
  status: number;
  error ? : string;
};

const DEFAULT_TIMEOUT = 5000;

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise < Response > {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function doRequest < T > (input: { url: string;init ? : RequestInit;timeout ? : number;retry ? : number;parseJson ? : boolean }): Promise < ApiResult < T >> {
  const { url, init = {}, timeout = DEFAULT_TIMEOUT, retry = 1, parseJson = true } = input;
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, timeout);
      const status = res.status;
      if (status >= 200 && status < 300) {
        const data = parseJson ? (await res.json()) as T : undefined;
        return { ok: true, data, status };
      } else {
        let errMsg = `${status} ${res.statusText}`;
        try {
          const body = await res.text();
          if (body) errMsg = body;
        } catch {}
        return { ok: false, status, error: errMsg };
      }
    } catch (err) {
      lastErr = err;
      if (attempt === retry) {
        return { ok: false, status: 0, error: String(err) };
      }
      await new Promise(r => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  return { ok: false, status: 0, error: String(lastErr) };
}

export async function checkPin(pin: string) {
  return await doRequest < { ok: boolean } > ({
    url: "/api/pin-check",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    },
  });
}

export async function hasPin() {
  return await doRequest < { exists: boolean } > ({
    url: "/api/has-pin",
    init: { method: "GET" },
  });
}

/**
 * setPin now accepts `force` boolean to overwrite existing PIN (used for forgot-password flow)
 */
export async function setPin(pin: string, force: boolean = false) {
  return await doRequest < { ok: boolean } > ({
    url: "/api/set-pin",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, force }),
    },
  });
}

export async function changePin(oldPin: string, newPin: string) {
  return await doRequest < { ok: boolean } > ({
    url: "/api/change-pin",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPin, newPin }),
    },
  });
}