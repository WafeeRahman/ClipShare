import type { Metadata } from "next";

import Navbar from "./navbar/navbar";


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
      <body >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
