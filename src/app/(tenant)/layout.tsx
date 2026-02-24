import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from "next";
import { TenantHeader } from "@/components/tenant/header";
import { TenantBottomNav } from "@/components/tenant/bottom-nav";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "next-auth/react";
import { OneSignalProvider } from "@/components/tenant/onesignal-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Cổng Cư Dân - ThuNhà",
    description: "Quản lý hóa đơn và dịch vụ nhà trọ",
    themeColor: "#ffffff",
};

export default async function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    // const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;

    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.className} bg-slate-50 dark:bg-zinc-950 text-slate-900 selection:bg-indigo-500/30 overflow-x-hidden pt-safe`}>
                <SessionProvider>
                    <OneSignalProvider />
                    <div className="flex flex-col min-h-screen pb-20 lg:pb-0 mx-auto max-w-5xl bg-white dark:bg-zinc-950 shadow-sm min-h-[100dvh]">
                        <TenantHeader />

                        <main className="flex-1 w-full bg-slate-50 dark:bg-zinc-950 relative z-10 px-4 py-6 md:px-8">
                            {children}
                        </main>

                        <TenantBottomNav />
                    </div>
                    <Toaster position="top-center" />
                </SessionProvider>
            </body>
        </html>
    );
}
