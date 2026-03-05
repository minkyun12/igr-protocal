export async function loadCases() {
  try {
    const live = await fetch('/api/markets', { cache: 'no-store' });
    if (live.ok) {
      const data = await live.json();
      if (Array.isArray(data) && data.length) return { cases: data, mode: 'LIVE' };
      if (Array.isArray(data?.markets) && data.markets.length) return { cases: data.markets, mode: 'LIVE' };
    }
  } catch {}

  const mock = await fetch('./cases.json', { cache: 'no-store' });
  return { cases: await mock.json(), mode: 'MOCK' };
}

export async function postJSON(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json().catch(() => ({}));
}
