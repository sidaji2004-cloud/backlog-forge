import { useEffect, useState } from "react";

/**
 * Cycles through `hints` every `intervalMs` while `active` is true, so a
 * long-running AI call feels like something is actually happening. When
 * `active` flips to false the hint index resets so the next run starts fresh.
 */
export function useRotatingHint(
  hints: readonly string[],
  active: boolean,
  intervalMs = 2000
): string | null {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % hints.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, hints.length, intervalMs]);

  return active ? (hints[index] ?? null) : null;
}
