export type CandidateTicket = {
  id: string;
  estimate: number;
  blockerIds: string[];
};

/**
 * Greedily pack `candidates` (assumed pre-sorted by priority, most important
 * first) into `capacity` points, skipping any ticket whose blockers aren't
 * already done or already packed. A ticket and its blocker can land in the
 * same sprint — repeated passes let short dependency chains resolve within
 * one call, without needing a full topological sort.
 */
export function packTickets(
  candidates: CandidateTicket[],
  blockerStatus: Record<string, string>,
  capacity: number
): string[] {
  const packed = new Set<string>();
  let remaining = capacity;

  let progress = true;
  while (progress) {
    progress = false;
    for (const t of candidates) {
      if (packed.has(t.id)) continue;
      if (t.estimate > remaining) continue;
      const ready = t.blockerIds.every(
        (b) => packed.has(b) || blockerStatus[b] === "done"
      );
      if (!ready) continue;
      packed.add(t.id);
      remaining -= t.estimate;
      progress = true;
    }
  }
  return [...packed];
}
