// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://goldenaxis60.company"),

  title: {
    default: "Golden Axis 60",
    template: "%s | Golden Axis 60",
  },

  description:
    "Golden Axis 60 is a gold and jewel promotional task simulation platform with account dashboard, campaign records, activity tracking, and customer support.",

  applicationName: "Golden Axis 60",

  keywords: [
    "Golden Axis 60",
    "gold campaign",
    "jewel campaign",
    "promotion dashboard",
    "task simulation",
    "activity records",
    "customer support",
  ],

  authors: [{ name: "Golden Axis 60" }],
  creator: "Golden Axis 60",
  publisher: "Golden Axis 60",

  openGraph: {
    title: "Golden Axis 60",
    description:
      "Official Golden Axis 60 member portal for campaign tasks, activity records, and customer support.",
    url: "https://goldenaxis60.company",
    siteName: "Golden Axis 60",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Golden Axis 60",
    description:
      "Official Golden Axis 60 member portal for campaign tasks, activity records, and customer support.",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },

  manifest: "/site.webmanifest",

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-[#f8f5ea]">
        {children}
      </body>
    </html>
  );
}