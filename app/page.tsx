import { redirect } from "next/navigation";

export default function Home() {
  // proxy.ts already gates auth; authenticated users land on the dashboard.
  redirect("/dashboard");
}
