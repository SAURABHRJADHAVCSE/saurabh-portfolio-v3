'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { checkPasswordStrength } from '@/lib/auth/config';

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

const barStyles: Record<string, { label: string; color: string; width: string }> = {
  weak: { label: 'Weak', color: 'bg-destructive', width: 'w-1/4' },
  fair: { label: 'Fair', color: 'bg-muted-foreground', width: 'w-2/4' },
  good: { label: 'Good', color: 'bg-primary', width: 'w-3/4' },
  strong: { label: 'Strong', color: 'bg-primary', width: 'w-full' },
};

function getStrengthKey(score: number) {
  if (score < 2) return 'weak';
  if (score < 3) return 'fair';
  if (score < 4) return 'good';
  return 'strong';
}

export default function PasswordInput({
  value, onChange, placeholder = 'Enter your password',
  showStrength = false, email, disabled, className, id,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? checkPasswordStrength(value, email) : null;
  const meta = strength ? barStyles[getStrengthKey(strength.score)] : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className={`h-9 w-full rounded-md border border-input bg-transparent px-3 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring disabled:opacity-50 ${className ?? ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setVisible(v => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {showStrength && value && strength && meta && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Strength</span>
            <span className={`font-medium ${strength.score < 2 ? 'text-destructive' : 'text-foreground'}`}>
              {meta.label}
            </span>
          </div>

          <div className="h-1 w-full rounded-full bg-muted">
            <div className={`h-1 rounded-full transition-all duration-300 ${meta.color} ${meta.width}`} />
          </div>

          {strength.feedback.length > 0 && (
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {strength.feedback.map((fb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="size-1 shrink-0 rounded-full bg-muted-foreground" />
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
