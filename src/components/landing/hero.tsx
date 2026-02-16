"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-40 bg-background selection:bg-blue-100 selection:text-blue-900">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-slate-950"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px] dark:bg-blue-600"></div>
            </div>

            <div className="container px-4 md:px-6 relative">
                <div className="flex flex-col items-center text-center space-y-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge variant="outline" className="px-4 py-2 rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 backdrop-blur-sm gap-2 hover:bg-blue-100 transition-colors cursor-default">
                            <Sparkles className="h-4 w-4 fill-blue-500 text-blue-500" />
                            <span className="font-semibold">Nền tảng quản lý số 1 Việt Nam</span>
                        </Badge>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
                    >
                        Quản lý nhà trọ <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                            Đẳng Cấp Pro
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-[800px] text-muted-foreground md:text-xl lg:text-2xl leading-relaxed font-light"
                    >
                        Tự động hóa 100% quy trình. Tối ưu chi phí. Nâng tầm phong cách.
                        <br className="hidden sm:block" />
                        Giải pháp toàn diện dành cho chủ nhà hiện đại.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                    >
                        <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 hover:scale-105 transition-all duration-300" asChild>
                            <Link href="/register">
                                Bắt đầu miễn phí
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full border-2 hover:bg-muted/50 backdrop-blur-sm" asChild>
                            <Link href="/demo">
                                Xem Demo
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                {/* 3D Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                    className="relative mx-auto max-w-6xl perspective-1000"
                >
                    <div className="relative rounded-xl border border-white/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl p-2 lg:p-4 ring-1 ring-black/5 dark:ring-white/10 group transform-gpu transition-transform hover:scale-[1.01] duration-500">
                        {/* Browser Bar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 mb-2">
                            <div className="flex gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="mx-auto w-1/2 h-6 rounded-md bg-muted/50 text-xs flex items-center justify-center text-muted-foreground font-mono">
                                thunha.vn/dashboard
                            </div>
                        </div>

                        {/* Mockup Image - Using standard img for now, in real prod use next/image */}
                        {/* We will simulate the dashboard content with CSS grid for better performance and no asset dependency */}
                        <div className="aspect-[16/9] w-full rounded-lg bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
                            {/* Sidebar */}
                            <div className="absolute left-0 top-0 bottom-0 w-64 border-r bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 hidden md:block">
                                <div className="h-8 w-32 bg-blue-100 dark:bg-blue-900/30 rounded mb-8 animate-pulse" />
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-10 w-full rounded-lg bg-muted/50 animate-pulse delay-75" style={{ opacity: 1 - i * 0.1 }} />
                                    ))}
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="absolute left-0 md:left-64 top-0 right-0 bottom-0 p-6 md:p-8 overflow-hidden">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                                    <div className="flex gap-4">
                                        <div className="h-10 w-24 bg-blue-600/10 rounded-lg animate-pulse" />
                                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                    </div>
                                </div>

                                {/* Grid Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 rounded-xl border bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
                                            <div className="flex justify-between">
                                                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20" />
                                                <div className="h-4 w-12 bg-green-100 text-green-700 rounded-full" />
                                            </div>
                                            <div className="h-8 w-24 bg-muted/50 rounded" />
                                        </div>
                                    ))}
                                </div>

                                {/* Chart Area */}
                                <div className="h-64 rounded-xl border bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-end">
                                    <div className="flex items-end justify-between gap-2 h-48">
                                        {[40, 70, 45, 90, 65, 85, 55, 95, 75, 60, 80, 100].map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-full bg-blue-600 rounded-t-sm opacity-80"
                                                style={{
                                                    height: `${h}%`,
                                                    background: `linear-gradient(to top, var(--tw-gradient-from), var(--tw-gradient-to))`,
                                                    '--tw-gradient-from': '#2563eb', // blue-600
                                                    '--tw-gradient-to': '#4f46e5', // indigo-600
                                                } as any}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badges */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="absolute -left-4 top-1/4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-white/20 backdrop-blur-md z-20 hidden lg:block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600"><ShieldCheck className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Bảo mật</p>
                                    <p className="font-bold text-sm">Chuẩn SSL/TLS</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.5 }}
                            className="absolute -right-4 bottom-1/4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-white/20 backdrop-blur-md z-20 hidden lg:block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Zap className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Tốc độ</p>
                                    <p className="font-bold text-sm">Xử lý &lt;100ms</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    {/* Glow behind dashboard */}
                    <div className="absolute -top-[10%] left-[10%] w-[80%] h-[50%] bg-blue-500/20 blur-[120px] -z-10 rounded-full user-select-none pointer-events-none" />
                </motion.div>
            </div>

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </section>
    );
}
