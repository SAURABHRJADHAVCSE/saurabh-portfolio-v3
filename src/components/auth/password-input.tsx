'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { checkPasswordStrength } from '@/lib/auth/config';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  email?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function PasswordInput({
  value, onChange, placeholder = 'Enter your password',
  showStrength = false, email, disabled, className, id,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? checkPasswordStrength(value, email) : null;

  const strengthMeta = (score: number) => {
    if (score < 2) return { label: 'Weak', bar: 'bg-destructive w-1/4' };
    if (score < 3) return { label: 'Fair', bar: 'bg-muted-foreground w-2/4' };
    if (score < 4) return { label: 'Good', bar: 'bg-primary w-3/4' };
    return { label: 'Strong', bar: 'bg-primary w-full' };
  };

  const meta = strength ? strengthMeta(strength.score) : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className={cn('pr-10', className)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 size-8 px-0"
          onClick={() => setVisible(!visible)}
          tabIndex={-1}
        >
          {visible
            ? <EyeOff className="size-4 text-muted-foreground" />
            : <Eye className="size-4 text-muted-foreground" />}
          <span className="sr-only">{visible ? 'Hide' : 'Show'} password</span>
        </Button>
      </div>

      {showStrength && value && strength && meta && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Strength</span>
            <span className={cn(
              'font-medium',
              strength.score < 2 ? 'text-destructive' : 'text-foreground',
            )}>{meta.label}</span>
          </div>

          <div className="h-1 w-full rounded-full bg-muted">
            <div className={cn('h-1 rounded-full transition-all duration-300', meta.bar)} />
          </div>

          {strength.feedback.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {strength.feedback.map((fb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-muted-foreground shrink-0" />
                  {fb}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
