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
    default: "ThuNhà - Nền Tảng Quản Lý Nhà Trọ Số 1 Việt Nam",
    template: "%s | ThuNhà Pro",
  },
  description: "Trải nghiệm quản lý nhà trọ đẳng cấp mới. Tự động hóa 100% quy trình, tối ưu lợi nhuận và nâng tầm phong cách chủ nhà.",
  keywords: ["quản lý nhà trọ premium", "phần mềm quản lý căn hộ", "thu tiền nhà tự động", "chủ nhà 4.0"],
  authors: [{ name: "ThuNhà Pro Team" }],
  creator: "ThuNhà",
  manifest: "/manifest.json",
  themeColor: "#0f172a", // Darker theme color
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // More premium feel
    title: "ThuNhà Pro",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "ThuNhà Pro",
    title: "ThuNhà - Nền Tảng Quản Lý Nhà Trọ Số 1 Việt Nam",
    description: "Giải pháp quản lý toàn diện cho chủ nhà hiện đại.",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
