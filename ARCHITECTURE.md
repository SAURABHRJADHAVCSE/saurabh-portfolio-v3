# Next.js Starter Template — Architecture Documentation

> A production-ready Next.js 16 starter with Firebase Auth, multi-provider AI adapters, PWA support, and defense-in-depth security hardening.

---

## Table of Contents

1. [Stack Overview](#stack-overview)
2. [Project Structure](#project-structure)
3. [Architecture Diagram](#architecture-diagram)
4. [Core Layers](#core-layers)
   - [App Router & Routing](#app-router--routing)
   - [Authentication System](#authentication-system)
   - [AI Adapter Layer](#ai-adapter-layer)
   - [Firebase Integration](#firebase-integration)
   - [Security Hardening](#security-hardening)
   - [PWA Support](#pwa-support)
   - [UI & Theming](#ui--theming)
5. [Design Patterns Used](#design-patterns-used)
6. [API Routes](#api-routes)
7. [Environment & Configuration](#environment--configuration)
8. [Detailed File Reference](#detailed-file-reference)
9. [Ratings & Scorecard](#ratings--scorecard)
10. [Strengths](#strengths)
11. [Weaknesses & Improvement Areas](#weaknesses--improvement-areas)
12. [Final Verdict](#final-verdict)

---

## Stack Overview

| Layer             | Technology                            | Version    |
| ----------------- | ------------------------------------- | ---------- |
| Framework         | Next.js (App Router, Turbopack)       | 16.1.6     |
| UI Runtime        | React (Server Components)             | 19.2.4     |
| Language          | TypeScript (strict mode)              | —          |
| Auth & Database   | Firebase Auth + Firestore + Storage   | 12.2.1 / Admin 13.6.1 |
| AI Providers      | Gemini (`@google/genai`), Kie.AI (REST) | latest   |
| Rate Limiting     | Upstash Redis (sliding-window)        | 2.0.8      |
| UI Components     | Tailwind CSS v4, shadcn/ui (new-york) | —          |
| Form Handling     | Zod v4 + react-hook-form              | 4.1.5 / 7.62 |
| PWA               | `@ducanh2912/next-pwa`                | —          |
| SEO               | Next.js built-in metadata API         | —          |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public auth pages (login, signup, forgot-password)
│   │   ├── layout.tsx            # Redirects authenticated users to /profile
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (protected)/              # Auth-gated pages
│   │   ├── layout.tsx            # Redirects unauthenticated users to /login
│   │   ├── profile/page.tsx
│   │   ├── change-password/page.tsx
│   │   ├── delete-account/page.tsx
│   │   └── ai-test/page.tsx
│   ├── api/                      # API Route Handlers
│   │   ├── ai/test/route.ts      # AI generation endpoint (text, image, video)
│   │   ├── ai/video-proxy/route.ts  # Server-side video download proxy
│   │   └── auth/session/route.ts # Session cookie management + CSRF
│   ├── layout.tsx                # Root layout (fonts, providers, PWA prompt)
│   ├── page.tsx                  # Landing page
│   ├── manifest.ts               # PWA web manifest
│   ├── robots.ts                 # SEO robots.txt
│   └── sitemap.ts                # SEO sitemap
├── components/
│   ├── ai-test/                  # AI playground UI (ModelPicker, PromptForm, ResultPanel)
│   ├── auth/                     # Auth forms (Login, Signup, Profile, etc.)
│   ├── layout/                   # AppShell for protected pages
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── PwaInstallPrompt.tsx      # PWA install banner
│   ├── ThemeProvider.tsx         # next-themes wrapper
│   └── ThemeToggle.tsx           # Light/Dark/System switcher
├── contexts/
│   └── AuthContext.tsx           # Client-side auth state + session sync
├── lib/
│   ├── ai/                       # Multi-provider AI adapter system
│   │   ├── adapter.factory.ts    # Factory + singleton cache
│   │   ├── adapter.interface.ts  # IAIAdapter contract
│   │   ├── adapters/             # Gemini & KieAI implementations
│   │   ├── circuit-breaker.ts    # 3-state circuit breaker
│   │   ├── rate-limiter.ts       # In-memory sliding-window limiter
│   │   ├── prompt-safety.ts      # Jailbreak/injection detection
│   │   ├── audit-logger.ts       # SHA-256 prompt hashing + structured logs
│   │   ├── kieai-models.ts       # 50+ model catalog
│   │   └── types.ts              # Provider-agnostic type system
│   ├── auth/
│   │   ├── config.ts             # Password rules + strength checker
│   │   └── server.ts             # Server-only auth utils (taint API)
│   ├── firebase/
│   │   ├── admin.ts              # Admin SDK singleton
│   │   ├── firebase.ts           # Client SDK init
│   │   ├── handler.ts            # 40+ error code mapping
│   │   ├── config/               # Environment configs (UAT/PROD)
│   │   └── services/             # AuthService + APIBook facade
│   ├── validations/
│   │   └── auth.ts               # Zod v4 schemas for all auth forms
│   ├── rate-limit.ts             # Upstash Redis rate limiter
│   └── utils.ts                  # cn() class merge helper
├── instrumentation.ts            # Next.js instrumentation hook
└── proxy.ts                      # Edge-level route protection (replaces middleware)
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Auth     │  │ AI Test  │  │ Theme     │  │ PWA Install  │  │
│  │ Forms    │  │ Client   │  │ Toggle    │  │ Prompt       │  │
│  └────┬─────┘  └────┬─────┘  └───────────┘  └──────────────┘  │
│       │              │                                          │
│  ┌────▼──────────────▼─────────────────────────────────────┐   │
│  │              AuthContext (Client State)                   │   │
│  │  • onAuthStateChanged listener                           │   │
│  │  • Session cookie sync (POST/DELETE /api/auth/session)   │   │
│  │  • CSRF token management                                 │   │
│  │  • Proactive token refresh (4-hour interval)             │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                     EDGE (proxy.ts)                             │
│  • Lightweight JWT expiry check (no crypto)                    │
│  • Route-based access control                                  │
│  • Open-redirect prevention (sanitizeRedirect)                 │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                     SERVER (Node.js)                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Route Handlers (API)                                    │   │
│  │                                                         │   │
│  │  POST /api/ai/test ──────────────────────────────┐      │   │
│  │    │ Auth → Rate Limit → Input Validation →      │      │   │
│  │    │ Model Whitelist → SSRF Check →              │      │   │
│  │    │ Prompt Safety → [AI Adapter] → Audit Log    │      │   │
│  │    │                                             │      │   │
│  │  POST /api/auth/session ──────────────────┐      │      │   │
│  │    │ CSRF Check → Rate Limit →            │      │      │   │
│  │    │ Origin Check → ID Token Verify →     │      │      │   │
│  │    │ Create Session Cookie                │      │      │   │
│  │  └────────────────────────────────────────┘      │      │   │
│  └──────────────────────────────────────────────────┘      │   │
│                                                            │   │
│  ┌──────────────────────────────────────────────────────┐  │   │
│  │ AI Adapter Layer                                     │  │   │
│  │  ┌──────────────┐  ┌──────────────┐                  │  │   │
│  │  │ Gemini       │  │ KieAI        │                  │  │   │
│  │  │ Adapter      │  │ Adapter      │                  │  │   │
│  │  │ (SDK)        │  │ (REST)       │                  │  │   │
│  │  └──────┬───────┘  └──────┬───────┘                  │  │   │
│  │         │                  │                         │  │   │
│  │   ┌─────▼──────────────────▼──────┐                  │  │   │
│  │   │  Circuit Breaker              │                  │  │   │
│  │   │  Rate Limiter (in-memory)     │                  │  │   │
│  │   │  Prompt Safety Filter         │                  │  │   │
│  │   │  Audit Logger (SHA-256)       │                  │  │   │
│  │   └───────────────────────────────┘                  │  │   │
│  └──────────────────────────────────────────────────────┘  │   │
│                                                               │   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Server Components (Auth Guards)                        │   │
│  │  • getCurrentUser() — cached, tainted                  │   │
│  │  • Route group layouts redirect if auth state wrong    │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Firebase     │  │ Gemini API   │  │ Kie.AI API           │  │
│  │ Auth/DB/     │  │ (Google)     │  │ (REST)               │  │
│  │ Storage      │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐                                              │
│  │ Upstash      │                                              │
│  │ Redis        │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Layers

### App Router & Routing

The project uses **Next.js 16 App Router** with route groups for authorization separation:

| Group          | Purpose                    | Auth Guard                        |
| -------------- | -------------------------- | --------------------------------- |
| `/`            | Public landing             | None                              |
| `(auth)/`      | Login, Signup, Forgot Pass | Redirects to `/profile` if authed |
| `(protected)/` | Profile, AI Test, Settings | Redirects to `/login` if unauthed |
| `api/`         | REST endpoints             | Per-route auth verification       |

**Edge Protection:** `proxy.ts` (Next.js 16's replacement for middleware) performs lightweight JWT expiry checks at the edge before requests reach server components. Full cryptographic verification happens server-side with Firebase Admin SDK.

**Error Handling:** Three-tier error boundary nesting — global (`app/error.tsx`) → route group (`(auth)/error.tsx`, `(protected)/error.tsx`) → individual components catch progressively more specific failures.

### Authentication System

```
                                    ┌──────────────────────────┐
                                    │   Firebase Auth          │
                                    │   (Identity Provider)    │
                                    └──────────┬───────────────┘
                                               │
                        ┌──────────────────────▼───────────────────────┐
                        │                AuthContext                    │
                        │  • Listens to onAuthStateChanged             │
                        │  • Syncs ID token → session cookie           │
                        │  • CSRF double-submit cookie                 │
                        │  • 4-hour proactive token refresh            │
                        └──────────────────────┬───────────────────────┘
                                               │
                   ┌───────────────────────────▼────────────────────────────┐
                   │                  Session API Route                     │
                   │  GET  → Issue CSRF token cookie                       │
                   │  POST → Verify ID token → Create 5-day session cookie │
                   │  DELETE → Clear session cookie                        │
                   └───────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Session cookies** (5-day TTL, `httpOnly`, `secure`, `sameSite=lax`) instead of client-side tokens — prevents XSS token theft
- **CSRF double-submit cookie** — request must include `X-CSRF-Token` header matching `csrfToken` cookie
- **ID token freshness** — rejects tokens older than 5 minutes
- **Origin/Referer validation** — blocks cross-origin requests
- **React Taint API** — `experimental_taintUniqueValue` prevents session tokens from leaking to client components
- **Request deduplication** — `React.cache()` wraps `getCurrentUser()` so multiple server components in one render don't create redundant Firebase Admin calls

**Auth Features:**
- Email/password registration with password strength scoring
- Google OAuth (sign-in + sign-up)
- Forgot password flow
- Change password with re-auth
- Account deletion with provider-aware re-authentication (Google popup or email/password)
- User profile with Firestore document sync

### AI Adapter Layer

The AI system follows a **Strategy/Adapter pattern** with enterprise resilience features:

```
┌──────────────────────────────────────────────────────────┐
│                     IAIAdapter Interface                   │
│  • generateText(request): Promise<TextResult>             │
│  • generateImage(request): Promise<ImageResult>           │
│  • generateVideo(request): Promise<VideoResult>           │
│  • getSupportedCapabilities(): AICapability[]              │
└──────────────────┬──────────────────────┬────────────────┘
                   │                      │
          ┌────────▼────────┐   ┌─────────▼───────┐
          │ GeminiAdapter   │   │ KieAIAdapter     │
          │ • SDK-based     │   │ • REST-based     │
          │ • Text/Image/   │   │ • Async task     │
          │   Video         │   │   polling        │
          │ • Imagen 3 +    │   │ • 50+ models     │
          │   Veo 3.1       │   │ • Flux, Kling,   │
          └─────────────────┘   │   Sora, etc.     │
                                └──────────────────┘
```

**Resilience Stack (per-adapter):**

| Layer           | Purpose                               | Configuration                          |
| --------------- | ------------------------------------- | -------------------------------------- |
| Circuit Breaker | Prevents cascading failures           | 5 failures → 60s OPEN state            |
| Rate Limiter    | In-memory sliding window              | Gemini: 14/60s, KieAI: 18/10s         |
| Prompt Safety   | Jailbreak/injection detection         | ~10 regex patterns, Unicode normalization |
| Audit Logger    | Compliance logging                    | SHA-256 prompt hashing, structured JSON |

**Supported Capabilities:**

| Provider | Text Models | Image Models | Video Models |
| -------- | ----------- | ------------ | ------------ |
| Gemini   | 4 (Flash/Pro 2.5-3) | 6 (Imagen 3, native) | 3 (Veo 3.1) |
| Kie.AI   | 5+ chat models | 22+ (Flux, Seedream, Ideogram, etc.) | 24+ (Kling, Sora, Hailuo, etc.) |

### Firebase Integration

**Server-side:**
- `firebase-admin` singleton with lazy initialization
- Supports service account JSON from env var OR GCP Application Default Credentials
- `import 'server-only'` prevents accidental client-side import

**Client-side:**
- `firebase` SDK with environment-aware configuration
- `verifyEnvironmentConfiguration()` validates env vars in dev mode

**Firestore Security Rules:**
- Deny-all default, explicit allows
- Owner-only read/write on user collections
- Immutable field protection (`uid`, `createdAt`, `environment`)
- Separate UAT (`uat_users`) and PROD (`prod_users`) collections

**Storage Security Rules:**
- User avatars: auth read, owner write, 5MB max, `image/*` only
- User uploads: owner-only, 10MB max

**Error Handling:**
- `firebaseHandler()` wraps every Firebase operation
- Maps 40+ error codes to user-friendly messages
- Never leaks internal error details to the client

### Security Hardening

This project implements **defense-in-depth** across multiple layers:

#### Edge Level (proxy.ts)
- Lightweight JWT structure + expiry check
- Route-based access control
- Open-redirect prevention (`sanitizeRedirect()` blocks protocol-relative URLs)

#### HTTP Headers (next.config.ts)
- **CSP** — Scripts, styles, images, connections, frames all restricted
- **X-Frame-Options: SAMEORIGIN** — Clickjacking protection
- **X-Content-Type-Options: nosniff** — MIME sniffing prevention
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** — Denies camera, microphone, geolocation, payment APIs
- **HSTS** — Strict Transport Security (production only)

#### API Level (route handlers)
- Auth verification on every protected route
- CSRF double-submit cookie validation
- Origin/Referer header validation
- Upstash Redis rate limiting (15/min for session, 20/min for AI)
- Input length limits + whitelist validation
- Model whitelist enforcement
- **SSRF protection** — Blocks private IPs (`10.*`, `172.16-31.*`, `192.168.*`, `127.*`, `169.254.*`), metadata endpoints, allows only `gs://` and `https://`
- Error message sanitization — strips Windows/Unix paths, API keys, Google API URLs, quota details

#### AI Level
- Prompt safety pre-screening (~10 regex jailbreak patterns)
- Unicode normalization (NFKD + zero-width stripping) to defeat obfuscation
- Audit logging with SHA-256 prompt hashing (never stores plaintext prompts)
- Circuit breaker per provider

### PWA Support

- Web manifest generated via Next.js `manifest.ts`
- Service worker for FCM background push notifications
- `@ducanh2912/next-pwa` plugin for cache + offline support
- Smart install prompt:
  - Only shown when `beforeinstallprompt` event fires (proving the app is installable and not yet installed)
  - Falls back to manual install instructions on iOS Safari
  - Persists installed state in `localStorage`
  - Session-scoped dismiss (`sessionStorage`)
  - Detects standalone mode via `display-mode` media query + `navigator.standalone`

### UI & Theming

- **shadcn/ui (New York style)** — 20+ UI primitives including Button, Card, Dialog, Sheet, Tooltip, Form, Select, Tabs, etc.
- **Tailwind CSS v4** — Utility-first styling with PostCSS integration
- **Three Google Fonts** — Barlow (headings), Rubik (body), Geist Mono (code)
- **Dark mode** — `next-themes` with system preference detection + manual toggle
- **Toast notifications** — Sonner for non-blocking feedback
- **Responsive** — Mobile-first layouts, auth pages use hidden branding panel on small screens

---

## Design Patterns Used

| Pattern                      | Where Used                                | Quality |
| ---------------------------- | ----------------------------------------- | ------- |
| **Factory + Singleton**      | AI adapter creation (`adapter.factory.ts`) | ★★★★★  |
| **Strategy/Adapter**         | `IAIAdapter` + Gemini/KieAI implementations | ★★★★★  |
| **Circuit Breaker**          | Per-adapter fault tolerance               | ★★★★☆  |
| **Sliding-Window Rate Limit** | In-memory + Redis-backed (dual layer)    | ★★★★★  |
| **CSRF Double-Submit Cookie** | Session API + AuthContext                | ★★★★★  |
| **Facade**                   | `APIBook` in `services/index.ts`          | ★★★★☆  |
| **Defense-in-Depth**         | AI route: auth → rate limit → validation → whitelist → SSRF → safety → audit → sanitization | ★★★★★  |
| **React Taint API**          | `server.ts` taints session tokens         | ★★★★★  |
| **Error Boundary Nesting**   | Global → Route Group → Component          | ★★★★☆  |
| **Server Component Guards**  | Route group layouts with `redirect()`     | ★★★★☆  |
| **Request Deduplication**    | `React.cache()` on `getCurrentUser()`     | ★★★★★  |
| **Environment Switching**    | `IS_PRODUCTION` in `environments.ts`      | ★★★☆☆  |

---

## API Routes

### `POST /api/ai/test`
**Purpose:** AI content generation (text, image, video)

**Security Chain:**
1. Session cookie verification (`verifySessionCookie`)
2. Upstash rate limiting (20 req/min/user)
3. Input validation (length limits, whitelist checks)
4. Model whitelist enforcement
5. SSRF protection for image URLs
6. Prompt safety pre-filter
7. AI adapter execution
8. Audit logging (SHA-256 hashed prompt)
9. Error message sanitization

### `GET /api/ai/test`
**Purpose:** Returns the full model catalog

### `GET /api/ai/video-proxy`
**Purpose:** Proxies Gemini video downloads (keeps API key server-side)

**Security:** Auth-gated, regex fileId validation, 100MB max, 30s upstream timeout

### `GET /api/auth/session`
**Purpose:** Issues CSRF token cookie (random UUID)

### `POST /api/auth/session`
**Purpose:** Creates Firebase session cookie (5-day TTL)

**Security:** CSRF validation, origin check, rate limiting (15/min/IP), ID token freshness (<5 min)

### `DELETE /api/auth/session`
**Purpose:** Clears session cookie (logout)

---

## Environment & Configuration

The project supports **UAT** and **PROD** environments controlled by a single boolean:

```typescript
// src/lib/firebase/config/environments.ts
export const IS_PRODUCTION = false; // Toggle to switch env
```

Each environment has its own:
- Firebase project config
- Firestore user collection (`uat_users` / `prod_users`)
- AI provider settings (models, rate limits, polling intervals)
- API keys (via env vars)

**Required Environment Variables:**
- `NEXT_PUBLIC_FIREBASE_*` — Client-side Firebase config (7 vars)
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Server-side admin SDK (JSON string)
- `GEMINI_API_KEY` / `KIEAI_API_KEY` — AI provider keys
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Rate limiting
- `NEXT_PUBLIC_APP_URL` — For metadata/SEO

---

## Detailed File Reference

<details>
<summary><strong>Click to expand full file reference (70+ files)</strong></summary>

### App Router Pages

| File | Purpose |
| ---- | ------- |
| `src/app/page.tsx` | Landing page with feature grid and getting-started guide |
| `src/app/layout.tsx` | Root layout — fonts, providers, Toaster, PWA prompt |
| `src/app/error.tsx` | Global error boundary with retry |
| `src/app/not-found.tsx` | Custom 404 page |
| `src/app/robots.ts` | SEO robots.txt — disallows private routes |
| `src/app/sitemap.ts` | SEO sitemap with public pages |
| `src/app/manifest.ts` | PWA manifest (standalone, SVG icons) |

### Auth Pages

| File | Purpose |
| ---- | ------- |
| `src/app/(auth)/layout.tsx` | Two-column auth layout, redirects authed users |
| `src/app/(auth)/login/page.tsx` | Login with Suspense boundary |
| `src/app/(auth)/signup/page.tsx` | Registration page |
| `src/app/(auth)/forgot-password/page.tsx` | Password reset email page |
| `src/app/(auth)/error.tsx` | Auth-scoped error boundary |
| `src/app/(auth)/loading.tsx` | Auth spinner |

### Protected Pages

| File | Purpose |
| ---- | ------- |
| `src/app/(protected)/layout.tsx` | Auth guard + AppShell wrapper |
| `src/app/(protected)/profile/page.tsx` | User profile display |
| `src/app/(protected)/change-password/page.tsx` | Password change form |
| `src/app/(protected)/delete-account/page.tsx` | Account deletion flow |
| `src/app/(protected)/ai-test/page.tsx` | AI playground page |
| `src/app/(protected)/error.tsx` | Protected-area error boundary |
| `src/app/(protected)/loading.tsx` | Protected spinner |

### API Routes

| File | Purpose |
| ---- | ------- |
| `src/app/api/ai/test/route.ts` | AI generation endpoint (8-layer security) |
| `src/app/api/ai/video-proxy/route.ts` | Server-side video proxy |
| `src/app/api/auth/session/route.ts` | Session cookie + CSRF management |

### Components

| File | Purpose |
| ---- | ------- |
| `src/components/auth/LoginForm.tsx` | Email/password + Google OAuth login |
| `src/components/auth/SignupForm.tsx` | Registration + password strength |
| `src/components/auth/ForgotPasswordForm.tsx` | Reset password email form |
| `src/components/auth/ChangePasswordForm.tsx` | Change password form |
| `src/components/auth/DeleteAccountForm.tsx` | Two-step deletion with re-auth |
| `src/components/auth/UserProfile.tsx` | Profile display + sign-out |
| `src/components/auth/password-input.tsx` | Password input with strength meter |
| `src/components/layout/AppShell.tsx` | Server component layout shell |
| `src/components/ThemeProvider.tsx` | next-themes client wrapper |
| `src/components/ThemeToggle.tsx` | Theme switcher dropdown |
| `src/components/PwaInstallPrompt.tsx` | Smart PWA install banner |
| `src/components/ai-test/AITestClient.tsx` | AI playground orchestrator |
| `src/components/ai-test/catalog.ts` | Client-safe model catalog |
| `src/components/ai-test/ModelPicker.tsx` | Capability/provider/model selector |
| `src/components/ai-test/PromptForm.tsx` | Prompt input with advanced options |
| `src/components/ai-test/ResultPanel.tsx` | Multi-format result renderer |
| `src/components/ai-test/types.ts` | AI test type definitions |

### Library

| File | Purpose |
| ---- | ------- |
| `src/lib/utils.ts` | `cn()` class merge helper |
| `src/lib/rate-limit.ts` | Upstash Redis rate limiter |
| `src/lib/ai/types.ts` | Provider-agnostic AI types |
| `src/lib/ai/adapter.interface.ts` | `IAIAdapter` contract |
| `src/lib/ai/adapter.factory.ts` | Factory + singleton cache |
| `src/lib/ai/adapters/gemini.adapter.ts` | Gemini SDK adapter |
| `src/lib/ai/adapters/kieai.adapter.ts` | KieAI REST adapter |
| `src/lib/ai/circuit-breaker.ts` | 3-state circuit breaker |
| `src/lib/ai/rate-limiter.ts` | In-memory sliding-window |
| `src/lib/ai/prompt-safety.ts` | Jailbreak detection |
| `src/lib/ai/audit-logger.ts` | SHA-256 audit logging |
| `src/lib/ai/kieai-models.ts` | 50+ model catalog |
| `src/lib/ai/index.ts` | Barrel exports |
| `src/lib/auth/config.ts` | Auth config + password strength |
| `src/lib/auth/server.ts` | Server-only auth + taint API |
| `src/lib/firebase/admin.ts` | Admin SDK singleton |
| `src/lib/firebase/firebase.ts` | Client SDK init |
| `src/lib/firebase/handler.ts` | 40+ error code mapping |
| `src/lib/firebase/config/environments.ts` | UAT/PROD environment config |
| `src/lib/firebase/config/types.ts` | Config type definitions |
| `src/lib/firebase/services/auth.service.ts` | Complete auth service |
| `src/lib/firebase/services/index.ts` | APIBook facade |
| `src/lib/validations/auth.ts` | Zod v4 form schemas |

### Infrastructure

| File | Purpose |
| ---- | ------- |
| `src/proxy.ts` | Edge route protection |
| `src/instrumentation.ts` | Next.js instrumentation hook |
| `next.config.ts` | Security headers + PWA + Turbopack |
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Storage security rules |
| `public/firebase-messaging-sw.js` | FCM service worker |

</details>

---

## Ratings & Scorecard

| Category                    | Rating       | Score |
| --------------------------- | ------------ | ----- |
| **Architecture & Patterns** | ★★★★★        | 9.5/10 |
| **Security**                | ★★★★★        | 9.5/10 |
| **Type Safety**             | ★★★★★        | 9/10  |
| **Error Handling**          | ★★★★☆        | 8.5/10 |
| **Code Organization**      | ★★★★★        | 9/10  |
| **AI Integration**         | ★★★★★        | 9/10  |
| **Authentication**         | ★★★★★        | 9/10  |
| **PWA Implementation**     | ★★★★☆        | 8/10  |
| **SEO**                    | ★★★★☆        | 7.5/10 |
| **Testing**                | ★☆☆☆☆        | 1/10  |
| **Documentation (inline)** | ★★★★★        | 9/10  |
| **DevOps / CI/CD**         | ★★☆☆☆        | 3/10  |
| **Accessibility**          | ★★★☆☆        | 5/10  |
| **State Management**       | ★★★★☆        | 7.5/10 |
| **Performance**            | ★★★★☆        | 7.5/10 |
|                             | **Overall**  | **7.5/10** |

---

## Strengths

### 1. Exceptional Security Posture (9.5/10)
The project demonstrates professional-grade security awareness rarely seen in starter templates:
- **8-layer defense-in-depth** on the AI route (auth → rate limit → validation → whitelist → SSRF → prompt safety → audit → error sanitization)
- **CSRF double-submit cookie** — not just token-based but validated against cookie
- **React Taint API** — cutting-edge protection against accidental server secret leakage
- **SSRF protection** — blocks private IPs, metadata endpoints, validates URL schemes
- **Error sanitization** — strips file paths, API keys, and quota details from responses
- **Comprehensive CSP headers** via `next.config.ts`
- **Firestore rules** with immutable field protection

### 2. AI Adapter Architecture (9/10)
Enterprise-quality multi-provider AI system:
- Clean **Strategy/Adapter pattern** via `IAIAdapter` interface
- **Factory + Singleton** with cache keyed by `provider:apiKey`
- **Circuit breaker** prevents cascading failures
- **Dual-layer rate limiting** (in-memory per-adapter + Redis per-user)
- **Prompt safety** with Unicode normalization to defeat homoglyph attacks
- **Privacy-first audit logging** — SHA-256 hashed prompts, never plaintext
- Extensible — adding a new provider requires only implementing `IAIAdapter`

### 3. Authentication Completeness (9/10)
Full auth lifecycle without third-party auth libraries:
- Email + Google OAuth dual path
- Session cookie architecture (superior to client-side JWT)
- Proactive token refresh
- Password strength scoring with email-leak detection
- Provider-aware re-authentication for sensitive operations
- Complete CRUD for user profiles in Firestore

### 4. Code Quality & Organization (9/10)
- **Strict TypeScript** throughout — no `any` leaks in core code
- **Zod v4** schemas ensure runtime validation matches TypeScript types
- **Barrel exports** (`index.ts`) for clean import paths
- **`import 'server-only'`** guards on all server modules
- **Excellent JSDoc comments** with `@see` links

### 5. Modern Stack Adoption (9/10)
- Next.js 16 with `proxy.ts` (replacing middleware)
- React 19 with Server Components
- Zod v4 with `.check()` API
- Tailwind CSS v4
- `experimental_taintUniqueValue`

---

## Weaknesses & Improvement Areas

### 1. Zero Test Coverage (Critical — 1/10)
**The single biggest weakness.** No unit tests, integration tests, or E2E tests exist anywhere in the project. For a starter template showcasing enterprise patterns, this is a significant gap.

**Impact:** All the security patterns (CSRF, rate limiting, prompt safety, circuit breaker) are untested. A single regression could silently break defence layers.

**Recommendation:**
- Add Vitest for unit tests (circuit breaker, rate limiter, prompt safety, password strength, validation schemas)
- Add Playwright for E2E tests (auth flows, AI generation, session management)
- Add API route integration tests (CSRF validation, rate limit enforcement)
- Target: 80%+ coverage on `src/lib/`

### 2. No CI/CD Pipeline (3/10)
No GitHub Actions, Vercel deployment config, or automated quality gates.

**Recommendation:**
- Add `.github/workflows/ci.yml` with lint, type-check, test, build steps
- Add deployment previews for PRs
- Add `audit:ci` integration into pipeline

### 3. Environment Switching is a Boolean (5/10)
```typescript
export const IS_PRODUCTION = false; // A manual boolean toggle
```
This requires a code change to switch environments. In production, this could be accidentally left as `false`.

**Recommendation:**
- Use `process.env.NODE_ENV` or a dedicated `APP_ENV` environment variable
- Remove the hardcoded boolean entirely

### 4. No Accessibility (a11y) Strategy (5/10)
While shadcn/ui provides baseline accessibility, the project lacks:
- No `aria-live` regions for dynamic content (AI results, auth status)
- No skip navigation links
- No visible focus indicators beyond browser defaults
- No keyboard navigation testing
- AI test results (images, videos) lack descriptive alt text

**Recommendation:**
- Add `aria-live="polite"` to AI result panel
- Add skip-to-content link in AppShell
- Test with screen reader (NVDA/VoiceOver)
- Add alt text generation for AI images

### 5. Client-Side State Management is Minimal (7/10)
Only `AuthContext` exists. The AI test page manages complex state (form values, results, loading) via `useState` in `AITestClient`. This works now but won't scale.

**Recommendation:**
- Consider Zustand or Jotai for cross-component state if the app grows
- Use `useReducer` for the AI test page's multi-field state
- Current approach is fine for a starter template, but document the scaling path

### 6. Audit Logger Outputs to Console (6/10)
```typescript
console.log(JSON.stringify(entry)); // Current implementation
```
Good for development, inadequate for production compliance.

**Recommendation:**
- Integrate with Firestore, BigQuery, or a log aggregation service (Datadog, etc.)
- Add log rotation/retention policy
- Add structured log shipping in production

### 7. In-Memory Rate Limiter Resets on Cold Start (6/10)
The per-adapter rate limiter uses in-memory state. In serverless environments, each cold start resets the window. This is documented but still a gap.

**Recommendation:**
- Acceptable for per-adapter throttling (supplements Redis layer)
- Document that the Upstash Redis layer is the primary rate limit enforcement
- Consider Redis-backed adapter limiting if abuse scaling becomes an issue

### 8. No Loading States for Server Components (7/10)
Route-level `loading.tsx` exists, but individual server components within protected pages don't have granular loading states via `Suspense`.

**Recommendation:**
- Add `Suspense` boundaries around data-fetching server components
- Use shadcn `Skeleton` components for loading states

### 9. SEO is Basic (7.5/10)
Has `robots.ts`, `sitemap.ts`, and metadata, but lacks:
- No structured data (JSON-LD)
- No dynamic OG images
- No canonical URL management
- Sitemap only lists 4 pages

**Recommendation:**
- Add JSON-LD schema for the landing page
- Use Next.js `generateMetadata` for dynamic pages
- Add `next/og` for dynamic OG image generation

### 10. Firebase Messaging SW Uses Hardcoded SDK Version (Minor)
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/11.10.0/...');
```
This will drift from `package.json` Firebase version (12.2.1).

**Recommendation:**
- Use a build step to inject the current Firebase version
- Or use the modular SDK in the service worker

### 11. No Database Migration Strategy
Firestore collections (`uat_users`, `prod_users`) have no schema versioning or migration tooling.

**Recommendation:**
- Add a `schemaVersion` field to documents
- Create migration scripts for schema changes

### 12. Missing Input Sanitization Library
Prompt safety uses custom regex. While comprehensive, it's a DIY approach vs. battle-tested libraries.

**Recommendation:**
- Consider integrating `dompurify` for HTML sanitization if rich text is ever supported
- The current regex approach is fine for plaintext prompts

---

## Final Verdict

**Overall: 7.5/10 — Strong architecture, needs testing and operational maturity**

This is an **impressively well-architected starter template** that demonstrates deep knowledge of Next.js, Firebase, and security best practices. The AI adapter layer in particular is production-grade with its interface-based design, circuit breakers, and multi-layer security.

The project's **security posture is exceptional** for a starter template — CSRF protection, SSRF prevention, prompt safety, React Taint API, and comprehensive error sanitization are features many production apps lack.

However, the **complete absence of tests** is the critical gap preventing this from being truly production-ready. The sophisticated security patterns are only as reliable as their test coverage, and currently that coverage is zero. Adding a solid test suite would immediately elevate this to a 9/10+ starter.

**Who should use this:** Teams starting a new Next.js + Firebase project who want security, auth, and AI integration built-in. Copy the architecture, but **add tests before deploying to production**.

**Bottom line:** Excellent architecture, excellent patterns, excellent security — just needs tests, CI/CD, and operational polish to match the quality of the code itself.
