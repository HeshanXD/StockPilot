"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { company } from "@/config/company";
import {
  LayoutDashboard,
  Package,
  Wheat,
  ClipboardList,
  Factory,
  Truck,
  Users,
  FileText,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    { name: "Ingredients", href: "/ingredients", icon: Wheat, enabled: company.features.ingredients },
    { name: "Recipes", href: "/recipes", icon: ClipboardList, enabled: company.features.ingredients },
    { name: "Production", href: "/production", icon: Factory },
    { name: "Dispatch", href: "/dispatch", icon: Truck },
    { name: "Customers", href: "/customers", icon: Users, enabled: company.features.customers },
    { name: "Reports", href: "/reports", icon: FileText, enabled: company.features.reports },
  ].filter((item) => item.enabled !== false);

  return (
    <aside
      style={{
        backgroundColor: `${company.colors.primary}CC`, // semi-transparent
        color: company.colors.text,
        backdropFilter: "blur(8px)", // frosted glass effect
      }}
      className="
        group hidden md:flex md:flex-col fixed left-0 top-0
        h-screen w-20 hover:w-64 shadow-xl transition-all duration-300
        overflow-hidden z-50
      "
    >
      {/* Logo */}
      <div className="h-24 relative flex items-center">
        <div className="w-20 flex justify-center shrink-0">
          <Image
            src={company.logo}
            width={42}
            height={42}
            alt="Company Logo"
            className="object-contain"
          />
        </div>
        <span
          className="
            absolute left-20 text-xl font-bold whitespace-nowrap
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
          "
        >
          {company.name}
        </span>
      </div>

      {/* Menu */}
      <nav className="px-3 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{ color: company.colors.text }}
              className="
                flex items-center h-12 rounded-xl transition
                hover:bg-[var(--card)] hover:text-[var(--primary)]
              "
            >
              <div className="w-14 flex justify-center shrink-0">
                <Icon size={22} />
              </div>
              <span
                className="
                  opacity-0 group-hover:opacity-100 transition-opacity
                  duration-300 whitespace-nowrap font-medium
                "
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User / logout */}
      <div
        style={{ borderTop: `1px solid ${company.colors.border}` }}
        className="absolute bottom-0 left-0 w-full px-3 py-4"
      >
        <button
          onClick={handleLogout}
          style={{ color: company.colors.text }}
          className="
            flex items-center h-12 w-full rounded-xl transition
            hover:bg-[var(--card)] hover:text-[var(--primary)]
          "
        >
          <div className="w-14 flex justify-center shrink-0">
            <LogOut size={22} />
          </div>
          <span
            className="
              opacity-0 group-hover:opacity-100 transition-opacity
              duration-300 whitespace-nowrap font-medium text-sm
            "
          >
            {email || "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
