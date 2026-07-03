import { createProject } from "@/lib/actions";

export default function NewProjectPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">New project</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Start with a rough idea — one or two sentences is enough. The BRD will
        sharpen the &quot;why&quot; later.
      </p>
      <form action={createProject} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Project name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Splitwise for roommates"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
        <div>
          <label htmlFor="idea" className="block text-sm font-medium">
            Rough idea
          </label>
          <textarea
            id="idea"
            name="idea"
            required
            rows={4}
            placeholder="What problem does it solve, and for whom?"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <details className="rounded-md border border-zinc-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-zinc-700">
            + Add more context (optional)
          </summary>
          <p className="mt-1 text-xs text-zinc-500">
            Anything here gets handed to the AI when it writes the BRD.
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="audience" className="block text-sm font-medium">
                Target audience
              </label>
              <input
                id="audience"
                name="audience"
                placeholder="e.g. Roommates splitting shared bills"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label htmlFor="techStack" className="block text-sm font-medium">
                Tech stack (if you already have a preference)
              </label>
              <input
                id="techStack"
                name="techStack"
                placeholder="e.g. Next.js, mobile-first"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label htmlFor="constraints" className="block text-sm font-medium">
                Key constraints
              </label>
              <textarea
                id="constraints"
                name="constraints"
                rows={2}
                placeholder="e.g. Must be free to run, launch in 4 weeks"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>
        </details>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Create project
        </button>
      </form>
    </div>
  );
}
