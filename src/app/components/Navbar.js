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
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Products",
      href: "/products",
      icon: Package
    },
    {
      name: "Ingredients",
      href: "/ingredients",
      icon: Wheat,
      enabled: company.features.ingredients
    },
    {
      name: "Recipes",
      href: "/recipes",
      icon: ClipboardList,
      enabled: company.features.ingredients
    },
    {
      name: "Production",
      href: "/production",
      icon: Factory
    },
    {
      name: "Dispatch",
      href: "/dispatch",
      icon: Truck
    },
    {
      name: "Customers",
      href: "/customers",
      icon: Users,
      enabled: company.features.customers
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileText,
      enabled: company.features.reports
    }
  ].filter((item) => item.enabled !== false);



  return (

    <aside
      className="
      group
      hidden
      md:flex
      md:flex-col
      fixed
      left-0
      top-0
      h-screen
      w-20
      hover:w-64
      bg-slate-900
      text-slate-200
      shadow-xl
      transition-all
      duration-300
      overflow-hidden
      z-50
      "
    >


      {/* Logo */}

      <div
        className="
        h-24
        relative
        flex
        items-center
        "
      >


        {/* Fixed logo position */}

        <div
          className="
          w-20
          flex
          justify-center
          shrink-0
          "
        >

          <Image
            src="/poshacrunch.png"
            width={42}
            height={42}
            alt="Company Logo"
            className="object-contain"
          />

        </div>



        {/* Company name */}

        <span
          className="
          absolute
          left-20
          text-xl
          font-bold
          whitespace-nowrap
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-300
          "
        >

          StockPilot

        </span>


      </div>






      {/* Menu */}

      <nav
        className="
        px-3
        space-y-2
        "
      >

        {menu.map((item)=>{


          const Icon=item.icon;


          return (

            <Link

              key={item.name}

              href={item.href}

              className="
              flex
              items-center
              h-12
              rounded-xl
              hover:bg-slate-700
              transition
              "

            >

              <div
                className="
                w-14
                flex
                justify-center
                shrink-0
                "
              >

                <Icon size={22}/>

              </div>



              <span
                className="
                opacity-0
                group-hover:opacity-100
                transition-opacity
                duration-300
                whitespace-nowrap
                font-medium
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
        className="
        absolute
        bottom-0
        left-0
        w-full
        border-t
        border-slate-700
        px-3
        py-4
        "
      >

        <button
          onClick={handleLogout}
          className="
          flex
          items-center
          h-12
          w-full
          rounded-xl
          hover:bg-slate-700
          transition
          "
        >

          <div
            className="
            w-14
            flex
            justify-center
            shrink-0
            "
          >

            <LogOut size={22}/>

          </div>

          <span
            className="
            opacity-0
            group-hover:opacity-100
            transition-opacity
            duration-300
            whitespace-nowrap
            font-medium
            text-sm
            "
          >

            {email || "Sign out"}

          </span>

        </button>

      </div>


    </aside>

  );

}