import './styles.css';
import type { PropsWithChildren } from 'react';
import { surfaceTokens } from './tokens';

export function Card({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={`rounded-[1.85rem] border ${surfaceTokens.borderColor} ${surfaceTokens.cardBackground} p-4 shadow-[0_24px_60px_rgba(36,27,20,0.12),0_4px_14px_rgba(36,27,20,0.06)] backdrop-blur-[18px] ${className}`}
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
      ? `${surfaceTokens.accent} shadow-[0_14px_32px_rgba(24,92,84,0.28)]`
      : tone === 'secondary'
        ? 'bg-[var(--shopflow-ink)] text-white shadow-[0_14px_30px_rgba(24,20,16,0.24)]'
        : 'border border-[color:var(--shopflow-line-strong)] bg-white/78 text-[color:var(--shopflow-body)]';

  return (
    <button
      className={`cursor-pointer rounded-[1.15rem] px-3.5 py-2.5 text-sm font-medium transition-[background-color,color,transform,box-shadow,border-color] duration-200 active:translate-y-[1px] ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}
