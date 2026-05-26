import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationToast from "@/components/NotificationToast";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

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
    <html lang="en" className={`${raleway.variable} h-full`}>
      <body className="h-full" style={{ fontFamily: "var(--font-raleway), 'Raleway', sans-serif" }}>
        <NotificationProvider>
          {children}
          <NotificationToast />
        </NotificationProvider>
      </body>
    </html>
  );
}
