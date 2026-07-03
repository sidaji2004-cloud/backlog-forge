"use client";

import Link from "next/link";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { StatusBadge } from "@/components/StatusBadge";

export type TicketNodeData = {
  ticketId: string;
  projectId: string;
  title: string;
  status: string;
  priority: string;
  isBlocked: boolean;
};

export type TicketFlowNode = Node<TicketNodeData, "ticket">;

export function TicketNode({ data }: NodeProps<TicketFlowNode>) {
  return (
    <div
      className={`w-56 rounded-md border bg-white p-2.5 text-sm shadow-sm ${
        data.isBlocked ? "border-red-300" : "border-zinc-200"
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <p className="truncate font-medium leading-snug">{data.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <StatusBadge status={data.status} />
        <StatusBadge status={data.priority} />
        {data.isBlocked && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
            ⛔ blocked
          </span>
        )}
      </div>
      <Link
        href={`/projects/${data.projectId}/tickets/${data.ticketId}`}
        className="mt-1.5 block text-xs text-zinc-400 hover:text-zinc-700 hover:underline"
      >
        Open →
      </Link>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
