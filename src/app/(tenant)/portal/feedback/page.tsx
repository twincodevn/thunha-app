import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TenantFeedbackClient } from "./page-client";

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
                <p className="text-muted-foreground">Không tìm thấy thông tin khách thuê.</p>
            </div>
        );
    }

    const activeRoomTenant = tenant.roomTenants[0];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Đánh giá & Góp ý</h1>
                <p className="text-muted-foreground">
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
