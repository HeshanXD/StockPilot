import Navbar from "./components/Navbar";
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


        <main
          className="
          ml-20
          min-h-screen
          p-6
          "
        >

          {children}

        </main>


      </body>

    </html>

  );

}