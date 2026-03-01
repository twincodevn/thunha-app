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

    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.className} bg-[#f8fafc] dark:bg-[#030712] text-slate-900 selection:bg-indigo-500/30 overflow-x-hidden pt-safe`}>
                <SessionProvider>
                    <OneSignalProvider />
                    <div className="flex flex-col min-h-[100dvh] pb-24 mx-auto w-full max-w-5xl bg-white/40 dark:bg-zinc-950/40 backdrop-blur-[2px] md:border-x md:border-slate-200/50 dark:md:border-zinc-800/50 md:shadow-2xl relative overflow-hidden">

                        {/* Mesh Gradient Background Details */}
                        <div className="absolute top-0 inset-x-0 h-[400px] w-full bg-gradient-to-b from-indigo-50/80 via-white/20 to-transparent dark:from-indigo-950/20 dark:via-zinc-950/20 dark:to-transparent pointer-events-none -z-10 blur-3xl" />

                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] rounded-[100%] bg-indigo-200/30 dark:bg-indigo-900/20 blur-[80px] pointer-events-none -z-10" />
                        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[30%] rounded-[100%] bg-purple-200/30 dark:bg-purple-900/20 blur-[80px] pointer-events-none -z-10" />

                        <TenantHeader />

                        <main className="flex-1 w-full relative z-10 px-4 py-8 md:px-6">
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
