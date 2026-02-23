"use client";

import { motion, Variants } from "framer-motion";
import {
    Zap,
    Shield,
    BarChart3,
    Receipt,
    Users,
    Building2,
    Sparkles,
    Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BentoFeatures() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 40, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20,
            },
        },
    };
    return (
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium mb-6 bg-background shadow-sm"
                    >
                        <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            Tính năng vượt trội
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-bold tracking-tight sm:text-5xl mb-4"
                    >
                        Mọi thứ bạn cần để <br />
                        <span className="text-blue-600">quản lý như chuyên gia</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-lg"
                    >
                        Không còn sổ sách rườm rà. ThuNhà mang đến trải nghiệm quản lý liền mạch,
                        tự động hóa từ A-Z.
                    </motion.p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px] lg:auto-rows-[340px]"
                >
                    {/* Feature 1: Main (Span 2 cols) */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="md:col-span-2 relative overflow-hidden rounded-3xl border bg-background p-8 group shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Tự động hóa thanh toán</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Hệ thống tự động chốt điện nước, tính tiền phòng và gửi hóa đơn cho khách qua Zalo/Email.
                                    Tích hợp cổng thanh toán VietQR quét mã là gạch nợ.
                                </p>
                            </div>

                            {/* Mockup UI Element */}
                            <div className="mt-8 relative h-32 w-full rounded-tl-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <Receipt className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                                            <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-16 rounded-full bg-green-50 text-green-600 text-xs flex items-center justify-center font-medium">
                                        Đã thu
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                                <div className="h-2 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 2: Analytics */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="relative overflow-hidden rounded-3xl border bg-background p-8 group shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Báo cáo real-time</h3>
                            <p className="text-muted-foreground text-sm">
                                Nắm bắt dòng tiền, lợi nhuận và công nợ tức thì qua biểu đồ trực quan.
                            </p>

                            <div className="mt-8 flex items-end gap-2 h-24 justify-between px-2">
                                {[30, 50, 40, 70, 50, 80].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t-sm relative group-hover:bg-indigo-500 transition-colors duration-500"
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 3: Mobile (Span 1) */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="relative overflow-hidden rounded-3xl border bg-background p-8 group shadow-lg hover:shadow-2xl transition-all duration-300 md:row-span-2"
                    >
                        <div className="absolute top-0 right-0 h-32 w-32 bg-purple-500/10 blur-3xl rounded-full" />

                        <div className="relative z-10 h-full flex flex-col">
                            <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Ứng dụng di động</h3>
                            <p className="text-muted-foreground text-sm mb-8">
                                Quản lý mọi lúc mọi nơi. Nhận thông báo ngay khi có khách thanh toán hoặc báo sự cố.
                            </p>

                            <div className="flex-1 relative mx-auto w-4/5">
                                <div className="absolute inset-0 bg-slate-900 rounded-[2rem] shadow-2xl border-4 border-slate-800 p-2 transform group-hover:scale-105 transition-transform duration-500">
                                    <div className="h-full w-full bg-background rounded-xl overflow-hidden relative">
                                        <div className="absolute top-0 w-full h-8 bg-slate-100 dark:bg-slate-800 border-b flex items-center justify-center">
                                            <div className="h-1 w-12 bg-slate-300 rounded-full" />
                                        </div>
                                        {/* Fake App UI */}
                                        <div className="mt-10 p-3 space-y-3">
                                            <div className="h-20 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                                                <div className="h-2 w-12 bg-blue-200 rounded mb-2" />
                                                <div className="h-4 w-20 bg-blue-500/40 rounded" />
                                            </div>
                                            <div className="h-20 rounded-lg bg-slate-100 border p-2"></div>
                                            <div className="h-20 rounded-lg bg-slate-100 border p-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 4: Security */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="relative overflow-hidden rounded-3xl border bg-background p-8 group shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                        <div className="absolute opacity-0 group-hover:opacity-100 inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] transition-opacity" />

                        <div className="relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mb-4">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Bảo mật tuyệt đối</h3>
                            <p className="text-muted-foreground text-sm">
                                Dữ liệu được mã hóa SSL/TLS. Sao lưu đám mây hàng ngày. Không lo mất dữ liệu.
                            </p>
                        </div>
                    </motion.div>

                    {/* Feature 5: Tenant Portal */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="relative overflow-hidden rounded-3xl border bg-background p-8 group shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                        <div className="relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center mb-4">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Cổng thông tin khách thuê</h3>
                            <p className="text-muted-foreground text-sm">
                                Khách thuê tự xem hóa đơn, báo cáo sự cố và ký hợp đồng online.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
