import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import "./globals.css";

export const metadata = {
  title: "StockPilot",
  description: "Inventory Management System",
};


export default function RootLayout({ children }) {

  return (

    <html lang="en">

      <body>


        <Navbar />

        <MobileNav />


        <main
          className="
          md:ml-20
          min-h-screen
          p-6
          pb-24
          md:pb-6
          "
        >

          {children}

        </main>


      </body>

    </html>

  );

}