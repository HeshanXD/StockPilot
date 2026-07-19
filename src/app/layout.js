import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import LowStockAlert from "./components/LowStockAlert";
import AppShell from "./components/AppShell";
import "./globals.css";
import { company } from "@/config/company";

export const metadata = {
  title: company.name,
  description: "Inventory Management System",
};


export default function RootLayout({ children }) {

  const themeStyle = {
    "--background": company.colors.background,
    "--card": company.colors.card,
    "--text": company.colors.text,
    "--muted": company.colors.muted,
    "--border": company.colors.border,
    "--primary": company.colors.primary,
  };

  return (

    <html lang="en">

      <body style={themeStyle}>


        <Navbar />

        <MobileNav />

        <LowStockAlert />

        <AppShell>{children}</AppShell>


      </body>

    </html>

  );

}