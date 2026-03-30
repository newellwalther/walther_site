# Counter Worker — Deploy Instructions

## One-time setup

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create a token with:
   - **Workers Scripts: Edit** (Account level)
   - **Workers KV Storage: Edit** (Account level)
3. Run:

```bash
cd counter-worker/

# Create KV namespace
RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/31a35595add67ae1366b3f6420432773/storage/kv/namespaces" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"title":"walther-counter"}')

KV_ID=$(echo $RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['id'])")
echo "KV ID: $KV_ID"

# Set initial count (check freecounterstat first!)
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/31a35595add67ae1366b3f6420432773/storage/kv/namespaces/$KV_ID/values/total" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data "0"

# Update wrangler.toml with KV ID
sed -i '' "s/REPLACE_WITH_KV_ID/$KV_ID/" wrangler.toml

# Deploy
CLOUDFLARE_API_TOKEN=YOUR_TOKEN npx wrangler deploy
```

4. After deploy, note the Worker URL (something like `https://walther-counter.SUBDOMAIN.workers.dev`)
5. Edit `/counter.js` and set `COUNTER_URL` to that URL
6. Commit and push

## Setting the initial count

If you want to match the old freecounterstat count, check the live site in a browser first, then set that number in step 3 above instead of `0`.
