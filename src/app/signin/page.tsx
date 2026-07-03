import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) {
    redirect(callbackUrl ?? "/");
  }

  return (
    <div className="mx-auto max-w-md pt-16">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        BacklogForge uses GitHub sign-in so your projects are yours, not
        anyone else&apos;s. You can still explore the demo project without
        signing in.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: callbackUrl ?? "/" });
        }}
        className="mt-6"
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <span>Sign in with GitHub</span>
        </button>
      </form>
    </div>
  );
}
