import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Podcast Creator",
  description: "Create podcasts from URLs, files, or custom instructions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
