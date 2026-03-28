import type { Metadata } from "next";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/playfair-display/900.css";
import "@fontsource/playfair-display/900-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redline | Art Direction",
  description: "Digital art direction and mentorship system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden h-screen w-screen bg-[#fcfcfc] text-zinc-800">
        {children}
      </body>
    </html>
  );
}
