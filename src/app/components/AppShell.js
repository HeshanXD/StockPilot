"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/signup"];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));

  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <main className="md:ml-20 min-h-screen p-6 pb-24 md:pb-6">
      {children}
    </main>
  );
}