// All AI prompts live here — edit freely to tune tone and structure.
// The section lists come from templates.ts so the editor and the AI stay in sync.

import { DOC_SECTIONS, DOC_LABELS, type DocType } from "@/lib/templates";

export const SYSTEM_PROMPT = `You are a senior product manager at a well-run software company.
You write clear, practical product documents in markdown. You are teaching an
aspiring PM by example, so your documents should be realistic — concrete,
specific, honest about risks and open questions — not generic filler.
Keep each section focused; prefer bullet points and tables over walls of text.
Output only the markdown document, with no preamble or commentary.`;

function sectionList(type: DocType): string {
  return DOC_SECTIONS[type].map((s) => `- ${s}`).join("\n");
}

export function brdPrompt(idea: string, discoveryContext?: string): string {
  return `Write a ${DOC_LABELS.BRD} (BRD) for this product idea:

"""
${idea}
"""
${discoveryContext ? `\nAdditional context from the founder:\n"""\n${discoveryContext}\n"""\n` : ""}
A BRD covers the BUSINESS side only — why this should exist, for whom, and how
success is measured. No feature lists, no technical details.

Use exactly these markdown H2 sections, starting with an H1 title:
${sectionList("BRD")}`;
}

export function clarifyingQuestionsPrompt(
  idea: string,
  discoveryContext?: string
): string {
  return `A founder gave this rough product idea:

"""
${idea}
"""
${discoveryContext ? `\nThey also gave this extra context:\n"""\n${discoveryContext}\n"""\n` : ""}
Propose up to 3 short, specific clarifying questions that would meaningfully
sharpen a Business Requirements Document (BRD) for this idea — things like
who exactly the user is, what "success" looks like, or a constraint that
changes the whole approach. Skip questions the idea/context already answers.
If nothing meaningful is missing, return fewer than 3 (even zero) — don't
invent filler questions.`;
}

export function prdPrompt(idea: string, brd: string): string {
  return `Write a ${DOC_LABELS.PRD} (PRD) based on this approved BRD:

"""
${brd}
"""

(Original idea for reference: "${idea}")

The PRD defines WHAT gets built: features, user stories ("As a ..., I want ...,
so that ..."), priorities using MoSCoW (Must/Should/Could/Won't), and explicit
scope boundaries. Stay consistent with the BRD's goals and metrics.

Use exactly these markdown H2 sections, starting with an H1 title:
${sectionList("PRD")}`;
}

export function fsdPrompt(idea: string, prd: string): string {
  return `Write a ${DOC_LABELS.FSD} (FSD) based on this approved PRD:

"""
${prd}
"""

(Original idea for reference: "${idea}")

The FSD defines HOW THE PRODUCT BEHAVES: every screen, flow, business rule and
edge case, detailed enough that a developer could build from it without asking
questions. Reference the PRD's user stories where relevant.

Traceability: give every numbered requirement a short stable anchor tag right
after its heading or bullet, formatted like [FSD-REQ-001], [FSD-REQ-002], ...,
counting up sequentially across the whole document. These tags are how future
tickets will cite exactly which requirement they implement, so keep them short,
unique, and never reuse a number.

Use exactly these markdown H2 sections, starting with an H1 title:
${sectionList("FSD")}`;
}

export function ticketsPrompt(prd: string, fsd: string | null): string {
  return `Break this PRD${fsd ? " and FSD" : ""} into engineering tickets.

PRD:
"""
${prd}
"""
${fsd ? `\nFSD:\n"""\n${fsd}\n"""\n` : ""}
Rules for good tickets (INVEST):
- Each ticket is independently shippable and small (1-5 story points).
- "acceptanceCriteria" uses Gherkin format: one or more scenarios, each as
  markdown bullets like:
  **Scenario: <short name>**
  - Given <starting context>
  - When <the action taken>
  - Then <the observable, testable outcome>
  Two or three scenarios covering the happy path and the most important edge
  case is usually enough — don't pad with trivial scenarios.
- "sourceSection" is the traceability link back to the spec. If the FSD has
  anchor tags like [FSD-REQ-001], cite the exact tag(s) the ticket implements
  instead of a section name — that's the precise reference. Only fall back to
  a plain section name when no anchor tag exists for that content.
- "dependsOn" lists the array indexes (0-based) of tickets in THIS list that
  must be finished first. Keep dependencies minimal and acyclic.
- Order tickets roughly in build order. 8 to 20 tickets is the sweet spot.`;
}
