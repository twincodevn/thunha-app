import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <Sidebar />
            <div className="lg:pl-64">
                <Header />
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
