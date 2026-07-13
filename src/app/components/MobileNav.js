"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { company } from "@/config/company";
import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  Users,
  FileText,
  LogOut,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Dispatch", href: "/dispatch", icon: Truck },
  { name: "Customers", href: "/customers", icon: Users, enabled: company.features.customers },
  { name: "Reports", href: "/reports", icon: FileText, enabled: company.features.reports },
].filter((item) => item.enabled !== false);

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav
      className="
      fixed
      bottom-0
      left-0
      z-50
      flex
      w-full
      justify-between
      overflow-x-auto
      border-t
      border-slate-700
      bg-slate-900
      px-1
      py-2
      md:hidden
      "
    >
      {menu.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex min-w-[52px] flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition ${
              active ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <Icon size={19} />
            {item.name}
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        className="flex min-w-[52px] flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium text-slate-400 transition"
      >
        <LogOut size={19} />
        Sign out
      </button>
    </nav>
  );
}