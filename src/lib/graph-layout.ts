export type LayoutTicket = { id: string; blockerIds: string[] };

const COL_WIDTH = 260;
const ROW_HEIGHT = 110;

/**
 * A plain left-to-right layered layout: blockers land to the left of what
 * they block, computed from dependency depth. No layout library — this is
 * appropriate for tens of tickets, not hundreds, and stays easy to debug.
 */
export function layoutTickets(
  tickets: LayoutTicket[]
): Record<string, { x: number; y: number }> {
  const byId = new Map(tickets.map((t) => [t.id, t]));
  const depth = new Map<string, number>();

  function depthOf(id: string, seen: Set<string>): number {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0; // defensive cycle guard; addDependency already forbids real cycles
    seen.add(id);
    const t = byId.get(id);
    const d =
      t && t.blockerIds.length > 0
        ? 1 + Math.max(...t.blockerIds.map((b) => depthOf(b, seen)))
        : 0;
    depth.set(id, d);
    return d;
  }
  tickets.forEach((t) => depthOf(t.id, new Set()));

  const columns = new Map<number, string[]>();
  for (const t of tickets) {
    const d = depth.get(t.id)!;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(t.id);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  for (const [d, ids] of columns) {
    ids.forEach((id, i) => {
      positions[id] = { x: d * COL_WIDTH, y: i * ROW_HEIGHT };
    });
  }
  return positions;
}
