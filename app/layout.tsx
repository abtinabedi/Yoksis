import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Yoklama Sistemi",
  description: "QR kod ile hızlı ve güvenli yoklama sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
