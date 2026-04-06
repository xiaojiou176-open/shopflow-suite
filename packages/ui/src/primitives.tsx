import type { PropsWithChildren } from 'react';
import { surfaceTokens } from './tokens';

export function Card({ children }: PropsWithChildren) {
  return (
    <section
      className={`rounded-2xl border ${surfaceTokens.borderColor} ${surfaceTokens.cardBackground} p-4 shadow-sm`}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  tone = 'primary',
}: PropsWithChildren<{ tone?: 'primary' | 'secondary' | 'ghost' }>) {
  const toneClass =
    tone === 'primary'
      ? surfaceTokens.accent
      : tone === 'secondary'
        ? 'bg-stone-900 text-white'
        : 'bg-transparent text-stone-700';

  return (
    <button className={`rounded-xl px-3 py-2 text-sm font-medium ${toneClass}`}>
      {children}
    </button>
  );
}
