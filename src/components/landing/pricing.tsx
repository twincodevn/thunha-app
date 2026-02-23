"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { motion, Variants } from "framer-motion";
import { formatCurrency } from "@/lib/billing";
import { PLAN_PRICING } from "@/lib/constants";

const plans = [
    {
        name: "Miễn phí",
        price: 0,
        description: "Dành cho chủ nhà mới bắt đầu",
        features: ["Quản lý tối đa 3 phòng", "Tính tiền điện nước cơ bản", "Xuất hóa đơn thủ công"],
        cta: "Bắt đầu ngay",
        popular: false,
    },
    {
        name: "Cơ bản",
        price: PLAN_PRICING.BASIC,
        description: "Dành cho nhà trọ quy mô nhỏ",
        features: ["Quản lý 10 phòng", "Tất cả tính năng Free", "Xuất PDF hóa đơn", "Gửi hóa đơn qua Zalo", "Hỗ trợ qua Email"],
        cta: "Dùng thử 14 ngày",
        popular: false,
    },
    {
        name: "Chuyên nghiệp",
        price: PLAN_PRICING.PRO,
        description: "Dành cho người quản lý chuyên nghiệp",
        features: ["Quản lý 30 phòng", "Trọn bộ tính năng Basic", "Báo cáo doanh thu chi tiết", "Tích hợp QR thanh toán", "Hỗ trợ ưu tiên 24/7"],
        cta: "Dùng thử 14 ngày",
        popular: true,
    },
    {
        name: "Doanh nghiệp",
        price: PLAN_PRICING.BUSINESS,
        description: "Dành cho chuỗi căn hộ dịch vụ",
        features: ["Không giới hạn số phòng", "Trọn bộ tính năng Pro", "Quản lý đa chi nhánh", "Phân quyền nhân viên", "Hợp đồng tùy chỉnh"],
        cta: "Liên hệ tư vấn",
        popular: false,
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    },
};

export function Pricing() {
    return (
        <section id="pricing" className="py-24">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                        Bảng giá minh bạch
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Không chi phí ẩn. Bắt đầu miễn phí và nâng cấp khi quy mô của bạn phát triển.
                    </p>
                </div>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
                >
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -8 }}
                            className="h-full"
                        >
                            <Card className={`flex flex-col h-full relative overflow-hidden ${plan.popular ? 'border-blue-600 shadow-xl shadow-blue-500/10 scale-105 z-10' : 'hover:shadow-lg transition-shadow'}`}>
                                {plan.popular && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                )}
                                <CardHeader className="pb-8">
                                    {plan.popular && (
                                        <div className="absolute top-4 right-4">
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                                Phổ biến
                                            </span>
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-3xl font-bold tracking-tight">
                                            {plan.price === 0 ? "0đ" : formatCurrency(plan.price)}
                                        </span>
                                        {plan.price > 0 && <span className="text-muted-foreground ml-1">/tháng</span>}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ul className="space-y-3 text-sm">
                                        {plan.features.map((feature, k) => (
                                            <li key={k} className="flex items-start gap-2">
                                                <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                        variant={plan.popular ? "default" : "outline"}
                                        asChild
                                    >
                                        <Link href="/register">{plan.cta}</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
