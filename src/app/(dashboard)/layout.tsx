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
        <div className="min-h-screen bg-muted/40 dark:bg-zinc-950">
            {/* Background Gradient Mesh - purely decorative */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/30 blur-[100px]" />
            </div>

            <Sidebar />
            <div className="lg:pl-[70px] transition-all duration-300 ease-in-out peer-[.w-64]:lg:pl-64">
                {/* 
                  Note: The padding-left logic here is a bit tricky with React state in Sidebar.
                  Ideally, Sidebar should control a context or we use CSS grid.
                  For now, let's just make the content area flexible or use a fixed padding that accommodates the collapsed state.
                  ACTUALLY, since `Sidebar` is a client component and manages its own width, 
                  we need a way to tell the layout. 
                  
                  Alternative: The Sidebar is fixed. We can just use `lg:pl-64` if we force expanded on desktop, 
                  OR we rewrite layout logic.
                  
                  Let's assume the user wants the sidebar collapsible.
                  I'll use a CSS variable or a peer selector approach if possible, or just default to 
                  a safe padding and let the sidebar float over if needed, OR better yet:
                  The Sidebar component itself is `fixed`. 
                  
                  Let's use a simplified approach: 
                  The sidebar handles its own width. The content has a left margin.
                  But since Sidebar state is local, we can't easily change the margin here without context.
                  
                  For this step, I will set a default padding and ensure it looks okay.
                  Correction: I will stick to `lg:pl-64` for now to avoid layout shift issues until I implement a SidebarContext.
                  Wait, existing Sidebar has `isCollapsed`. If I want true dynamic layout, needs Context.
                  
                  New plan for Layout: Just wrap children. The Sidebar component will handle the visual 'push' via CSS if I add it there?
                  No, `fixed` position takes it out of flow.
                  
                  For now, I'll set `lg:pl-20` (collapsed width approx) and let the sidebar expand over? 
                  No, that hides content.
                  
                  Let's use a simpler "Sidebar is always 64 on large screens" approach for the layout container, 
                  and the sidebar component itself will animate.
                  
                  Actually, the best "World Class" way is a Context. 
                  But to adhere to "Keep it simple" for this turn, I will modify Sidebar to *not* start collapsed,
                  and keep the layout `pl-64`. If the user collapses, the sidebar shrinks, and we have whitespace.
                  That's acceptable for a first pass, OR I can make the sidebar push content.
                  
                  Let's try a CSS selector trick: `peer`.
                */}
                <Header />
                <main className="relative p-4 lg:p-6 z-10">{children}</main>
            </div>
        </div>
    );
}
