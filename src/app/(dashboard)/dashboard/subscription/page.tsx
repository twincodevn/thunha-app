import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, UserPlan } from "@/lib/plans";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function upgradePlan(userId: string, plan: UserPlan) {
    "use server";

    // In a real app, this would redirect to a checkout page (Stripe/VNPay)
    // For this MVP, we upgrade immediately
    await prisma.user.update({
        where: { id: userId },
        data: {
            plan,
            maxRooms: PLANS[plan].maxRooms
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subscription");
}

export default async function SubscriptionPage() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
    });

    if (!user) return null;

    const roomCount = await prisma.room.count({
        where: { property: { userId: session.user.id } },
    });

    const currentPlan = user.plan as UserPlan;

    return (
        <DashboardShell>
            <PageHeader
                title="Gói dịch vụ"
                description="Chọn gói phù hợp với quy mô nhà trọ của bạn"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(Object.keys(PLANS) as UserPlan[]).map((planKey) => {
                    const plan = PLANS[planKey];
                    const isCurrent = currentPlan === planKey;
                    const isPopular = planKey === "BASIC";

                    return (
                        <Card
                            key={planKey}
                            className={`flex flex-col relative ${isPopular ? 'border-primary shadow-lg scale-105 z-10' : ''} ${isCurrent ? 'bg-muted/50' : ''}`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                                    <Badge className="bg-primary text-primary-foreground">Phổ biến nhất</Badge>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {plan.name}
                                    {isCurrent && <Badge variant="secondary">Hiện tại</Badge>}
                                </CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">
                                        {plan.price === 0 ? "0" : (plan.price / 1000).toLocaleString("vi-VN") + ".000"}
                                    </span>
                                    <span className="text-muted-foreground text-sm"> ₫/tháng</span>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        <span>
                                            Tối đa <span className="font-bold">{plan.maxRooms > 1000 ? "Không giới hạn" : plan.maxRooms}</span> phòng
                                        </span>
                                    </li>
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}

                                    {/* Limitations visualization (optional logic could go here) */}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <form action={async () => {
                                    "use server";
                                    await upgradePlan(session.user.id, planKey);
                                }} className="w-full">
                                    <Button
                                        className="w-full"
                                        variant={isCurrent ? "outline" : isPopular ? "default" : "secondary"}
                                        disabled={isCurrent}
                                        type="submit"
                                    >
                                        {isCurrent ? "Đang sử dụng" : plan.price === 0 ? "Bắt đầu miễn phí" : "Nâng cấp ngay"}
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>Cần tư vấn thêm? Liên hệ hotline 1900 xxxx để được hỗ trợ.</p>
            </div>
        </DashboardShell>
    );
}
