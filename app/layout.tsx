import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A/B Test Kit",
  description: "Minimal A/B testing for headless Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
