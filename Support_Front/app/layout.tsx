import type { Metadata } from "next";

import "./globals.css";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationToast from "@/components/NotificationToast";

export const metadata: Metadata = {
  title: "Support Dashboard",
  description: "Support dashboard for managing customer conversations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <NotificationProvider>
          {children}
          <NotificationToast />
        </NotificationProvider>
      </body>
    </html>
  );
}
