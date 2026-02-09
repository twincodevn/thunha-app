import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ThuNhà - Quản lý nhà trọ thông minh",
    template: "%s | ThuNhà",
  },
  description: "Nền tảng quản lý nhà trọ thông minh cho chủ nhà Việt Nam. Tự động tính tiền điện nước, xuất hóa đơn, thu tiền online.",
  keywords: ["quản lý nhà trọ", "phần mềm cho thuê phòng", "tính tiền điện nước", "thu tiền phòng trọ"],
  authors: [{ name: "ThuNhà" }],
  creator: "ThuNhà",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "ThuNhà",
    title: "ThuNhà - Quản lý nhà trọ thông minh",
    description: "Nền tảng quản lý nhà trọ thông minh cho chủ nhà Việt Nam",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
