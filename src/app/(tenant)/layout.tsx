
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Cổng Cư Dân - ThuNhà",
    description: "Quản lý hóa đơn và dịch vụ nhà trọ",
};

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen bg-gray-50`}>
                <div className="flex flex-col min-h-screen">
                    <main className="flex-1 pb-16">
                        {/* Constants padding-bottom for mobile nav if needed */}
                        {children}
                    </main>
                    <Toaster />
                </div>
            </body>
        </html>
    );
}
