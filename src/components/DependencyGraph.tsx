"use client";

import { useCallback, useMemo, useTransition } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { addDependency, removeDependency } from "@/lib/ticket-actions";
import { layoutTickets } from "@/lib/graph-layout";
import { TicketNode, type TicketFlowNode } from "@/components/TicketNode";

export type GraphTicket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  blockerIds: string[];
  isBlocked: boolean;
};

const nodeTypes: NodeTypes = { ticket: TicketNode };

function edgeId(blockerId: string, ticketId: string) {
  return `${blockerId}->${ticketId}`;
}

export function DependencyGraph({
  tickets,
  projectId,
}: {
  tickets: GraphTicket[];
  projectId: string;
}) {
  const initial = useMemo(() => {
    const positions = layoutTickets(
      tickets.map((t) => ({ id: t.id, blockerIds: t.blockerIds }))
    );
    const nodes: TicketFlowNode[] = tickets.map((t) => ({
      id: t.id,
      type: "ticket",
      position: positions[t.id] ?? { x: 0, y: 0 },
      data: {
        ticketId: t.id,
        projectId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        isBlocked: t.isBlocked,
      },
    }));
    const edges: Edge[] = tickets.flatMap((t) =>
      t.blockerIds.map((blockerId) => ({
        id: edgeId(blockerId, t.id),
        source: blockerId,
        target: t.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }))
    );
    return { nodes, edges };
  }, [tickets, projectId]);

  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [, startTransition] = useTransition();

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source: blockerId, target: ticketId } = connection;
      if (!blockerId || !ticketId || blockerId === ticketId) return;
      const id = edgeId(blockerId, ticketId);
      if (edges.some((e) => e.id === id)) return; // already exists — no-op

      setEdges((eds) =>
        addEdge({ ...connection, id, markerEnd: { type: MarkerType.ArrowClosed } }, eds)
      );

      startTransition(async () => {
        try {
          await addDependency(ticketId, blockerId);
        } catch (e) {
          setEdges((eds) => eds.filter((edge) => edge.id !== id));
          toast.error(e instanceof Error ? e.message : "Couldn't add dependency.");
        }
      });
    },
    [edges, setEdges]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!confirm("Remove this dependency?")) return;
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      startTransition(async () => {
        try {
          await removeDependency(edge.target, edge.source);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Couldn't remove dependency.");
          setEdges((eds) => addEdge(edge, eds));
        }
      });
    },
    [setEdges]
  );

  return (
    <div className="h-[70vh] rounded-lg border border-zinc-200 bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        isValidConnection={(c) => c.source !== c.target}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
