import type { Metadata } from "next";
import Navbar from "./navbar/navbar";
import Search from "./search/search";
import './globals.css'

export const metadata: Metadata = {
  title: "ClipShare",
  description: "Share your clips with the world"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: "#DAFFEF", fontFamily: "'Inter', Arial, sans-serif" }}>
        <Navbar />
        <Search />
        {children}
      </body>
    </html>
  );
}
