# Server Setup Guide

This folder contains a Cloudflare Worker that:
1. Receives synced ideas from the Pick Pocket extension
2. Stores them in Cloudflare KV
3. Sends a weekly email digest via Resend

## Prerequisites

1. **Cloudflare Account**: [Sign up free](https://dash.cloudflare.com/sign-up)
2. **Resend Account**: [Sign up free](https://resend.com) (100 emails/day free)
3. **Node.js 18+**: For running Wrangler CLI

## Setup Steps

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Create KV Namespace

```bash
npx wrangler kv:namespace create IDEAS_KV
```

Copy the output ID and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "IDEAS_KV"
id = "YOUR_NAMESPACE_ID_HERE"  # ← Paste the ID here
```

### 4. Set Secrets

```bash
# Your Resend API key (from https://resend.com/api-keys)
npx wrangler secret put RESEND_API_KEY

# Your email address to receive the digest
npx wrangler secret put RECIPIENT_EMAIL
```

### 5. Deploy

```bash
npm run deploy
```

Note the Worker URL (e.g., `https://pick-pocket-server.YOUR_SUBDOMAIN.workers.dev`)

### 6. Configure Extension

1. Open the Pick Pocket extension options (right-click icon → Options)
2. Paste your Worker URL in the "Server URL" field
3. Enable syncing
4. Save!

## Testing

### Test Sync Endpoint

```bash
curl -X POST https://pick-pocket-server.YOUR_SUBDOMAIN.workers.dev/sync \
  -H "Content-Type: application/json" \
  -d '[{"text": "Test idea", "url": "https://example.com", "timestamp": "2024-01-01T00:00:00Z"}]'
```

### View Stored Ideas

```bash
curl https://pick-pocket-server.YOUR_SUBDOMAIN.workers.dev/ideas
```

### Trigger Weekly Digest Manually

In Cloudflare Dashboard → Workers → Your Worker → Triggers → Run Now
