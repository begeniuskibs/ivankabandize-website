import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mtnBrighterSans = localFont({
  src: [
    {
      path: "./fonts/MTNBrighterSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-mtn-brighter-sans",
  display: "swap",
});

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Ivan Kabandize",
  description: "Personal website, articles, and services by Ivan Kabandize",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${mtnBrighterSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

