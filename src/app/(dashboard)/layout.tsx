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

    // TypeScript cache sometimes hasn't caught up with Prisma generation.
    // Cast to any for the include payload to bypass Next.js stuck linter.
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            managedProperties: true,
        } as any
    });

    // Extract roles from managedProperties to determine global capabilities if needed.
    // E.g., if they are an OWNER anywhere, show everything.
    const isOwner = (user as any)?.managedProperties?.some((mp: any) => mp.role === "OWNER") || user?.plan !== "FREE";


    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] relative overflow-hidden">
            {/* Premium Mesh Gradient Background Details */}
            <div className="fixed top-0 inset-x-0 h-[500px] w-full bg-gradient-to-b from-indigo-50/80 via-white/20 to-transparent dark:from-indigo-950/20 dark:via-zinc-950/20 dark:to-transparent pointer-events-none z-0 blur-3xl opacity-80" />
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-[100px] pointer-events-none z-0" />
            <div className="fixed top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-200/20 dark:bg-blue-900/10 blur-[100px] pointer-events-none z-0" />

            {/* Layout container */}
            <div className="relative z-10 flex min-h-screen">
                <Sidebar user={user} isOwner={!!isOwner} />

                {/* Content area */}
                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                    <Header />
                    <main className="relative p-4 lg:p-6 z-10 pb-24 lg:pb-6">{children}</main>
                </div>
            </div>
        </div>
    );
}

