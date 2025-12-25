import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import MainLayout from "@/components/MainLayout";
import { NotificationProvider } from "@/components/NotificationProvider";

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
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased tracking-tight`}>
        <Providers>
          <NotificationProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
