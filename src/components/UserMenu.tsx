import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function UserMenu() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/signin"
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Sign in with GitHub
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 text-xs text-zinc-600">
        <div className="flex-1 truncate">
          <p className="truncate font-medium text-zinc-900">
            {session.user.name ?? session.user.email ?? "You"}
          </p>
          {session.user.email && (
            <p className="truncate text-[10px] text-zinc-500">
              {session.user.email}
            </p>
          )}
        </div>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
