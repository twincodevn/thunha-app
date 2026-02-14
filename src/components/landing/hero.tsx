"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-background">
            <div className="container px-4 md:px-6">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col justify-center space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                                Phần mềm quản lý nhà trọ 4.0
                            </div>
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                Quản lý nhà trọ{" "}
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    dễ dàng hơn bao giờ hết
                                </span>
                            </h1>
                            <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                                Tự động hóa việc tính tiền điện nước, xuất hóa đơn và quản lý khách thuê.
                                Tiết kiệm 90% thời gian quản lý của bạn.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 min-[400px]:flex-row">
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-105" asChild>
                                <Link href="/register">
                                    Dùng thử miễn phí
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="group" asChild>
                                <Link href="#features">
                                    Xem tính năng
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Không cần thẻ tín dụng</span>
                            </div>
                            <div className="hidden sm:block">·</div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Miễn phí trọn đời cho 3 phòng</span>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mx-auto w-full max-w-[500px] lg:max-w-none"
                    >
                        <div className="relative aspect-video overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-blue-500/10 lg:aspect-[4/3]">
                            {/* Improved Mockup Placeholder using CSS */}
                            <div className="absolute inset-0 bg-neutral-50 dark:bg-neutral-900 grid grid-cols-[240px_1fr] grid-rows-[64px_1fr]">
                                {/* Sidebar */}
                                <div className="border-r bg-white dark:bg-neutral-900 p-4 space-y-4">
                                    <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-8 animate-pulse"></div>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-10 w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" style={{ opacity: 1 - i * 0.15 }}></div>
                                    ))}
                                </div>
                                {/* Header */}
                                <div className="border-b bg-white dark:bg-neutral-900 flex items-center justify-between px-6">
                                    <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                                    <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                                </div>
                                {/* Content */}
                                <div className="p-6 bg-neutral-50/50 dark:bg-neutral-950">
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-24 bg-white dark:bg-neutral-900 rounded-lg border shadow-sm p-4 animate-pulse delay-75">
                                                <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded mb-2"></div>
                                                <div className="h-8 w-24 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-64 bg-white dark:bg-neutral-900 rounded-lg border shadow-sm p-4 animate-pulse delay-100">
                                        <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800/50 rounded flex items-end justify-between px-8 pb-4 gap-4">
                                            {[40, 70, 50, 90, 60, 80].map((h, i) => (
                                                <div key={i} className="w-full bg-blue-500/20 rounded-t" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Glows */}
                            <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
                            <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
