import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KotoDur (কতদূর) — Dynamic Bus Headway Control Engine",
  description:
    "Real-time 2D Bus Bunching and Dynamic Headway Equalization simulation engine for Dhaka's Mirpur-10 to Motijheel transit corridor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
