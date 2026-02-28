'use client';

import { useAuth } from '@/contexts/AuthContext';
import { APIBook } from '@/lib/firebase/services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function UserProfile() {
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    const result = await APIBook.auth.signOut();
    if (!result.success) {
      toast.error(result.error || 'Logout failed');
      setLoggingOut(false);
    }
  };

  const initials = (user.displayName || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fmt = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : 'N/A';

  const isGoogle = user.providerData[0]?.providerId === 'google.com';

  return (
    <div className="grid gap-8">
      {/* Identity */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{user.displayName || 'Anonymous User'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}>
          <LogOut className="mr-2 size-4" />
          {loggingOut ? 'Signing out\u2026' : 'Sign Out'}
        </Button>
      </div>

      {/* Details */}
      <div className="grid gap-3 rounded-lg border p-4 text-sm">
        <Row label="Email Verified">
          <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
            {user.emailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </Row>
        <Row label="Provider">
          <Badge variant="outline">{isGoogle ? 'Google' : 'Email'}</Badge>
        </Row>
        <Row label="User ID">
          <span className="font-mono text-xs break-all">{user.uid}</span>
        </Row>
        <Row label="Created">{fmt(user.metadata.creationTime)}</Row>
        <Row label="Last Sign In">{fmt(user.metadata.lastSignInTime)}</Row>
      </div>

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        {!isGoogle && (
          <Link href="/change-password">
            <Button variant="outline" className="w-full">Change Password</Button>
          </Link>
        )}
        <Link href="/delete-account">
          <Button variant="destructive" className="w-full">Delete Account</Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
