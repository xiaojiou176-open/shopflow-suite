import { useEffect, useState } from 'react';

export function useCurrentHash() {
  const [hash, setHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateHash = () => {
      setHash(window.location.hash);
    };

    updateHash();
    window.addEventListener('hashchange', updateHash);

    return () => {
      window.removeEventListener('hashchange', updateHash);
    };
  }, []);

  return hash;
}
