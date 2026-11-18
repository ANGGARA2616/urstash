import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const { code, next } = await searchParams;
  if (code) {
    const target = next
      ? `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      : `/auth/callback?code=${encodeURIComponent(code)}`;
    redirect(target);
  }

  // proxy.ts already gates auth; authenticated users land on the dashboard.
  redirect("/dashboard");
}
