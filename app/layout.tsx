import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pickle",
  description: "Pick the best. Skip the rest. Compare anything in seconds.",
  applicationName: "Pickle",
  appleWebApp: {
    capable: true,
    title: "Pickle",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
