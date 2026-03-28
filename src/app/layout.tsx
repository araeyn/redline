import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Redline | Professional Critique. Zero Ego.",
  description: "AI-augmented art director and mentor for digital artists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased overflow-hidden h-screen w-screen bg-zinc-950 text-zinc-50`}>
        {children}
      </body>
    </html>
  );
}
