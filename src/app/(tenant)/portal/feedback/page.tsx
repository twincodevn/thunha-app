import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TenantFeedbackClient } from "./page-client";
import { MessageSquareHeart } from "lucide-react";

export default async function TenantFeedbackPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    // Attempt to find the tenant profile connected to this user
    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.id },
        include: {
            roomTenants: {
                where: { isActive: true },
                include: {
                    room: { include: { property: true } }
                }
            },
            feedbacks: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    });

    if (!tenant) {
        return (
            <div className="flex items-center justify-center p-8 h-full">
                <p className="text-slate-500 dark:text-zinc-400">Không tìm thấy thông tin khách thuê.</p>
            </div>
        );
    }

    const activeRoomTenant = tenant.roomTenants[0];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header section */}
            <div className="flex flex-col px-2 pt-2 relative z-10 space-y-1">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Đánh giá <span className="text-3xl">⭐</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-[280px]">
                    Chia sẻ trải nghiệm của bạn để chúng tôi phục vụ tốt hơn
                </p>
            </div>

            <TenantFeedbackClient
                tenantId={tenant.id}
                propertyId={activeRoomTenant?.room.propertyId}
                propertyName={activeRoomTenant?.room.property.name}
                previousFeedback={tenant.feedbacks[0]}
            />
        </div>
    );
}

