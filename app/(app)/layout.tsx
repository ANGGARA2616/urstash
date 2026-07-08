import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import { CommandPalette } from "@/components/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24">
      <AppNav />
      <CommandPalette />
      <main className="pt-8">{children}</main>
    </div>
  );
}
