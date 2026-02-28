import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Firebase Authentication",
    items: [
      "Email / password registration & login",
      "Google OAuth (one-tap sign-in)",
      "Forgot-password flow with email reset",
      "Session cookies (5-day, httpOnly, revocable)",
      "Server-side auth via Firebase Admin SDK",
      "Proxy-level route protection (Next.js 16 proxy.ts)",
    ],
  },
  {
    title: "User Management",
    items: [
      "Profile page with Firestore user data",
      "Change password (re-authentication required)",
      "Delete account with data cleanup",
      "Auth state sync (client ↔ server cookie)",
    ],
  },
  {
    title: "AI Adapter Layer",
    items: [
      "Provider-agnostic interface (text / image / video)",
      "Gemini & Kie.AI adapters included",
      "One-line provider switching via config",
      "Rate limiter, circuit breaker, prompt safety filter",
      "Audit logging for every AI request",
      "Video proxy to hide API keys from browser",
    ],
  },
  {
    title: "Security Hardened",
    items: [
      "CSP, HSTS, X-Frame-Options, Permissions-Policy headers",
      "CSRF origin check on session endpoints",
      "Rate limiting on auth & session routes",
      "server-only guard on Admin SDK imports",
      "Firestore & Storage security rules included",
      "React Taint API enabled for secret leak prevention",
    ],
  },
  {
    title: "Modern Stack",
    items: [
      "Next.js 16 (App Router, Turbopack)",
      "React 19 with Server Components",
      "TypeScript strict mode",
      "Tailwind CSS v4 + shadcn/ui (new-york)",
      "Zod v4 validation + react-hook-form",
      "PWA-ready (@ducanh2912/next-pwa)",
    ],
  },
  {
    title: "Architecture",
    items: [
      "UAT / PROD environment config switcher",
      "Route-group layouts (auth & protected)",
      "Streaming loading.tsx + error.tsx boundaries",
      "Centralized APIBook service facade",
      "Factory pattern for AI adapters",
      "Firebase handler for consistent error handling",
    ],
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen p-6 sm:p-8 max-w-5xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="heading">Next.js Starter Template</h1>
        <p className="muted max-w-2xl mx-auto">
          Production-ready foundation with Firebase Auth, AI adapters,
          security hardening, and UAT/PROD environment switching — ready to clone and build on.
        </p>
      </header>

      <main className="space-y-10">
        {/* Feature grid */}
        <section>
          <h2 className="subheading mb-6">What&apos;s Included</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => (
              <div key={feat.title} className="border rounded-lg p-5 space-y-3">
                <h3 className="title">{feat.title}</h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  {feat.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section className="border rounded-lg p-6 space-y-4">
          <h2 className="subheading">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/profile">Profile</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/ai-test">AI Tester</Link>
            </Button>
          </div>
        </section>

        {/* Getting started */}
        <section className="border rounded-lg p-6 space-y-3">
          <h2 className="subheading">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Clone this repo and run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm install</code></li>
            <li>Copy <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env.example</code> → <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code> and fill in your Firebase + AI keys</li>
            <li>Generate shadcn/ui components: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx shadcn@latest add button card</code></li>
            <li>Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm run dev</code> and open <code className="bg-muted px-1.5 py-0.5 rounded text-xs">http://localhost:3000</code></li>
            <li>Toggle <code className="bg-muted px-1.5 py-0.5 rounded text-xs">IS_PRODUCTION</code> in <code className="bg-muted px-1.5 py-0.5 rounded text-xs">environments.ts</code> for PROD</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
