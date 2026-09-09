import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mall Navigre",
  description: "Know where you are. Know where you're going. Never lose your car again.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
