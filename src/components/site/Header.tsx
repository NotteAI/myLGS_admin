"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Heart, ClipboardList, LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const { user } = useAuth();

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "";

  return (
    <nav className="sticky top-0 z-50 border-b border-ink/10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <Link
          href="/"
          className="font-mono text-xl font-bold italic tracking-tighter text-brand whitespace-nowrap"
        >
          FOUND.
        </Link>

        <form onSubmit={onSubmit} className="relative hidden flex-1 max-w-xl md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Search inventory across local shops…"
            className="h-10 w-full rounded-full bg-cement/50 pl-10 pr-4 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand transition-all"
          />
        </form>

        <div className="flex flex-1 items-center justify-end gap-1 md:gap-4 md:flex-none">
          <Link
            href="/stores"
            className={`hidden md:block px-2 text-sm font-medium hover:text-brand transition-colors ${pathname === "/stores" ? "text-brand" : ""}`}
          >
            Shops
          </Link>
          {user ? (
            <>
              <Link
                href="/wishlist"
                className={`hidden md:inline-flex items-center gap-1.5 px-2 text-sm font-medium hover:text-brand transition-colors ${pathname === "/wishlist" ? "text-brand" : ""}`}
              >
                <Heart className="size-4" /> Wishlist
              </Link>
              <Link
                href="/orders"
                className={`hidden md:inline-flex items-center gap-1.5 px-2 text-sm font-medium hover:text-brand transition-colors ${pathname === "/orders" ? "text-brand" : ""}`}
              >
                <ClipboardList className="size-4" /> Orders
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-2 size-10 rounded-full bg-ink text-white flex items-center justify-center text-xs font-mono font-medium hover:bg-brand transition-colors">
                  {initials || <UserIcon className="size-4" />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="md:hidden">
                      <Heart className="size-4 mr-2" /> Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="md:hidden">
                      <ClipboardList className="size-4 mr-2" /> My orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.push("/");
                      router.refresh();
                    }}
                  >
                    <LogOut className="size-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              href={`/auth?redirect=${encodeURIComponent(pathname)}`}
              className="inline-flex h-10 items-center bg-ink px-5 text-sm font-semibold text-white hover:bg-brand transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={onSubmit} className="relative px-6 pb-3 md:hidden">
        <Search className="pointer-events-none absolute left-9 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="text"
          placeholder="Search inventory…"
          className="h-10 w-full rounded-full bg-cement/50 pl-10 pr-4 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </form>
    </nav>
  );
}
