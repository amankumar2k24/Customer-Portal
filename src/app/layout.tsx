import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TCL | Customer Portal",
  description: "Modern customer portal for order management",
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
      <body className="min-h-full bg-background flex">
          <Toaster 
            position="top-center"
            toastOptions={{
              className: 'text-sm font-bold bg-[#171D26] text-white rounded-xl shadow-xl border border-white/10',
              duration: 4000
            }} 
          /><LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}