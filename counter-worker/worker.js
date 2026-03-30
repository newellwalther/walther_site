addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const key = 'total';
  const current = parseInt(await COUNTER.get(key) || '0');
  const next = current + 1;
  await COUNTER.put(key, String(next));

  return new Response(JSON.stringify({ count: next }), { headers: corsHeaders });
}
