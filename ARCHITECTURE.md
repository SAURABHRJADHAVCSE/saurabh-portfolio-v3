# Architecture — Next.js Starter Template

> **Purpose of this document:** Provide a complete, machine-readable map of the
> codebase so that any AI agent or LLM can understand the project in depth —
> its structure, conventions, data flows, security model, and extension points —
> without needing to read every source file.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | `nextjs-setup` (Next.js Starter Template) |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **React** | v19 (React Server Components by default) |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` |
| **UI Library** | shadcn/ui (New York style, RSC-enabled) |
| **Icons** | Lucide React |
| **Package Manager** | npm |
| **Dev Server** | `next dev --turbopack` |
| **Build** | `next build --turbopack` |

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Client)                          │
│                                                                     │
│  React 19 Client Components                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ AuthContext   │  │ ThemeProvider │  │ AI Test Client           │  │
│  │ (useAuth)    │  │ (next-themes) │  │ (PromptForm/ResultPanel) │  │
│  └──────┬───────┘  └──────────────┘  └────────────┬─────────────┘  │
│         │                                          │                │
│         │  Firebase ID Token                       │  POST /api/ai/test
│         ▼                                          ▼                │
├─────────────────────────────────────────────────────────────────────┤
│                     proxy.ts (Route Protection)                     │
│              Lightweight JWT check (no crypto verify)               │
│     Protected: /profile, /ai-test, /change-password, /delete-acct  │
│     Auth: /login, /signup, /forgot-password                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      NEXT.JS SERVER (Node.js)                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ App Router (RSC by default)                                 │    │
│  │                                                             │    │
│  │  Route Groups:                                              │    │
│  │    (auth)      → login, signup, forgot-password             │    │
│  │    (protected) → profile, change-password, delete-account,  │    │
│  │                  ai-test                                    │    │
│  │    (app)       → reserved (empty)                           │    │
│  │                                                             │    │
│  │  API Routes:                                                │    │
│  │    /api/auth/session     → POST/GET/DELETE session cookie   │    │
│  │    /api/ai/test          → POST AI generation               │    │
│  │    /api/ai/video-proxy   → GET stream video (hides API key) │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                      │
│  ┌───────────────────────────▼──────────────────────────────────┐   │
│  │                     LIB LAYER (src/lib/)                     │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌────────────┐  ┌─────────────────────────┐  │   │
│  │  │ auth/    │  │ firebase/  │  │ ai/                     │  │   │
│  │  │ server.ts│  │ admin.ts   │  │ adapter.interface.ts    │  │   │
│  │  │ config.ts│  │ firebase.ts│  │ adapter.factory.ts      │  │   │
│  │  │          │  │ handler.ts │  │ adapters/gemini.adapter │  │   │
│  │  │          │  │ config/    │  │ adapters/kieai.adapter  │  │   │
│  │  │          │  │ services/  │  │ circuit-breaker.ts      │  │   │
│  │  │          │  │            │  │ rate-limiter.ts         │  │   │
│  │  │          │  │            │  │ prompt-safety.ts        │  │   │
│  │  │          │  │            │  │ audit-logger.ts         │  │   │
│  │  └──────────┘  └────────────┘  └─────────────────────────┘  │   │
│  │                                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │   │
│  │  │ rate-limit.ts    │  │ validations/     │                  │   │
│  │  │ (Upstash Redis)  │  │ auth.ts (Zod)   │                  │   │
│  │  └──────────────────┘  └──────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      EXTERNAL SERVICES                              │
│                                                                     │
│  Firebase Auth ─── Firebase Admin SDK (session cookies)             │
│  Cloud Firestore ─ uat_users / prod_users collections               │
│  Cloud Storage ─── /users/{uid}/avatar/{file}                       │
│  Upstash Redis ─── distributed rate limiting                        │
│  Google Gemini ─── text / image (Nano Banana, Imagen 4) / video    │
│  Kie.AI ───────── text / image (Flux-2) / video (Kling)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure (annotated)

```
nextjs-setup/
├── AGENTS.md                   # AI agent rules — Next.js 16 breaking-change warning
├── ARCHITECTURE.md             # THIS FILE
├── components.json             # shadcn/ui config (New York style, RSC on, Lucide icons)
├── eslint.config.mjs           # ESLint 9 flat config
├── firestore.rules             # Firestore security rules (deny-by-default)
├── next.config.ts              # Next.js 16 config (CSP, HSTS, PWA, Turbopack, Taint)
├── next-env.d.ts               # Auto-generated Next.js type declarations
├── package.json                # Dependencies and scripts
├── postcss.config.mjs          # PostCSS → Tailwind v4
├── storage.rules               # Firebase Storage security rules
├── tsconfig.json               # TypeScript strict, path alias @/* → ./src/*
│
├── public/
│   └── firebase-messaging-sw.js  # FCM service worker for push notifications
│
└── src/
    ├── instrumentation.ts      # Next.js server start hook (placeholder)
    ├── proxy.ts                # Route protection (replaces middleware.ts in Next.js 16)
    │
    ├── app/                    # ← App Router root
    │   ├── layout.tsx          # Root layout: fonts, ThemeProvider, AuthProvider, Toaster, PWA
    │   ├── page.tsx            # Landing page (feature showcase)
    │   ├── globals.css         # Tailwind v4 imports + CSS-variable theme tokens
    │   ├── error.tsx           # Global error boundary (client component)
    │   ├── not-found.tsx       # 404 page
    │   ├── manifest.ts         # PWA web app manifest (auto-generated route)
    │   ├── robots.ts           # robots.txt (auto-generated)
    │   ├── sitemap.ts          # sitemap.xml (auto-generated)
    │   │
    │   ├── (app)/              # Route group — reserved for future public pages (empty)
    │   │
    │   ├── (auth)/             # Route group — unauthenticated pages
    │   │   ├── layout.tsx      # Split-screen layout (brand panel + form)
    │   │   ├── error.tsx       # Auth error boundary
    │   │   ├── login/page.tsx
    │   │   ├── signup/page.tsx
    │   │   └── forgot-password/page.tsx
    │   │
    │   ├── (protected)/        # Route group — authenticated pages
    │   │   ├── layout.tsx      # Server-side auth check → redirect if not logged in
    │   │   ├── loading.tsx     # Suspense fallback
    │   │   ├── error.tsx       # Protected error boundary
    │   │   ├── profile/page.tsx
    │   │   ├── change-password/page.tsx
    │   │   ├── delete-account/page.tsx
    │   │   └── ai-test/page.tsx
    │   │
    │   └── api/
    │       ├── auth/session/route.ts   # Session cookie CRUD (GET/POST/DELETE)
    │       └── ai/
    │           ├── test/route.ts       # AI generation endpoint
    │           └── video-proxy/route.ts # Streams Veo videos (hides API key)
    │
    ├── components/
    │   ├── PwaInstallPrompt.tsx   # PWA install banner (client)
    │   ├── ThemeProvider.tsx      # next-themes wrapper (client)
    │   ├── ThemeToggle.tsx        # Light/Dark/System dropdown (client)
    │   │
    │   ├── ai-test/              # AI playground UI
    │   │   ├── AITestClient.tsx  # Main orchestrator (client)
    │   │   ├── ModelPicker.tsx   # Provider + model selector
    │   │   ├── PromptForm.tsx    # Prompt input + options
    │   │   ├── ResultPanel.tsx   # Renders text/image/video results
    │   │   ├── catalog.ts       # Client-safe model catalog (Gemini + Kie.AI)
    │   │   └── types.ts         # Shared types for AI test panel
    │   │
    │   ├── auth/                 # Auth-related forms (client components)
    │   │   ├── LoginForm.tsx
    │   │   ├── SignupForm.tsx
    │   │   ├── ForgotPasswordForm.tsx
    │   │   ├── ChangePasswordForm.tsx
    │   │   ├── DeleteAccountForm.tsx
    │   │   ├── UserProfile.tsx
    │   │   └── password-input.tsx  # Reusable password field with toggle
    │   │
    │   ├── layout/
    │   │   └── AppShell.tsx      # Protected-area shell (header + theme toggle)
    │   │
    │   ├── shared/               # Shared components (empty — future)
    │   │
    │   └── ui/                   # shadcn/ui primitives (auto-generated)
    │       ├── alert.tsx, avatar.tsx, badge.tsx, button.tsx, card.tsx,
    │       │   dialog.tsx, dropdown-menu.tsx, form.tsx, input.tsx,
    │       │   label.tsx, progress.tsx, scroll-area.tsx, select.tsx,
    │       │   separator.tsx, sheet.tsx, skeleton.tsx, switch.tsx,
    │       │   tabs.tsx, textarea.tsx, tooltip.tsx
    │       └── (all are Radix-based, Tailwind-styled, RSC-compatible)
    │
    ├── contexts/
    │   └── AuthContext.tsx        # Global auth state (client), session cookie sync
    │
    ├── lib/
    │   ├── utils.ts              # cn() — clsx + tailwind-merge
    │   ├── rate-limit.ts         # Upstash Redis distributed rate limiter
    │   │
    │   ├── actions/              # Server Actions (empty — future)
    │   │
    │   ├── ai/                   # AI Adapter Layer (provider-agnostic)
    │   │   ├── index.ts          # Barrel export — single import point
    │   │   ├── adapter.interface.ts  # IAIAdapter interface
    │   │   ├── adapter.factory.ts    # Singleton factory (cached by provider:apiKey)
    │   │   ├── types.ts          # Shared types (requests, responses, errors)
    │   │   ├── rate-limiter.ts   # In-memory sliding-window rate limiter
    │   │   ├── circuit-breaker.ts    # Consecutive-failure circuit breaker
    │   │   ├── prompt-safety.ts  # Jailbreak/injection pre-filter
    │   │   ├── audit-logger.ts   # SHA-256 prompt hashing + structured JSON logs
    │   │   ├── kieai-models.ts   # Full Kie.AI model catalog (22+ image, 24+ video)
    │   │   └── adapters/
    │   │       ├── gemini.adapter.ts  # Google Gemini (text, Nano Banana, Imagen 4, Veo 3.1)
    │   │       └── kieai.adapter.ts   # Kie.AI (Flux-2, Kling, OpenAI-compat chat)
    │   │
    │   ├── auth/
    │   │   ├── server.ts         # getCurrentUser() — verifies session cookie (server-only)
    │   │   └── config.ts         # Password policy + strength checker
    │   │
    │   ├── firebase/
    │   │   ├── admin.ts          # Firebase Admin SDK singleton (server-only)
    │   │   ├── firebase.ts       # Client-side Firebase app init (auth + Firestore)
    │   │   ├── handler.ts        # Standardized API response + error mapping
    │   │   ├── config/
    │   │   │   ├── environments.ts   # UAT/PROD switcher, Firebase & AI configs
    │   │   │   └── types.ts          # FirebaseConfig, EnvironmentConfig types
    │   │   └── services/
    │   │       ├── auth.service.ts   # AuthService — login, signup, Google, CRUD
    │   │       └── index.ts          # Barrel (APIBook) — re-exports everything
    │   │
    │   └── validations/
    │       └── auth.ts           # Zod schemas for login/signup/password forms
    │
    └── styles/                   # Additional styles (empty — future)
```

---

## 4. Runtime Architecture

### 4.1 Request Flow

```
Client Request
     │
     ▼
proxy.ts  ←── Runs on every non-static, non-API request
     │         Reads auth cookie (lightweight JWT exp check, NO crypto)
     │         • Protected route + no cookie → redirect to /login?redirect=...
     │         • Auth route + cookie → redirect to /profile
     │         • Otherwise → pass through
     ▼
App Router
     │
     ├── Server Components (default)
     │   └── Can call getCurrentUser() from lib/auth/server.ts
     │       └── Verifies session cookie cryptographically via Firebase Admin SDK
     │           Uses React cache() so verification happens only once per render
     │           Uses experimental_taintUniqueValue() to prevent token leaking to client
     │
     ├── Client Components ('use client')
     │   └── Access auth state via useAuth() hook from AuthContext
     │
     └── API Routes (src/app/api/*)
         └── Full server-side, can use Firebase Admin, AI adapters, etc.
```

### 4.2 Component Rendering Model

| Layer | Default | Notes |
|---|---|---|
| `app/layout.tsx` | Server | Renders HTML shell, wraps with providers |
| `ThemeProvider`, `AuthProvider` | Client | Marked `'use client'` — needed for browser APIs |
| Route group layouts | Server | `(protected)/layout.tsx` does async auth check |
| Page components | Server | Can use `async/await`, direct DB access |
| Form components (`LoginForm`, etc.) | Client | User interactivity requires client |
| `ui/*` components | Server-compatible | shadcn/ui primitives, RSC-safe unless interactive |

---

## 5. Authentication System

### 5.1 Security Model Overview

```
┌──────────────┐    ID Token    ┌────────────────────┐   Session Cookie   ┌──────────────────┐
│ Firebase Auth │ ─────────────→ │ POST /api/auth/    │ ──────────────────→ │ httpOnly Cookie   │
│ (client SDK) │                │ session             │                    │ (__Host- prefix   │
│              │                │                     │                    │  in production)   │
│ onAuthState  │                │ 1. Rate limit (IP)  │                    │                    │
│ Changed()    │                │ 2. CSRF check       │                    │ Verified on every │
│              │                │ 3. Origin check     │                    │ server render via │
│              │                │ 4. verifyIdToken()  │                    │ verifySession     │
│              │                │ 5. createSession    │                    │ Cookie()          │
│              │                │    Cookie()         │                    │                    │
└──────────────┘                └────────────────────┘                    └──────────────────┘
```

### 5.2 Auth Flow Step-by-Step

1. **Client** authenticates via Firebase Auth SDK (email/password or Google OAuth).
2. **AuthContext** listens to `onAuthStateChanged` → calls `user.getIdToken(true)`.
3. **AuthContext** POSTs the ID token to `/api/auth/session`.
4. **Session Route** performs:
   - IP-based rate limiting via Upstash Redis (15 req/min).
   - CSRF double-submit cookie validation (`csrf_token` cookie vs `x-csrf-token` header).
   - Origin/Referer header check (prevents cross-origin CSRF).
   - `verifyIdToken(token, checkRevoked=true)` — cryptographic verification via Admin SDK.
   - `createSessionCookie(token, expiresIn=5days)` — creates a revocation-capable session cookie.
5. **Server** sets `__Host-firebaseAuthToken` (production) or `firebaseAuthToken` (dev) as `httpOnly`, `secure`, `sameSite=lax`, `path=/`.
6. **On every server render:** `getCurrentUser()` → `verifySessionCookie(token, checkRevoked=true)` → returns `ServerUser | null`. Uses `React.cache()` for deduplication.
7. **Token refresh:** AuthContext runs a timer every 4 hours to call `getIdToken(true)` and re-POST to session route.
8. **Logout:** AuthContext calls `DELETE /api/auth/session` → server deletes the cookie.

### 5.3 Cookie Schema

| Cookie | httpOnly | Secure | SameSite | Purpose |
|---|---|---|---|---|
| `__Host-firebaseAuthToken` (prod) / `firebaseAuthToken` (dev) | Yes | Yes (prod) | lax | Firebase session cookie (5-day expiry) |
| `csrf_token` | No | Yes (prod) | strict | CSRF double-submit token (client-readable) |

### 5.4 Route Protection (proxy.ts)

- **Replaces** traditional `middleware.ts` per Next.js 16 conventions.
- **Export:** `export function proxy(request: NextRequest)`.
- **Logic:** Lightweight JWT expiry check (decodes payload, checks `exp` — no cryptographic verification). Full verification happens server-side in `getCurrentUser()`.
- **Protected routes:** `/profile`, `/delete-account`, `/change-password`, `/ai-test`.
- **Auth routes:** `/login`, `/signup`, `/forgot-password`.
- **Open redirect prevention:** `sanitizeRedirect()` ensures `?redirect=` only accepts paths starting with `/` (not `//`).

### 5.5 Password Policy

Configured in `lib/auth/config.ts`:

| Rule | Value |
|---|---|
| Min length | 8 |
| Require uppercase | Yes |
| Require lowercase | Yes |
| Require numbers | Yes |
| Require special chars | No |
| Email-in-password check | Yes (blocks if password contains email) |

Validation schemas in `lib/validations/auth.ts` use Zod v4.

---

## 6. AI Adapter Layer

### 6.1 Architecture Pattern

```
Consumer Code (API route / server action)
     │
     │  import { createAIAdapter, getAIConfig } from '@/lib/ai';
     │  const adapter = createAIAdapter(getAIConfig());
     │  const result = await adapter.generateText({ prompt: '...' });
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  adapter.factory.ts                                 │
│  Singleton cache (Map) keyed by provider:apiKey     │
│  ┌───────────────────────────────────────────────┐  │
│  │ ADAPTER_REGISTRY                              │  │
│  │   'gemini' → GeminiAdapter                    │  │
│  │   'kieai'  → KieAIAdapter                     │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  IAIAdapter (adapter.interface.ts)                    │
│                                                      │
│  • name: string                                      │
│  • provider: AIProvider                              │
│  • getSupportedCapabilities(): AICapability[]         │
│  • supportsCapability(cap): boolean                  │
│  • generateText(req): Promise<TextGenerationResponse>│
│  • generateImage(req): Promise<ImageGenResponse>     │
│  • generateVideo(req): Promise<VideoGenResponse>     │
└──────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
┌────────┴────────┐           ┌────────┴────────┐
│ GeminiAdapter   │           │ KieAIAdapter    │
│                 │           │                 │
│ @google/genai   │           │ REST API        │
│ SDK (v1.42+)    │           │ createTask →    │
│                 │           │ poll recordInfo │
│ Text: Gemini    │           │                 │
│   2.5/3/3.1     │           │ Text: OpenAI-   │
│ Image: Nano     │           │   compatible    │
│   Banana,       │           │ Image: Flux-2   │
│   Imagen 4      │           │ Video: Kling    │
│ Video: Veo 3.1  │           │                 │
└─────────────────┘           └─────────────────┘
```

### 6.2 Provider Switcher

The active AI provider is configured in a single location:

```typescript
// src/lib/firebase/config/environments.ts
export const AI_PROVIDER: AIProvider = 'gemini';  // Change to 'kieai' to switch
```

Both UAT and PROD environments use the same provider by default but can be overridden independently.

### 6.3 Adding a New AI Provider

1. Create `src/lib/ai/adapters/newprovider.adapter.ts` implementing `IAIAdapter`.
2. Add `'newprovider'` to the `AIProvider` union in `types.ts`.
3. Register it in `adapter.factory.ts` → `ADAPTER_REGISTRY`.
4. Add its config getter function in `environments.ts`.

### 6.4 Supported Models

**Gemini (via @google/genai SDK):**

| Capability | Models |
|---|---|
| Text | `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3-flash-preview`, `gemini-3.1-pro-preview` |
| Image | `gemini-2.5-flash-image` (Nano Banana), `gemini-3-pro-image-preview`, `imagen-4.0-generate-001`, `imagen-4.0-ultra-generate-001`, `imagen-4.0-fast-generate-001` |
| Video | `veo-3.1-generate-preview` (with native audio, 720p/1080p/4K) |

**Kie.AI (REST API — async task-based):**

| Capability | Default Model | Total Models |
|---|---|---|
| Text | `gemini-2.5-flash` (proxied) | 5+ |
| Image | `flux-2/pro-text-to-image` | 22+ |
| Video | `kling/v2-1-pro` | 24+ |

### 6.5 Resilience Stack

Each AI request passes through multiple safety layers:

```
Incoming Request
     │
     ▼
[1] Prompt Safety Filter (prompt-safety.ts)
     │  Regex-based pre-screening
     │  Blocks: jailbreaks, prompt injection, data exfil, harmful content
     │  Runs BEFORE consuming an API call
     ▼
[2] Upstash Redis Rate Limit (rate-limit.ts)
     │  Distributed sliding-window, per-user
     │  AI route: 20 req/min per userId
     ▼
[3] In-Memory Rate Limiter (rate-limiter.ts)
     │  Per adapter instance, per cold start
     │  Gemini: 14 req/60s | Kie.AI: 18 req/10s
     ▼
[4] Circuit Breaker (circuit-breaker.ts)
     │  Trips after 5 consecutive failures
     │  OPEN for 60s → HALF_OPEN (1 probe) → CLOSED
     ▼
[5] Provider SDK Call
     │  Hard timeout: 60s (text/image), 10min (video polling)
     │  AbortSignal-based
     ▼
[6] Audit Logger (audit-logger.ts)
     │  Structured JSON to stdout
     │  SHA-256 hash of prompt (never plaintext)
     │  Fields: userId, capability, provider, model, durationMs, status
     ▼
Response
```

### 6.6 Video Proxy

- **Problem:** Veo video download URLs require the API key as a query parameter.
- **Solution:** `GET /api/ai/video-proxy?fileId=...&sig=...` streams the video from Google, keeping the API key server-side.
- **Security:** HMAC signature (`SHA-256(fileId:userId)`) ties each proxy URL to the user who generated it. Timing-safe comparison prevents cross-user access. Max video size: 100 MB.

---

## 7. Firebase Integration

### 7.1 Client SDK (`lib/firebase/firebase.ts`)

- Initializes `FirebaseApp`, `Auth`, `Firestore` from environment config.
- Environment (UAT/PROD) switched by `IS_PRODUCTION` boolean in `environments.ts`.

### 7.2 Admin SDK (`lib/firebase/admin.ts`)

- **Server-only** (`import 'server-only'`).
- Lazy singleton — initializes on first call to `getAdminAuth()`.
- Credential resolution order:
  1. `FIREBASE_SERVICE_ACCOUNT_KEY` env var (JSON string) — recommended.
  2. `GOOGLE_APPLICATION_CREDENTIALS` env var (file path).
  3. GCP Application Default Credentials (auto-detected on GCP).

### 7.3 Firestore Data Model

| Collection | Document Key | Purpose |
|---|---|---|
| `uat_users` | `{userId}` (Firebase UID) | User profile (UAT environment) |
| `prod_users` | `{userId}` (Firebase UID) | User profile (PROD environment) |

**Document shape (`AppUser`):**
```typescript
{
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  createdAt: string;           // Firebase metadata
  lastLoginAt: string;         // Firebase metadata
  updatedAt: FieldValue;       // serverTimestamp()
  environment: 'UAT' | 'PROD';
  provider: string;            // 'email' | 'google'
}
```

### 7.4 Firestore Security Rules

- **Default deny** — `allow read, write: if false` on `/{document=**}`.
- Users can only CRUD their own document (`request.auth.uid == userId`).
- Document size capped at 20 KB.
- Immutable fields: `uid`, `createdAt`, `environment` (cannot be changed after creation).

### 7.5 Storage Security Rules

- **Default deny** on all paths.
- Avatar uploads: `/users/{userId}/avatar/{filename}`.
  - Read: any authenticated user.
  - Write: owner only, max 5 MB, image MIME types only.

### 7.6 Firebase Handler (`handler.ts`)

- `firebaseHandler<T>()` / `firebaseVoidHandler()` — wraps Firebase SDK calls in try/catch.
- Returns `ApiResponse<T>` with `{ success, data, error, code, timestamp }`.
- Maps 30+ Firebase error codes to user-friendly messages.

### 7.7 Auth Service (`services/auth.service.ts`)

Provides `AuthService` object with methods:
- `loginWithEmail(email, password)`
- `registerWithEmail(email, password, displayName)`
- `loginWithGoogle()`
- `logout()`
- `resetPassword(email)`
- `changePassword(currentPassword, newPassword)`
- `deleteAccount(password)`
- `getUserProfile(uid)`
- `sendVerificationEmail()`
- Auto-saves user data to Firestore on every auth action.

---

## 8. Environment Configuration

### 8.1 Switcher

```typescript
// src/lib/firebase/config/environments.ts
export const IS_PRODUCTION = false;  // Toggle this for PROD
export const AI_PROVIDER: AIProvider = 'gemini';  // Toggle for AI provider
```

### 8.2 Environment Variables

**Client-side (prefixed with `NEXT_PUBLIC_`):**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_UAT_API_KEY` | UAT Firebase API key |
| `NEXT_PUBLIC_FIREBASE_UAT_AUTH_DOMAIN` | UAT auth domain |
| `NEXT_PUBLIC_FIREBASE_UAT_PROJECT_ID` | UAT project ID |
| `NEXT_PUBLIC_FIREBASE_UAT_STORAGE_BUCKET` | UAT storage bucket |
| `NEXT_PUBLIC_FIREBASE_UAT_MESSAGING_SENDER_ID` | UAT FCM sender |
| `NEXT_PUBLIC_FIREBASE_UAT_APP_ID` | UAT app ID |
| `NEXT_PUBLIC_FIREBASE_UAT_MEASUREMENT_ID` | UAT analytics |
| `NEXT_PUBLIC_FIREBASE_UAT_VAPID_KEY` | UAT push notifications |
| `NEXT_PUBLIC_FIREBASE_PROD_*` | Same set for PROD |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (for OG, sitemap, CORS) |

**Server-side only (never exposed to browser):**

| Variable | Purpose |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Admin SDK credential (JSON string) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `KIEAI_API_KEY` | Kie.AI API key |
| `VIDEO_PROXY_HMAC_SECRET` | HMAC secret for video proxy signatures (falls back to GEMINI_API_KEY) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |

---

## 9. Security Architecture

### 9.1 HTTP Security Headers (next.config.ts)

Applied to all routes (`/(.*)`):

| Header | Value | Purpose |
|---|---|---|
| Content-Security-Policy | Restrictive CSP with allowlist | Prevent XSS, script injection |
| X-Frame-Options | SAMEORIGIN | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME-type sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Control referer leakage |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() | Restrict browser APIs |
| Strict-Transport-Security | max-age=63072000 (prod only) | Force HTTPS |
| X-DNS-Prefetch-Control | on | Performance optimization |
| X-Powered-By | (removed) | Hide tech stack |

### 9.2 CSRF Protection

- **Double-submit cookie pattern:** `GET /api/auth/session` issues a `csrf_token` cookie. Client JS reads it and includes it as `x-csrf-token` header on POST/DELETE.
- **Origin validation:** Checks `Origin` header (preferred) or `Referer` fallback. Must match deployment URL or localhost in dev.
- **Applied to:** Session creation and deletion.

### 9.3 Rate Limiting

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| `POST /api/auth/session` | 15 requests | 60 seconds | `session:{ip}` |
| `DELETE /api/auth/session` | 15 requests | 60 seconds | `session-del:{ip}` |
| `POST /api/ai/test` | 20 requests | 60 seconds | `ai:{userId}` |

Implementation: Upstash Redis sliding-window via `@upstash/ratelimit`. Gracefully disabled if env vars are missing.

### 9.4 React Taint API

Enabled in `next.config.ts` (`experimental.taint = true`). Used in `getCurrentUser()` to taint the raw Firebase session cookie token. If a Server Component accidentally passes it to a Client Component, React throws a build-time error.

### 9.5 SSRF Protection (AI Routes)

The AI test route validates `imageUrl` parameters:
- Only `gs://` and `https://` schemes allowed.
- Blocks private IP ranges: `localhost`, `127.0.0.1`, `[::1]`, `169.254.169.254` (cloud metadata).
- Blocks DNS rebinding services: `*.nip.io`, `*.sslip.io`, `*.xip.io`.
- Blocks RFC 1918 ranges: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`.

### 9.6 Input Validation (AI Routes)

| Field | Limit |
|---|---|
| Prompt length | 2000 chars |
| System instruction length | 500 chars |
| Image URL length | 500 chars |
| Request body size | 1 MB |
| Capability | Allowlist: `text`, `image`, `video` |
| Provider | Allowlist: `gemini`, `kieai` |
| Model | Allowlist per provider (model whitelist) |
| Aspect ratio | Allowlist: `1:1`, `16:9`, `9:16`, etc. |
| Video resolution | Allowlist: `720p`, `1080p`, `4k` |
| Video duration | Allowlist: `4`, `6`, `8` seconds |

### 9.7 Error Sanitization

API routes never leak internal details (stack traces, SDK URLs, API keys). Errors are mapped to generic user-facing messages via `handler.ts` error code map.

---

## 10. PWA Support

- **Library:** `@ducanh2912/next-pwa`
- **Config:** Auto-generates service worker in `public/`, disabled in development.
- **Manifest:** Auto-generated from `app/manifest.ts` — standalone display, SVG icons.
- **Install Prompt:** `PwaInstallPrompt.tsx` shows a conditional install banner:
  - Delays 3 seconds after page load.
  - Dismissal persisted in localStorage (30-day suppression).
  - Detects already-installed state (standalone display mode, `navigator.standalone`).
- **Push Notifications:** `firebase-messaging-sw.js` service worker present for FCM.

---

## 11. Theming

- **Provider:** `next-themes` wrapped in `ThemeProvider.tsx` (client component).
- **Modes:** System (default), Light, Dark.
- **Switch mechanism:** `class` attribute on `<html>` + CSS custom properties.
- **Theme tokens:** Defined as CSS variables in `globals.css`, referenced in Tailwind config.
- **Toggle:** `ThemeToggle.tsx` — dropdown menu with Light/Dark/System options.

### Fonts

| Font | Variable | Usage |
|---|---|---|
| Barlow | `--font-barlow` | Headings (bold, modern) |
| Rubik | `--font-rubik` | Body text (readable, clean) |
| Geist Mono | `--font-geist-mono` | Code blocks |

All loaded from Google Fonts with `display: swap` and system-font fallbacks.

---

## 12. Form Handling

- **Library:** React Hook Form v7 + Zod v4 resolver.
- **Validation schemas:** Centralized in `lib/validations/auth.ts`.
- **Password rules:** Driven by `AUTH_CONFIG` in `lib/auth/config.ts`.
- **Toast notifications:** Sonner (`richColors`, `closeButton`, top-right position).

---

## 13. API Route Contracts

### `POST /api/auth/session`

Creates a session cookie from a Firebase ID token.

```typescript
// Request
{ token: string }  // Firebase ID token

// Headers required
"Content-Type": "application/json"
"x-csrf-token": "<csrf_token cookie value>"

// Response 200
{ success: true }

// Response 401
{ error: "Invalid token" }

// Response 403
{ error: "Forbidden" | "Invalid CSRF token" }

// Response 429
{ error: "Too many requests" }
// Header: Retry-After: <seconds>
```

### `DELETE /api/auth/session`

Clears the session cookie.

```typescript
// Headers required
"x-csrf-token": "<csrf_token cookie value>"

// Response 200
{ success: true }
```

### `GET /api/auth/session`

Issues a CSRF token cookie. No auth required.

```typescript
// Response 200
{ ok: true }
// Set-Cookie: csrf_token=<random-hex>
```

### `POST /api/ai/test`

Runs AI generation (text, image, or video).

```typescript
// Request
{
  capability: "text" | "image" | "video",
  provider: "gemini" | "kieai",
  model: string,       // must be in provider's whitelist
  prompt: string,      // max 2000 chars
  // Text options
  systemInstruction?: string,  // max 500 chars
  temperature?: number,
  maxTokens?: number,
  // Image options
  aspectRatio?: string,
  negativePrompt?: string,
  numberOfImages?: number,
  imageSize?: string,
  // Video options
  durationSeconds?: number,
  resolution?: string,
  imageUrl?: string,   // only gs:// or https://, SSRF-checked
}

// Response 200
{
  result: TextGenerationResponse | ImageGenerationResponse | VideoGenerationResponse,
  durationMs: number,
  provider: string,
  model: string,
}

// Response 400 — validation error
{ error: string, code?: string }

// Response 401 — not authenticated
{ error: "Unauthorized" }

// Response 403 — prompt blocked by safety filter
{ error: string, code: "PROMPT_BLOCKED", rule: string }

// Response 429 — rate limited
{ error: "Too many requests", retryAfterSec: number }

// Response 503 — circuit breaker open
{ error: string, code: "CIRCUIT_OPEN" }
```

### `GET /api/ai/video-proxy?fileId=...&sig=...`

Streams a Veo-generated video, keeping the API key server-side.

```typescript
// Query params
fileId: string  // alphanumeric + hyphens, max 128 chars
sig: string     // HMAC signature from AI test route

// Response 200 — video stream
Content-Type: video/mp4

// Response 401 — not authenticated
{ error: "Unauthorized" }

// Response 403 — invalid signature
{ error: "Invalid or missing video access signature" }
```

---

## 14. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Session cookies over JWT** | Firebase session cookies support server-side revocation. JWTs cannot be revoked until expiry. |
| **proxy.ts over middleware.ts** | Next.js 16 convention. Same functionality, new export name. |
| **`server-only` imports** | Prevents accidental bundling of Admin SDK credentials into client code. |
| **React Taint API** | Extra defense layer — build-time error if a secret leaks to a Client Component. |
| **Upstash Redis for rate limiting** | Serverless-compatible (stateless functions need external state store). |
| **In-memory rate limiter + circuit breaker** | Per-instance protection that survives within a cold start but resets gracefully on new deployments. |
| **Prompt hashing in audit logs** | Privacy-preserving — logs request metadata without storing user input. |
| **HMAC-signed video proxy URLs** | Prevents cross-user video access without needing a database lookup. |
| **AI adapter factory singleton** | Preserves circuit breaker state across requests within the same serverless instance. |
| **Environment configs via getter functions** | Reads `process.env` fresh on every call — supports runtime API key rotation without cold restart. |
| **Separate UAT/PROD Firebase projects** | Full isolation — different API keys, Firestore collections (`uat_users` vs `prod_users`), storage paths. |
| **shadcn/ui (not a node_modules library)** | Components live in source code — fully customizable without forking a library. |

---

## 15. Dependency Graph (Key Packages)

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.1.6 | Framework (App Router, Turbopack, RSC) |
| `react` / `react-dom` | ^19.2.4 | UI library |
| `firebase` | ^12.2.1 | Client SDK (Auth, Firestore) |
| `firebase-admin` | ^13.6.1 | Server SDK (token verification, session cookies) |
| `@google/genai` | ^1.42.0 | Google Gemini AI SDK |
| `@upstash/ratelimit` + `@upstash/redis` | ^2.0.8 / ^1.36.3 | Distributed rate limiting |
| `zod` | ^4.1.5 | Schema validation |
| `react-hook-form` | ^7.62.0 | Form state management |
| `@hookform/resolvers` | ^5.2.1 | Zod integration for react-hook-form |
| `next-themes` | ^0.4.6 | Theme switching (dark/light/system) |
| `sonner` | ^2.0.7 | Toast notifications |
| `@ducanh2912/next-pwa` | ^10.2.9 | PWA service worker generation |
| `radix-ui` / `@radix-ui/*` | various | Headless UI primitives for shadcn/ui |
| `tailwind-merge` + `clsx` | ^3.3.1 / ^2.1.1 | Conditional className merging |
| `class-variance-authority` | ^0.7.1 | Variant-based component styling |
| `lucide-react` | ^0.542.0 | Icon library |
| `server-only` | ^0.0.1 | Build-time guard to prevent client imports |

---

## 16. Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbopack` | Start dev server with Turbopack |
| `build` | `next build --turbopack` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Run ESLint |
| `audit:ci` | `npm audit --audit-level=moderate` | Check for vulnerable dependencies |

---

## 17. Extension Points

| Area | How to Extend |
|---|---|
| **New public pages** | Add routes to `src/app/(app)/` route group |
| **New protected pages** | Add routes to `src/app/(protected)/` — automatically wrapped in auth check + AppShell |
| **New AI provider** | See Section 6.3 — implement `IAIAdapter`, register in factory |
| **Server Actions** | Add to `src/lib/actions/` (currently empty) |
| **Database models** | Add Firestore collections + rules in `firestore.rules` |
| **File uploads** | Add storage paths + rules in `storage.rules` |
| **Shared components** | Add to `src/components/shared/` |
| **New shadcn/ui components** | Run `npx shadcn@latest add <component>` — auto-installs to `src/components/ui/` |
| **Custom styles** | Add to `src/styles/` or extend `globals.css` |
| **Push notifications** | FCM service worker already in `public/firebase-messaging-sw.js` |

---

## 18. Conventions & Patterns

| Convention | Description |
|---|---|
| **Path alias** | `@/*` maps to `./src/*` — use for all imports |
| **Route groups** | Parenthesized folders `(auth)`, `(protected)` — layout boundaries without URL segments |
| **Server components by default** | Only add `'use client'` when browser APIs or interactivity is needed |
| **Barrel exports** | Key modules (`lib/ai/index.ts`, `services/index.ts`) re-export everything from one entry point |
| **`server-only` guard** | Any file using Admin SDK or secrets must `import 'server-only'` at the top |
| **Error boundaries** | `error.tsx` at root, `(auth)`, and `(protected)` levels |
| **Loading states** | `loading.tsx` in `(protected)` for Suspense fallback |
| **API response format** | `{ success, data, error, code, timestamp }` via `firebaseHandler()` |
| **Structured logging** | JSON to stdout for cloud logging — `{ type: 'AI_AUDIT', ...fields }` |
| **Environment isolation** | Separate Firebase collections per environment (`uat_users` / `prod_users`) |
