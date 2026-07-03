// Document section templates — the customisation layer.
// Add, remove, or reorder sections here and both the manual editor
// and the AI prompts pick up the change.

export type DocType = "BRD" | "PRD" | "FSD";

export const DOC_TYPES: DocType[] = ["BRD", "PRD", "FSD"];

export const DOC_LABELS: Record<DocType, string> = {
  BRD: "Business Requirements Document",
  PRD: "Product Requirements Document",
  FSD: "Functional Specification Document",
};

export const DOC_DESCRIPTIONS: Record<DocType, string> = {
  BRD: "The WHY — business problem, goals, audience, success metrics. No tech details.",
  PRD: "The WHAT — features, user stories, priorities, scope. Builds on the BRD.",
  FSD: "The HOW IT BEHAVES — screens, flows, rules, edge cases. Builds on the PRD.",
};

export const DOC_SECTIONS: Record<DocType, string[]> = {
  BRD: [
    "Executive Summary",
    "Business Problem",
    "Business Objectives",
    "Target Audience",
    "Success Metrics",
    "Constraints & Assumptions",
    "Risks",
  ],
  PRD: [
    "Overview",
    "Goals & Non-Goals",
    "User Personas",
    "User Stories",
    "Features & Requirements",
    "Prioritization (MoSCoW)",
    "Out of Scope",
    "Open Questions",
  ],
  FSD: [
    "Introduction",
    "System Overview",
    "Screens & Navigation",
    "Functional Requirements",
    "Data Requirements",
    "Business Rules",
    "Edge Cases & Error Handling",
    "Acceptance Criteria Summary",
  ],
};

/** Blank markdown skeleton for manual editing. */
export function blankTemplate(type: DocType): string {
  const header = `# ${DOC_LABELS[type]}\n\n> ${DOC_DESCRIPTIONS[type]}\n`;
  const sections = DOC_SECTIONS[type]
    .map((s) => `\n## ${s}\n\n_TODO_\n`)
    .join("");
  return header + sections;
}

export const DOC_STATUSES = ["draft", "review", "approved"] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const TICKET_STATUSES = ["backlog", "todo", "in-progress", "done"] as const;
export const TICKET_PRIORITIES = ["low", "medium", "high"] as const;
