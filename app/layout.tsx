import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

import { SITE_URL } from "@/lib/siteUrl";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Ivan Kabandize",
    default: "Ivan Kabandize",
  },
  description:
    "Ivan Kabandize writes about leadership, systems thinking, technology and faith, and helps organisations get their operations, systems and teams in order.",
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Ivan Kabandize",
    title: "Ivan Kabandize",
    description:
      "Ivan Kabandize writes about leadership, systems thinking, technology and faith, and helps organisations get their operations, systems and teams in order.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ivan Kabandize",
    description:
      "Ivan Kabandize writes about leadership, systems thinking, technology and faith, and helps organisations get their operations, systems and teams in order.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
