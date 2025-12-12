import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap"
});

export const metadata: Metadata = {
  title: "CareerAlign | AI Resume Analyzer",
  description: "Beat the ATS with CareerAlign's AI-powered resume optimization and semantic job matching.",
  metadataBase: new URL("https://career-align.app")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-[var(--background)] text-[var(--foreground)]", spaceGrotesk.variable)}>
        {children}
      </body>
    </html>
  );
}
