
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from "next";
import { TenantSidebar } from "@/components/tenant/sidebar";
import { TenantHeader } from "@/components/tenant/header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "next-auth/react";
import { OneSignalProvider } from "@/components/tenant/onesignal-provider";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Cổng Cư Dân - ThuNhà",
    description: "Quản lý hóa đơn và dịch vụ nhà trọ",
};

export default async function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;

    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900`}>
                <SessionProvider>
                    <OneSignalProvider />
                    <div className="min-h-screen">
                        <TenantSidebar user={user} />
                        <div className="lg:pl-64 flex flex-col min-h-screen transition-all">
                            <TenantHeader />
                            <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 relative z-10">
                                {children}
                            </main>
                        </div>
                        <Toaster />
                    </div>
                </SessionProvider>
            </body>
        </html>
    );
}
