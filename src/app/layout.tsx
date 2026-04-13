import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Southern Cities Invoice Studio",
  description: "Mobile-friendly invoice generator for subcontractors with branded print-ready previews.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
