import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.project.findFirst({
    where: { name: "BacklogForge (this app)" },
  });
  if (existing) {
    console.log("Seed project already exists, skipping.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "BacklogForge (this app)",
      idea: "An AI product-discovery tool: interview the user about a rough idea, write a BRD/PRD/FSD from it, turn the FSD into a backlog of tickets, and export that backlog for use in Jira or Linear.",
    },
  });

  await prisma.document.create({
    data: {
      projectId: project.id,
      type: "BRD",
      status: "draft",
      content: `# Business Requirements Document

> Stage 1 seed — the thinnest working slice of a bigger vision. Edit me, or generate a real one with AI.

## Executive Summary

Turning a rough product idea into a business case and a working backlog usually takes a PM days and several tools. BacklogForge does the first pass in minutes, so a human can spend their time reviewing and refining instead of drafting from a blank page.

## Business Problem

Idea → BRD → PRD → FSD → backlog → tracked tickets is a well-understood but slow, manual chain. Most of it is well-structured enough for an AI first draft.

## Business Objectives

- Go from a one-line idea to an approved BRD/PRD/FSD and a real ticket backlog in one sitting.
- Keep the whole chain traceable: every ticket should point back to the FSD section it came from.

## Target Audience

- Product managers and founders validating an idea before committing engineering time.

## Success Metrics

- One complete idea → BRD → PRD → FSD → tickets chain, exported and usable.

## Constraints & Assumptions

- Stage 1 is local-first, free-tier only. Real Jira/Linear sync, file uploads, and a visual dependency graph come in later stages — Stage 1 ships a CSV export instead.

## Risks

- AI-drafted requirements can overstate scope (this is exactly what happened generating BacklogForge's own first backlog) — documents must stay easy to edit by hand.
`,
    },
  });

  console.log(`Seeded project "${project.name}" with a draft BRD.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
