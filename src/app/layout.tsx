import type { Metadata } from "next";
import "./globals.css";
import SidebarLayout from "@/components/SidebarLayout";

export const metadata: Metadata = {
  title: "SCE Invoice Tool",
  description: "Invoice management for Southern Cities Construction LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
