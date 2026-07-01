"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/collections", label: "Collections" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <Navbar
      sticky
      className="mt-4"
      brand={
        <Link href="/dashboard" className="tracking-[-0.3px]">
          Stash
        </Link>
      }
    >
      <div className="hidden items-center gap-5 sm:flex">
        {LINKS.map((l) => {
          const active =
            pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className="navlink"
              data-active={active}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <Link href="/items/new" className="btn btn-primary btn-sm">
        <span className="btn-label">
          <Plus size={16} /> New
        </span>
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className="navlink">
          Sign out
        </button>
      </form>
    </Navbar>
  );
}
