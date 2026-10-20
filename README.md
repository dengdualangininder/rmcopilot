# Astro Starter Kit: Blog

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/astro-blog-starter-template)

![Astro Template Preview](https://github.com/withastro/astro/assets/2244813/ff10799f-a816-4703-b967-c78997e8323d)

<!-- dash-content-start -->

Create a blog with Astro and deploy it on Cloudflare Workers as a [static website](https://developers.cloudflare.com/workers/static-assets/).

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support
- ✅ Built-in Observability logging

<!-- dash-content-end -->

## LINE Webhook Gateway (Cloudflare Workers + Workers VPC)

This Worker doubles as the permanent public endpoint for the LINE bot. It
proxies LINE webhook traffic into the Hermes agent running on the VM — no
custom domain, no Quick Tunnel, no Zero Trust subscription.

```
LINE Platform
  │  HTTPS POST /line/webhook  (X-Line-Signature)
  ▼
Cloudflare Worker  rmcopilot.miragekaujau.workers.dev
  │  Workers VPC binding  LINE_VPC
  ▼
Cloudflare Tunnel  Sinopac_RM_Hermes (bf32fbd6-1d84-4e37-b485-1de1ad59fbc1)
  │  cloudflared on the VM (QUIC)
  ▼
http://localhost:8646/line/webhook  (hermes -p rm_hermes gateway run)
```

**Public URL**

```
https://rmcopilot.miragekaujau.workers.dev/line/webhook
```

### Why Workers VPC

`<tunnel-id>.cfargotunnel.com` resolves only to `fd10:aec2:5dae::`, a
non-public address, so it cannot be used as a webhook URL directly. Workers VPC
lets the Worker reach the private service through the existing tunnel. It is
free during the open beta and needs no domain.

### Files

| File | Purpose |
| --- | --- |
| `src/pages/line/webhook.ts` | Proxies `POST` / `GET` / `HEAD` to the VPC service, preserving headers and the raw body so `X-Line-Signature` verification still works |
| `wrangler.json` | Declares the `LINE_VPC` VPC service binding |

### Cloudflare resources

| Resource | Value |
| --- | --- |
| Worker | `rmcopilot` |
| VPC service | `line-webhook` / `01a1581c-7d5a-7cb3-96b7-d6bb306b8b1a` |
| VPC service type | HTTP, host `localhost`, port `8646` |
| Tunnel | `Sinopac_RM_Hermes` / `bf32fbd6-1d84-4e37-b485-1de1ad59fbc1` |

### Deploy

```bash
npm ci
export CLOUDFLARE_API_TOKEN=...  # Workers Scripts:Edit, Cloudflare Tunnel:Edit, Connectivity Directory:Edit
npx wrangler vpc service create line-webhook --type http \
  --tunnel-id <TUNNEL_ID> --hostname localhost --http-port 8646
npm run build
npx wrangler deploy
```

### Verify

```bash
curl -I https://rmcopilot.miragekaujau.workers.dev/line/webhook   # 405, allow: POST
curl -X POST https://rmcopilot.miragekaujau.workers.dev/line/webhook -d '{}'
# 401 invalid signature — proves the request reached the Hermes gateway
```

A correctly signed POST returns `200`. `Python-urllib` requests are blocked by
the default workers.dev protection (HTTP 403); LINE's `LineBotWebhook/2.0`
user agent is accepted.

### Operational notes

- The gateway must run on the VM as `hermes-rm.service` (systemd,
  `Restart=always`), not from an interactive shell.
- If the tunnel or VPC service is recreated, update `vpc_services[].service_id`
  in `wrangler.json` and redeploy.
- The project lives at `/home/ubuntu/2026_RMCopilot_Sinopac` on the VM
  (`/tmp` is cleared on reboot).

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/astro-blog-starter-template
```

A live public deployment of this template is available at [https://astro-blog-starter-template.templates.workers.dev](https://astro-blog-starter-template.templates.workers.dev)

## 🚀 Project Structure

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                           | Action                                           |
| :-------------------------------- | :----------------------------------------------- |
| `npm install`                     | Installs dependencies                            |
| `npm run dev`                     | Starts local dev server at `localhost:4321`      |
| `npm run build`                   | Build your production site to `./dist/`          |
| `npm run preview`                 | Preview your build locally, before deploying     |
| `npm run astro ...`               | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help`         | Get help using the Astro CLI                     |
| `npm run build && npm run deploy` | Deploy your production site to Cloudflare        |
| `npm wrangler tail`               | View real-time logs for all Workers              |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
