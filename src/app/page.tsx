import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const FEATURES = [
  {
    title: "Document chain",
    body: "BRD → PRD → FSD, drafted by Gemini and reviewable by you. Every FSD requirement gets a stable anchor tag so tickets trace back cleanly.",
  },
  {
    title: "Dependency-aware backlog",
    body: "Tickets know what blocks them. The board flags blocked tickets, and a ticket can't move to done until its blockers do.",
  },
  {
    title: "Smart sprint planning",
    body: "One-click auto-pack fills a sprint by priority and dependency order, respecting the sprint's capacity.",
  },
  {
    title: "PM analytics",
    body: "Per-sprint commitment vs completion, cycle time, and the slowest tickets — the same metrics a real PM watches.",
  },
];

export default async function Home() {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  let projects: {
    id: string;
    name: string;
    idea: string;
    isDemo?: boolean;
    documents: { id: string }[];
    tickets: { id: string }[];
  }[] = [];
  try {
    projects = await prisma.project.findMany({
      where: {
        status: "active",
        OR: [
          { isDemo: true },
          ...(currentUserId ? [{ userId: currentUserId }] : []),
        ],
      },
      orderBy: [{ isDemo: "desc" }, { updatedAt: "desc" }],
      include: { documents: true, tickets: true },
    });
  } catch {
    projects = [];
  }

  // Prefer a demo project as the featured card if one exists (step B seeds
  // one with isDemo=true). Fall back to the most recent project otherwise.
  const demoProject =
    projects.find((p) => p.isDemo === true) ?? projects[0] ?? null;

  return (
    <div className="max-w-4xl">
      <section className="pt-6">
        <p className="text-xs font-medium uppercase tracking-widest text-violet-700">
          BacklogForge
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
          Turn a rough product idea into a real PM backlog.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">
          Gemini drafts your <strong>BRD</strong> (why), <strong>PRD</strong>{" "}
          (what), and <strong>FSD</strong> (how it behaves). You review each
          one, then generate a dependency-aware ticket backlog, plan sprints,
          and export to Jira or Linear. Built to be a PM&apos;s drafting
          partner — not a replacement for judgment.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {demoProject && (
            <Link
              href={`/projects/${demoProject.id}`}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              See the demo project →
            </Link>
          )}
          <Link
            href="/projects/new"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Create your own
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-zinc-200 bg-white p-5"
            >
              <p className="font-medium text-zinc-900">{f.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">
          {currentUserId ? "Your projects" : "Explore"}
        </h2>
        {projects.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            {currentUserId ? (
              <>
                No projects yet —{" "}
                <Link href="/projects/new" className="underline">
                  create your first one
                </Link>
                .
              </>
            ) : (
              <>
                <Link href="/signin" className="underline">
                  Sign in with GitHub
                </Link>{" "}
                to create your own projects.
              </>
            )}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.name}</p>
                  {p.isDemo && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      demo
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600 line-clamp-2">
                  {p.idea}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {p.documents.length} document(s) · {p.tickets.length}{" "}
                  ticket(s)
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
