import './styles.css';
import type { PropsWithChildren } from 'react';
import { surfaceTokens } from './tokens';

export function Card({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={`rounded-[1.75rem] border ${surfaceTokens.borderColor} ${surfaceTokens.cardBackground} p-4 shadow-[0_10px_30px_rgba(58,49,38,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  tone = 'primary',
  className = '',
}: PropsWithChildren<{
  tone?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}>) {
  const toneClass =
    tone === 'primary'
      ? surfaceTokens.accent
      : tone === 'secondary'
        ? 'bg-[#1f1c17] text-white'
        : 'bg-transparent text-[#514a42]';

  return (
    <button
      className={`cursor-pointer rounded-2xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}
