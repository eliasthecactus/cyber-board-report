import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cyber Board Reports",
  description: "Executive-friendly cyber security board reporting tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={inter.className}>
      <body className="bg-base-100 text-base-content">{children}</body>
    </html>
  );
}
