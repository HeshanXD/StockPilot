"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  Users,
  BarChart3
} from "lucide-react";


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
    icon: BarChart3
  }
];


export default function Sidebar(){

  const pathname = usePathname();


  return (

    <aside className="
      hidden md:flex
      fixed
      left-0
      top-0
      h-screen
      w-64
      flex-col
      border-r
      bg-white
      p-6
    ">


      <h1 className="
        text-2xl
        font-bold
        mb-10
      ">
        🚀 StockPilot
      </h1>



      <nav className="space-y-2">


      {
        menu.map((item)=>{

          const Icon = item.icon;

          const active =
            pathname === item.href;


          return (

            <Link

              key={item.name}

              href={item.href}

              className={`
                flex
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                transition

                ${
                  active
                  ?
                  "bg-black text-white"
                  :
                  "hover:bg-gray-100"
                }

              `}

            >

              <Icon size={20}/>

              {item.name}

            </Link>

          );


        })
      }


      </nav>



      <div className="
        mt-auto
        rounded-xl
        bg-gray-100
        p-4
        text-sm
      ">

        <p className="font-semibold">
          Stock Management
        </p>

        <p className="text-gray-500 mt-1">
          Simple. Fast. Reliable.
        </p>

      </div>


    </aside>

  );

}