"use client";

import Link from "next/link";
import Image from "next/image";

import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  Users,
  FileText,
} from "lucide-react";


export default function Navbar() {


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
      icon: Users
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileText
    }
  ];



  return (

    <aside
      className="
      group
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
            src="/logo.png"
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


    </aside>

  );

}