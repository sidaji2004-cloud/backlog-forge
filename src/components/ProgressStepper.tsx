type StepState = "not-started" | "in-progress" | "complete";

type Step = { label: string; state: StepState };

function stateClass(state: StepState): string {
  if (state === "complete") return "bg-green-600 text-white border-green-600";
  if (state === "in-progress") return "border-blue-500 text-blue-700 bg-blue-50";
  return "border-zinc-300 text-zinc-400 bg-white";
}

function connectorClass(state: StepState): string {
  return state === "complete" ? "bg-green-600" : "bg-zinc-200";
}

export function ProgressStepper({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${stateClass(
              s.state
            )}`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
              {s.state === "complete" ? "✓" : i + 1}
            </span>
            <span>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-2 h-0.5 w-8 ${connectorClass(s.state)}`} />
          )}
        </li>
      ))}
    </ol>
  );
}

export function computeProjectSteps(project: {
  documents: { type: string; status: string }[];
  tickets: { status: string; sprintId: string | null }[];
  sprints: { id: string }[];
}): Step[] {
  const docState = (type: string): StepState => {
    const doc = project.documents.find((d) => d.type === type);
    if (!doc) return "not-started";
    if (doc.status === "approved") return "complete";
    return "in-progress";
  };

  let ticketsState: StepState = "not-started";
  if (project.tickets.length > 0) {
    ticketsState =
      project.tickets.every((t) => t.status === "done") &&
      project.tickets.length > 0
        ? "complete"
        : "in-progress";
  }

  let sprintsState: StepState = "not-started";
  if (project.sprints.length > 0) {
    const hasAssignedTickets = project.tickets.some((t) => t.sprintId !== null);
    sprintsState = hasAssignedTickets ? "complete" : "in-progress";
  }

  return [
    { label: "BRD", state: docState("BRD") },
    { label: "PRD", state: docState("PRD") },
    { label: "FSD", state: docState("FSD") },
    { label: "Tickets", state: ticketsState },
    { label: "Sprints", state: sprintsState },
  ];
}
