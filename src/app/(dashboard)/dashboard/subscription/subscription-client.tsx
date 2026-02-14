"use client";

import { PLANS, UserPlan } from "@/lib/plans";
import { Check } from "lucide-react";
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
import { useState } from "react";
import { PaymentModal } from "@/components/subscription/payment-modal";
import { upgradePlan } from "./actions"; // Import from the new actions file

interface SubscriptionClientProps {
    currentPlan: UserPlan;
    userId: string;
}

export function SubscriptionClient({ currentPlan, userId }: SubscriptionClientProps) {
    const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);

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
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={isCurrent ? "outline" : isPopular ? "default" : "secondary"}
                                    disabled={isCurrent}
                                    onClick={() => {
                                        if (plan.price === 0) {
                                            // Free plan downgrade logic if needed, or just ignore
                                        } else {
                                            setSelectedPlan(planKey);
                                        }
                                    }}
                                >
                                    {isCurrent ? "Đang sử dụng" : plan.price === 0 ? "Bắt đầu miễn phí" : "Nâng cấp ngay"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>Cần tư vấn thêm? Liên hệ hotline 1900 xxxx để được hỗ trợ.</p>
            </div>

            {selectedPlan && (
                <PaymentModal
                    isOpen={!!selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                    planKey={selectedPlan}
                    userId={userId}
                />
            )}
        </DashboardShell>
    );
}
