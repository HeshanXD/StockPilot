import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
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
        <main className="md:ml-20 min-h-screen p-6 pb-24 md:pb-6">
          {children}
        </main>
      </body>
    </html>
  );
}