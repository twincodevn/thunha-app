import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });


    return (
        <div className="min-h-screen bg-muted/40 dark:bg-zinc-950">
            {/* Background Gradient Mesh - purely decorative */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/30 blur-[100px]" />
            </div>

            <Sidebar user={user} />

            {/* Content area: shifts right on desktop for sidebar, adds bottom padding on mobile for bottom nav */}
            <div className="lg:pl-[70px] transition-all duration-300 ease-in-out">
                <Header />
                <main className="relative p-4 lg:p-6 z-10 pb-24 lg:pb-6">{children}</main>
            </div>
        </div>
    );
}
