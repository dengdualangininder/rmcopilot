# 理專副駕平台（RMCopilot）

Cloudflare Worker 公開入口，將外網請求透過 **Workers VPC** 轉發到 VM 上的服務。
不需要自訂網域、不需要 Cloudflare Tunnel 的公開 hostname。

```
理專手機／瀏覽器
        │
        ▼
https://rmcopilot.miragekaujau.workers.dev
        │  Cloudflare Worker（本 repo）
        ├── /line/webhook  ──VPC──▶ localhost:8646（Hermes LINE Gateway）
        └── 其他路徑        ──VPC──▶ localhost:8787（FastAPI + SQLite 平台）
```

## 路由

| 路徑 | 後端 | 用途 |
|---|---|---|
| `/line/webhook` | `LINE_VPC` → `localhost:8646` | LINE Messaging API webhook |
| `/`、`/api/*`、其他 | `PLATFORM_VPC` → `localhost:8787` | 理專副駕平台與 API |

## 部署

```bash
npm install
npm run deploy
```

Worker 綁定的 VPC services（見 `wrangler.json`）：

- `LINE_VPC`：`01a1581c-7d5a-7cb3-96b7-d6bb306b8b1a`
- `PLATFORM_VPC`：`01a15843-d530-70e1-abb7-e4961bb1241c`

## 後端位置

平台與 LINE Gateway 都跑在同一台 VM 上，由 systemd 管理：

- `rmplatform.service` → FastAPI `127.0.0.1:8787`
- `hermes-rm.service` → Hermes LINE Gateway `127.0.0.1:8646`

本 repo 只包含對外入口 Worker；HTML／API／資料庫不在這裡。
