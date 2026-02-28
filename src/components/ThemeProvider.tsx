'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Thin wrapper around next-themes ThemeProvider.
 * Keeps the root layout server-renderable (this file is 'use client').
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
