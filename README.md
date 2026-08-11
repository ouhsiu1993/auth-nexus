# Auth-Nexus

> 多工作區（multi-tenant）集中式帳號服務。不依賴 Firebase Auth、Auth0 等託管平台，
> 從 JWT 簽發、信箱驗證流程到角色權限控管全部自行實作，可嵌入任意前端專案。

[![Node](https://img.shields.io/badge/node-%3E%3D18-339933)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 為什麼做這個

託管認證服務（Firebase Auth、Auth0）很方便，但有三個場景用不了：資料必須留在自有資料庫、需要多工作區彼此隔離、或成本隨用戶數線性成長無法接受。

Auth-Nexus 是這個情境下的最小可用解：**一套服務同時管理多個獨立工作區，每個工作區有自己的帳號空間與 API Key**，前端只要打 REST API 就能接上。

---

## 架構

```
┌──────────────────┐         ┌─────────────────────────────────────┐
│  任意前端專案     │         │        Auth-Nexus 服務              │
│                  │         │                                     │
│  Authorization:  │──────▶  │  protect ──▶ verifyTenant ──▶       │
│    Bearer <JWT>  │         │    (驗 JWT)   (驗工作區歸屬)         │
│  x-tenant-id:    │         │                    │                │
│    <工作區 ID>   │         │                    ▼                │
└──────────────────┘         │              restrictTo(roles)      │
                             │               (角色授權)            │
┌──────────────────┐         │                    │                │
│  管理後台         │──────▶  │                    ▼                │
│  React + Vite    │         │        Controllers ──▶ MongoDB      │
└──────────────────┘         │                                     │
                             │  emailService ──▶ Brevo (SMTP API)  │
                             └─────────────────────────────────────┘
```

**授權是三層疊加的**，每一層只做一件事：

| 中介層 | 職責 | 失敗回應 |
|---|---|---|
| `protect` | 驗證 JWT、確認使用者存在且未停用 | `401 UNAUTHORIZED` / `403 FORBIDDEN` |
| `verifyTenant` | 比對 `x-tenant-id` 與使用者所屬工作區（super_admin 例外） | `403 FORBIDDEN` |
| `restrictTo(...roles)` | 檢查角色是否在允許清單內 | `403 FORBIDDEN` |

---

## 幾個值得說明的設計決策

### 1. 同一個 Email 可以存在於不同工作區，刪除後還能重新註冊

直覺做法是把 `email` 設成 unique，但那樣 A 公司的 `bob@x.com` 註冊後，B 公司的同一個人就註冊不了。改成 `email + tenantId` 複合唯一也還不夠——軟刪除的帳號會永久佔用那組鍵。

實際採用的是**複合部分索引**：

```js
userSchema.index(
  { email: 1, tenantId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } }
);
```

唯一性只對「未刪除」的文件生效。同一個 Email 可在不同工作區各自存在，帳號軟刪除後也能用同一個 Email 重新註冊，而歷史紀錄完整保留。

### 2. Token 帶型別標記，防止用途混用

信箱驗證與重設密碼都用 JWT，如果只是簽發一個泛用 token，攻擊者可能拿「信箱驗證連結」去打「重設密碼」的端點。

所以每個 token 都帶 `type` 欄位，驗證時**同時檢查簽章與型別**：

```js
verifyResetPasswordToken(token) {
  const decoded = this.verifyToken(token);
  if (!decoded || decoded.type !== TokenType.RESET_PASSWORD) return null;
  return decoded;
}
```

簽章對但型別不對，一樣拒絕。

### 3. 全站軟刪除

使用者與工作區都用 `isDeleted` + `deletedAt` 而非實體刪除。理由是帳號系統的刪除多半不可逆且常有稽核需求——誤刪能救回，也留得下軌跡。

### 4. 統一的回應格式

所有端點（含錯誤）都回傳同一個結構，前端不需要為不同狀況寫不同的解析邏輯：

```json
{ "code": "UNAUTHORIZED", "message": "Token 無效或已過期", "data": null }
```

---

## 功能

- **認證**：註冊、登入、JWT 簽發與驗證、取得當前使用者
- **信箱驗證**：發送驗證信、驗證連結處理（token 有效期 24 小時）
- **密碼**：重設密碼信、以 token 重設、變更密碼（bcrypt，salt rounds 12）
- **多工作區**：工作區 CRUD、每個工作區自動產生 UUID API Key、跨工作區存取阻擋
- **角色權限**：`super_admin` / `admin` / `editor` / `user` / `viewer` 五級
- **管理後台**：工作區與使用者管理、儀表板（React + Vite）
- **API 文件**：OpenAPI 3.0，啟動後於 `/api-docs` 提供互動式介面
- **郵件模板**：驗證信、重設密碼、帳號建立、帳號狀態變更、密碼已變更共 5 種

---

## 技術棧

| 層 | 選用 |
|---|---|
| 執行環境 | Node.js 18+ / Express 4 |
| 資料庫 | MongoDB（Mongoose 8） |
| 認證 | jsonwebtoken、bcrypt |
| 輸入驗證 | Joi |
| 安全性 | Helmet（安全標頭）、CORS 白名單 |
| 郵件 | Brevo（Sendinblue）Transactional API |
| API 文件 | swagger-jsdoc + swagger-ui-express |
| 前端 | React + Vite + Chakra UI |

---

## 快速開始

### 後端

```bash
npm install
cp .env.example .env      # 填入下方環境變數
npm run init              # 建立超級管理員
npm run dev               # http://localhost:3000
```

API 文件：<http://localhost:3000/api-docs>

```ini
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/authnexus
JWT_SECRET=<請用足夠長度的隨機字串>
JWT_EXPIRES_IN=7d
BREVO_API_KEY=<your_key>
BREVO_SENDER_EMAIL=no-reply@yourdomain.com
BREVO_SENDER_NAME=AuthNexus
SITE_URL=http://localhost:5173
```

### 前端管理後台

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

```ini
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Auth Nexus
```

---

## API 概覽

完整規格見 `/api-docs`，以及 [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)。

### 認證 `/api/auth`

| Method | Endpoint | 說明 |
|---|---|---|
| `POST` | `/register` | 註冊 |
| `POST` | `/login` | 登入，回傳 JWT |
| `GET` | `/me` | 取得當前使用者 |
| `POST` | `/send-verification-email` | 發送驗證信 |
| `GET` | `/verify-email/:token` | 驗證信箱 |
| `POST` | `/send-reset-password-email` | 發送重設密碼信 |
| `POST` | `/reset-password/:token` | 以 token 重設密碼 |

### 使用者 `/api/users`、工作區 `/api/tenants`

CRUD 與狀態管理，需 `Authorization: Bearer <token>` 及 `x-tenant-id` 標頭。

---

## 已知限制

這是個人專案，以下項目尚未實作。列出來是因為它們在正式產品中都是必要的：

- **無 refresh token 機制**：目前是單一長效 JWT，無法在不重新登入的情況下輪替
- **無 token 撤銷**：登出僅由前端丟棄 token，伺服器端沒有黑名單，token 在到期前仍有效
- **無速率限制**：登入端點缺少 brute-force 防護，正式環境應加上 `express-rate-limit`
- **無自動化測試**：`src/scripts/testApi.js` 是手動執行的整合腳本，尚未建立測試套件

---

## 授權

MIT
