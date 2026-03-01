'use client';

import { useAuth } from '@/contexts/AuthContext';
import { APIBook } from '@/lib/firebase/services';
import { LogOut, Shield, Mail, Key, Trash2, Calendar, Fingerprint, RefreshCcw } from 'lucide-react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, email?: string | null): string {
  const src = name || email || 'U';
  return src.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d?: string): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ src, initials }: { src?: string | null; initials: string }) {
  const [imgErr, setImgErr] = useState(false);
  const showFallback = !src || imgErr;

  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm sm:size-20">
      {!showFallback ? (
        <img
          src={src!}
          alt="Profile"
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgErr(true)}
        />
      ) : (
        <span className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground sm:text-xl">
          {initials}
        </span>
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, description, children, destructive }: { title: string; icon?: React.ElementType; description?: string; children: React.ReactNode; destructive?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-xl border ${destructive ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-card'} shadow-sm transition-all`}>
      {(title || description) && (
        <div className={`border-b ${destructive ? 'border-destructive/10' : 'border-border'} px-6 py-4`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`size-5 ${destructive ? 'text-destructive' : 'text-primary'}`} />}
            <h3 className={`text-base font-semibold ${destructive ? 'text-destructive' : 'text-card-foreground'}`}>{title}</h3>
          </div>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="p-0">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, icon: Icon, value, children }: { label: string; icon?: React.ElementType; value?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border px-6 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon && <Icon className="size-4 shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground sm:text-right">
        {children || value}
      </div>
    </div>
  );
}

function StatusBadge({ active, activeText, inactiveText }: { active: boolean; activeText: string; inactiveText: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
      <span className={`mr-1.5 size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {active ? activeText : inactiveText}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserProfile() {
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    const result = await APIBook.auth.signOut();
    if (!result.success) {
      toast.error(result.error || 'Logout failed');
      setLoggingOut(false);
    }
  }, []);

  if (!user) return null;

  const initials = getInitials(user.displayName, user.email);
  const isGoogle = user.providerData[0]?.providerId === 'google.com';

  return (
    <div className="grid gap-6">
      {/* ── Identity Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar src={user.photoURL} initials={initials} />
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
              {user.displayName || 'Anonymous User'}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              <span>{user.email}</span>
              {user.emailVerified && (
                <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  (Verified)
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
        >
          <LogOut className="size-4" />
          {loggingOut ? 'Signing out\u2026' : 'Sign Out'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Account Details ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionCard title="Account Details" icon={Shield} description="Basic information about your account.">
            <InfoRow label="Account Status" icon={Shield}>
              <StatusBadge active={user.emailVerified} activeText="Verified" inactiveText="Unverified" />
            </InfoRow>

            <InfoRow label="Auth Provider" icon={Key}>
              <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">
                {isGoogle ? 'Google Account' : 'Email / Password'}
              </span>
            </InfoRow>

            <InfoRow label="User ID" icon={Fingerprint}>
              <span className="truncate break-all font-mono text-xs text-muted-foreground p-1 rounded bg-muted/30 border border-border/50 max-w-[200px] sm:max-w-none inline-block">
                {user.uid}
              </span>
            </InfoRow>
          </SectionCard>
        </div>

        {/* ── Activity & Security ───────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionCard title="Activity" icon={Calendar} description="Your recent interactions and history.">
            <InfoRow label="Member Since" icon={Calendar} value={formatDate(user.metadata.creationTime)} />
            <InfoRow label="Last Sign In" icon={RefreshCcw} value={formatDate(user.metadata.lastSignInTime)} />
          </SectionCard>

          {/* ── Danger Zone ───────────────────────────────────────────────── */}
          <SectionCard title="Security & Actions" icon={Key} description="Manage your credentials and account access.">
            <div className="flex flex-col gap-3 p-6 sm:flex-row">
              {!isGoogle && (
                <Link
                  href="/change-password"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <Key className="size-4 opacity-70" />
                  Change Password
                </Link>
              )}
              <Link
                href="/delete-account"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
              >
                <Trash2 className="size-4 opacity-90" />
                Delete Account
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
