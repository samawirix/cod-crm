import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import MainLayout from "@/components/MainLayout";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "COD CRM - Cash on Delivery Management",
  description: "Professional CRM for COD E-commerce businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Default agent ID for notifications (in production, get from auth context)
  const agentId = 1;

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased tracking-tight`}>
        <Providers>
          <NotificationProvider agentId={agentId}>
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster
              position="top-right"
              richColors
              theme="dark"
              closeButton
            />
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
