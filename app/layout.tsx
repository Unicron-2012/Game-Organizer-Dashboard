import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LiveBackground from "./components/LiveBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Group Organizer",
  description: "Invite-only group management app",
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
      <body className="min-h-full relative bg-[#020617] text-white">

        {/* 🌌 GLOBAL LIVE BACKGROUND */}
        <LiveBackground />

        {/* CONTENT LAYER */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>

      </body>
    </html>
  );
}