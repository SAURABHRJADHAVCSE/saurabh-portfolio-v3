import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * For simplicity, this example just includes a top bar with a theme toggle.
 * You can expand this to include a sidebar, user menu, notifications, etc.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <span className="font-semibold tracking-tight">Dashboard</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
